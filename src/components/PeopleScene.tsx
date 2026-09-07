import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls, RoundedBox } from '@react-three/drei'
import { Quaternion, Vector3 } from 'three'

function Pickleball({ position }: { position: [number, number, number] }) {
  const radius = 0.055
  const holeCount = 26

  const holes = useMemo(() => {
    const up = new Vector3(0, 1, 0)
    const points: { position: [number, number, number]; quaternion: Quaternion }[] = []
    const golden = Math.PI * (3 - Math.sqrt(5))

    for (let i = 0; i < holeCount; i++) {
      const y = 1 - (i / (holeCount - 1)) * 2
      const r = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = golden * i
      const normal = new Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r)
      points.push({
        position: [normal.x * radius * 1.02, normal.y * radius * 1.02, normal.z * radius * 1.02],
        quaternion: new Quaternion().setFromUnitVectors(up, normal),
      })
    }
    return points
  }, [])

  return (
    <group position={position}>
      <mesh castShadow>
        <sphereGeometry args={[radius, 24, 24]} />
        <meshStandardMaterial color="#e8e13a" roughness={0.5} />
      </mesh>
      {holes.map((hole, i) => (
        <mesh key={i} position={hole.position} quaternion={hole.quaternion}>
          <cylinderGeometry args={[0.009, 0.009, 0.005, 8]} />
          <meshStandardMaterial color="#8f8a1e" />
        </mesh>
      ))}
    </group>
  )
}

function PickleballPaddle({
  position,
  rotation,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
}) {
  const gripColor = '#232323'
  const guardColor = '#1c1c1c'
  const faceColor = '#2f9e6b'
  const accentColor = '#eef4ee'

  return (
    <group position={position} rotation={rotation}>
      {/* butt cap */}
      <mesh position={[0, 0.015, 0]} castShadow>
        <sphereGeometry args={[0.032, 12, 12]} />
        <meshStandardMaterial color={gripColor} />
      </mesh>

      {/* handle */}
      <mesh position={[0, 0.115, 0]} castShadow>
        <cylinderGeometry args={[0.036, 0.04, 0.2, 16]} />
        <meshStandardMaterial color={gripColor} roughness={0.85} />
      </mesh>

      {/* grip wrap rings */}
      {[0.06, 0.115, 0.17].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.04, 0.007, 8, 16]} />
          <meshStandardMaterial color="#3a3a3a" />
        </mesh>
      ))}

      {/* throat / neck */}
      <mesh position={[0, 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.038, 0.05, 16]} />
        <meshStandardMaterial color={guardColor} />
      </mesh>

      {/* edge guard (bumper) */}
      <RoundedBox args={[0.34, 0.42, 0.05]} radius={0.045} smoothness={4} position={[0, 0.475, 0]} castShadow>
        <meshStandardMaterial color={guardColor} />
      </RoundedBox>

      {/* paddle face - proud of the bumper on both sides */}
      <RoundedBox args={[0.29, 0.36, 0.026]} radius={0.03} smoothness={4} position={[0, 0.475, 0.025]} castShadow>
        <meshStandardMaterial color={faceColor} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[0.29, 0.36, 0.026]} radius={0.03} smoothness={4} position={[0, 0.475, -0.025]} castShadow>
        <meshStandardMaterial color={faceColor} roughness={0.6} />
      </RoundedBox>

      {/* sweet-spot logo dot */}
      <mesh position={[0, 0.475, 0.041]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.006, 20]} />
        <meshStandardMaterial color={accentColor} />
      </mesh>

      {/* textured grit lines across the face */}
      {[0.34, 0.475, 0.61].map((y) => (
        <mesh key={y} position={[0, y, 0.039]}>
          <boxGeometry args={[0.24, 0.012, 0.004]} />
          <meshStandardMaterial color="#1f7a52" />
        </mesh>
      ))}
    </group>
  )
}

type PersonProps = {
  position: [number, number, number]
  skin: string
  hair: string
  outfit: string
  outfitAccent: string
  isFemale: boolean
  holdsPaddle?: boolean
}

function BlockyPerson({ position, skin, hair, outfit, outfitAccent, isFemale, holdsPaddle }: PersonProps) {
  return (
    <group position={position}>
      {isFemale ? (
        <mesh position={[0, 0.4, 0]} castShadow>
          <coneGeometry args={[0.42, 0.8, 4]} />
          <meshStandardMaterial color={outfit} />
        </mesh>
      ) : (
        <>
          <mesh position={[-0.16, 0.4, 0]} castShadow>
            <boxGeometry args={[0.26, 0.8, 0.3]} />
            <meshStandardMaterial color={outfit} />
          </mesh>
          <mesh position={[0.16, 0.4, 0]} castShadow>
            <boxGeometry args={[0.26, 0.8, 0.3]} />
            <meshStandardMaterial color={outfit} />
          </mesh>
        </>
      )}

      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[0.7, 0.7, 0.4]} />
        <meshStandardMaterial color={outfitAccent} />
      </mesh>

      <mesh position={[-0.5, 1.15, 0]} castShadow>
        <boxGeometry args={[0.22, 0.65, 0.22]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <mesh position={[0.5, 1.15, 0]} castShadow>
        <boxGeometry args={[0.22, 0.65, 0.22]} />
        <meshStandardMaterial color={skin} />
      </mesh>

      {holdsPaddle && <PickleballPaddle position={[0.6, 0.82, 0.1]} rotation={[0.15, 0, -0.12]} />}

      <mesh position={[0, 1.85, 0]} castShadow>
        <boxGeometry args={[0.52, 0.52, 0.52]} />
        <meshStandardMaterial color={skin} />
      </mesh>

      <mesh position={[0, 2.06, isFemale ? -0.04 : 0]} castShadow>
        <boxGeometry args={isFemale ? [0.58, 0.32, 0.58] : [0.56, 0.18, 0.56]} />
        <meshStandardMaterial color={hair} />
      </mesh>
      {isFemale && (
        <mesh position={[0, 1.6, -0.24]} castShadow>
          <boxGeometry args={[0.48, 0.6, 0.14]} />
          <meshStandardMaterial color={hair} />
        </mesh>
      )}
    </group>
  )
}

export function PeopleScene() {
  return (
    <div className="scene3d">
      <Canvas shadows camera={{ position: [0, 1.6, 4.5], fov: 45 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 2]} intensity={1.2} castShadow />

        <BlockyPerson
          position={[-0.7, 0, 0]}
          skin="#e8b98d"
          hair="#2b2118"
          outfit="#2b3a55"
          outfitAccent="#3f5372"
          isFemale={false}
          holdsPaddle
        />
        <BlockyPerson
          position={[0.7, 0, 0]}
          skin="#f0c9a6"
          hair="#5a3825"
          outfit="#b2445f"
          outfitAccent="#c85c76"
          isFemale
        />

        <Pickleball position={[-0.05, 1.2, 0.28]} />

        <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={4} blur={2.4} far={2} />

        <OrbitControls enablePan={false} minDistance={2.5} maxDistance={8} target={[0, 1, 0]} />
      </Canvas>
    </div>
  )
}
