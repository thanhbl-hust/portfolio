import { useEffect } from 'react'
import type { RefObject } from 'react'
import { BufferAttribute, Matrix4, Mesh, MeshStandardMaterial } from 'three'
import type { BufferGeometry, Material, Object3D } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

type Bucket = {
  anchor: Object3D
  roughness: number
  metalness: number
  castShadow: boolean
  receiveShadow: boolean
  geometries: BufferGeometry[]
  sources: Mesh[]
}

/**
 * Draws the static blocks under `root` in as few calls as it can. The scene is
 * authored as a few hundred small boxes, and every mesh costs a draw call - plus
 * one more per shadow-casting light. After mount, each plain opaque mesh is
 * baked into one geometry per bucket (same anchor, same material settings,
 * same shadow flags), its colour moved into vertex colours, and the original is
 * hidden. The JSX stays the source of truth; only what gets drawn changes.
 *
 * Anchors are the groups that move every frame - a leg, the head. A block is
 * merged into its nearest anchor so it keeps moving with the part it belongs
 * to; `root` always counts as one. Meshes with children are left alone (that
 * is where an <Outlines> hull hangs), as are transparent or textured ones.
 *
 * Re-runs when `deps` change, e.g. when the court recolours with the theme: the
 * cleanup shows the originals again, React has already given them their new
 * colours, and the batch is rebuilt from them.
 */
export function useStaticBatch(
  root: RefObject<Object3D | null>,
  anchors: RefObject<Object3D | null>[],
  deps: unknown[],
) {
  useEffect(() => {
    const top = root.current
    if (!top) return

    const anchorSet = new Set<Object3D>([top])
    for (const anchor of anchors) if (anchor.current) anchorSet.add(anchor.current)
    top.updateWorldMatrix(true, true)

    const buckets = new Map<string, Bucket>()
    const toAnchor = new Matrix4()

    top.traverse((object) => {
      if (!(object instanceof Mesh) || !object.visible || object.children.length > 0) return
      const material = object.material
      if (!(material instanceof MeshStandardMaterial) || material.transparent || material.map) return

      let anchor = object.parent
      while (anchor && !anchorSet.has(anchor)) anchor = anchor.parent
      if (!anchor) return

      const key = [anchor.uuid, material.roughness, material.metalness, object.castShadow, object.receiveShadow].join('|')
      let bucket = buckets.get(key)
      if (!bucket) {
        bucket = {
          anchor,
          roughness: material.roughness,
          metalness: material.metalness,
          castShadow: object.castShadow,
          receiveShadow: object.receiveShadow,
          geometries: [],
          sources: [],
        }
        buckets.set(key, bucket)
      }

      const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone()
      // Boxes, spheres and rounded boxes carry different extras (uvs, groups);
      // keep only what all of them share, or they won't merge.
      for (const name of Object.keys(geometry.attributes)) {
        if (name !== 'position' && name !== 'normal') geometry.deleteAttribute(name)
      }
      geometry.clearGroups()
      toAnchor.copy(anchor.matrixWorld).invert().multiply(object.matrixWorld)
      geometry.applyMatrix4(toAnchor)

      // material.color is already in linear space, which is what vertex
      // colours are read as - so the block keeps exactly the colour it had.
      const count = geometry.getAttribute('position').count
      const colors = new Float32Array(count * 3)
      for (let i = 0; i < count; i += 1) {
        colors[i * 3] = material.color.r
        colors[i * 3 + 1] = material.color.g
        colors[i * 3 + 2] = material.color.b
      }
      geometry.setAttribute('color', new BufferAttribute(colors, 3))

      bucket.geometries.push(geometry)
      bucket.sources.push(object)
    })

    const batches: Mesh[] = []
    const hidden: Mesh[] = []
    for (const bucket of buckets.values()) {
      // A bucket of one saves nothing.
      const merged = bucket.sources.length > 1 ? mergeGeometries(bucket.geometries) : null
      for (const geometry of bucket.geometries) geometry.dispose()
      if (!merged) continue

      const batch = new Mesh(
        merged,
        new MeshStandardMaterial({ vertexColors: true, roughness: bucket.roughness, metalness: bucket.metalness }),
      )
      batch.castShadow = bucket.castShadow
      batch.receiveShadow = bucket.receiveShadow
      bucket.anchor.add(batch)
      batches.push(batch)
      for (const source of bucket.sources) {
        source.visible = false
        hidden.push(source)
      }
    }

    return () => {
      for (const batch of batches) {
        batch.removeFromParent()
        batch.geometry.dispose()
        ;(batch.material as Material).dispose()
      }
      for (const source of hidden) source.visible = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
