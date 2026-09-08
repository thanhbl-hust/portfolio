import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Outlines, RoundedBox } from '@react-three/drei'
import { Quaternion, Vector3 } from 'three'

const OUTLINE_COLOR = '#15130f'

const COURT_NET_Z = -1.5
const COURT_HALF_WIDTH = 2.5
const COURT_HALF_LENGTH = 5
const COURT_KITCHEN_DEPTH = 1.6
const COURT_LINE_COLOR = '#f2f2f2'

function PickleballCourt() {
  const nearBaseline = COURT_NET_Z + COURT_HALF_LENGTH
  const farBaseline = COURT_NET_Z - COURT_HALF_LENGTH
  const nearKitchenLine = COURT_NET_Z + COURT_KITCHEN_DEPTH
  const farKitchenLine = COURT_NET_Z - COURT_KITCHEN_DEPTH
  const courtWidth = COURT_HALF_WIDTH * 2

  return (
    <group>
      {/* court surface */}
      <mesh position={[0, 0, COURT_NET_Z]} receiveShadow>
        <boxGeometry args={[courtWidth, 0.05, COURT_HALF_LENGTH * 2]} />
        <meshStandardMaterial color="#3f9142" roughness={0.85} />
      </mesh>

      {/* kitchen (non-volley) zones, slightly lighter */}
      <mesh position={[0, 0.026, (nearKitchenLine + COURT_NET_Z) / 2]} receiveShadow>
        <boxGeometry args={[courtWidth, 0.001, COURT_KITCHEN_DEPTH]} />
        <meshStandardMaterial color="#4fab52" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.026, (farKitchenLine + COURT_NET_Z) / 2]} receiveShadow>
        <boxGeometry args={[courtWidth, 0.001, COURT_KITCHEN_DEPTH]} />
        <meshStandardMaterial color="#4fab52" roughness={0.85} />
      </mesh>

      {/* sidelines */}
      <mesh position={[-COURT_HALF_WIDTH + 0.03, 0.03, COURT_NET_Z]}>
        <boxGeometry args={[0.06, 0.01, COURT_HALF_LENGTH * 2]} />
        <meshStandardMaterial color={COURT_LINE_COLOR} />
      </mesh>
      <mesh position={[COURT_HALF_WIDTH - 0.03, 0.03, COURT_NET_Z]}>
        <boxGeometry args={[0.06, 0.01, COURT_HALF_LENGTH * 2]} />
        <meshStandardMaterial color={COURT_LINE_COLOR} />
      </mesh>

      {/* baselines */}
      <mesh position={[0, 0.03, nearBaseline - 0.03]}>
        <boxGeometry args={[courtWidth, 0.01, 0.06]} />
        <meshStandardMaterial color={COURT_LINE_COLOR} />
      </mesh>
      <mesh position={[0, 0.03, farBaseline + 0.03]}>
        <boxGeometry args={[courtWidth, 0.01, 0.06]} />
        <meshStandardMaterial color={COURT_LINE_COLOR} />
      </mesh>

      {/* kitchen lines */}
      <mesh position={[0, 0.03, nearKitchenLine]}>
        <boxGeometry args={[courtWidth, 0.01, 0.06]} />
        <meshStandardMaterial color={COURT_LINE_COLOR} />
      </mesh>
      <mesh position={[0, 0.03, farKitchenLine]}>
        <boxGeometry args={[courtWidth, 0.01, 0.06]} />
        <meshStandardMaterial color={COURT_LINE_COLOR} />
      </mesh>

      {/* center service lines, baseline to kitchen line on each side */}
      <mesh position={[0, 0.03, (nearBaseline + nearKitchenLine) / 2]}>
        <boxGeometry args={[0.06, 0.01, nearBaseline - nearKitchenLine]} />
        <meshStandardMaterial color={COURT_LINE_COLOR} />
      </mesh>
      <mesh position={[0, 0.03, (farBaseline + farKitchenLine) / 2]}>
        <boxGeometry args={[0.06, 0.01, farBaseline - farKitchenLine]} />
        <meshStandardMaterial color={COURT_LINE_COLOR} />
      </mesh>

      {/* net posts */}
      <mesh position={[-COURT_HALF_WIDTH - 0.15, 0.55, COURT_NET_Z]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.1, 8]} />
        <meshStandardMaterial color="#1c1c1c" />
      </mesh>
      <mesh position={[COURT_HALF_WIDTH + 0.15, 0.55, COURT_NET_Z]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.1, 8]} />
        <meshStandardMaterial color="#1c1c1c" />
      </mesh>

      {/* net mesh + top tape */}
      <mesh position={[0, 0.5, COURT_NET_Z]} castShadow>
        <boxGeometry args={[courtWidth + 0.3, 0.85, 0.02]} />
        <meshStandardMaterial color="#0e0e0e" transparent opacity={0.55} />
      </mesh>
      <mesh position={[0, 0.93, COURT_NET_Z]}>
        <boxGeometry args={[courtWidth + 0.3, 0.06, 0.03]} />
        <meshStandardMaterial color={COURT_LINE_COLOR} />
      </mesh>
    </group>
  )
}

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
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial color="#e8e13a" roughness={0.5} />
        <Outlines color={OUTLINE_COLOR} thickness={0.0025} />
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
        <Outlines color={OUTLINE_COLOR} thickness={0.003} />
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
        <Outlines color={OUTLINE_COLOR} thickness={0.003} />
      </RoundedBox>

      {/* paddle face - proud of the bumper on both sides */}
      <RoundedBox args={[0.29, 0.36, 0.026]} radius={0.03} smoothness={4} position={[0, 0.475, 0.025]} castShadow>
        <meshStandardMaterial color={faceColor} roughness={0.6} />
        <Outlines color={OUTLINE_COLOR} thickness={0.002} />
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
          <Outlines color={OUTLINE_COLOR} thickness={0.006} />
        </mesh>
      ) : (
        <>
          <mesh position={[-0.16, 0.4, 0]} castShadow>
            <boxGeometry args={[0.26, 0.8, 0.3]} />
            <meshStandardMaterial color={outfit} />
            <Outlines color={OUTLINE_COLOR} thickness={0.006} />
          </mesh>
          <mesh position={[0.16, 0.4, 0]} castShadow>
            <boxGeometry args={[0.26, 0.8, 0.3]} />
            <meshStandardMaterial color={outfit} />
            <Outlines color={OUTLINE_COLOR} thickness={0.006} />
          </mesh>
        </>
      )}

      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[0.7, 0.7, 0.4]} />
        <meshStandardMaterial color={outfitAccent} />
        <Outlines color={OUTLINE_COLOR} thickness={0.006} />
      </mesh>

      <mesh position={[-0.5, 1.15, 0]} castShadow>
        <boxGeometry args={[0.22, 0.65, 0.22]} />
        <meshStandardMaterial color={skin} />
        <Outlines color={OUTLINE_COLOR} thickness={0.005} />
      </mesh>
      <mesh position={[0.5, 1.15, 0]} castShadow>
        <boxGeometry args={[0.22, 0.65, 0.22]} />
        <meshStandardMaterial color={skin} />
        <Outlines color={OUTLINE_COLOR} thickness={0.005} />
      </mesh>

      {holdsPaddle && <PickleballPaddle position={[0.6, 0.82, 0.1]} rotation={[0.15, 0, -0.12]} />}

      <mesh position={[0, 1.85, 0]} castShadow>
        <boxGeometry args={[0.52, 0.52, 0.52]} />
        <meshStandardMaterial color={skin} />
        <Outlines color={OUTLINE_COLOR} thickness={0.006} />
      </mesh>

      <mesh position={[0, 2.06, isFemale ? -0.04 : 0]} castShadow>
        <boxGeometry args={isFemale ? [0.58, 0.32, 0.58] : [0.56, 0.18, 0.56]} />
        <meshStandardMaterial color={hair} />
        <Outlines color={OUTLINE_COLOR} thickness={0.005} />
      </mesh>
      {isFemale && (
        <mesh position={[0, 1.8, -0.24]} castShadow>
          <boxGeometry args={[0.48, 0.24, 0.14]} />
          <meshStandardMaterial color={hair} />
          <Outlines color={OUTLINE_COLOR} thickness={0.005} />
        </mesh>
      )}

      {isFemale && (
        <group position={[0, 1.89, 0.27]}>
          {/* rims */}
          <RoundedBox args={[0.23, 0.19, 0.025]} radius={0.03} smoothness={4} position={[-0.15, 0, 0]} castShadow>
            <meshStandardMaterial color="#1c1c1c" />
            <Outlines color={OUTLINE_COLOR} thickness={0.002} />
          </RoundedBox>
          <RoundedBox args={[0.23, 0.19, 0.025]} radius={0.03} smoothness={4} position={[0.15, 0, 0]} castShadow>
            <meshStandardMaterial color="#1c1c1c" />
            <Outlines color={OUTLINE_COLOR} thickness={0.002} />
          </RoundedBox>

          {/* lenses - inset, lighter, and slightly proud of the rim */}
          <RoundedBox args={[0.17, 0.13, 0.006]} radius={0.02} smoothness={4} position={[-0.15, 0, 0.017]}>
            <meshStandardMaterial color="#dbe9f5" transparent opacity={0.55} roughness={0.15} />
          </RoundedBox>
          <RoundedBox args={[0.17, 0.13, 0.006]} radius={0.02} smoothness={4} position={[0.15, 0, 0.017]}>
            <meshStandardMaterial color="#dbe9f5" transparent opacity={0.55} roughness={0.15} />
          </RoundedBox>

          {/* bridge */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.08, 0.025, 0.02]} />
            <meshStandardMaterial color="#1c1c1c" />
          </mesh>

          {/* temple arms */}
          <mesh position={[-0.28, 0, -0.09]} rotation={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[0.02, 0.02, 0.18]} />
            <meshStandardMaterial color="#1c1c1c" />
          </mesh>
          <mesh position={[0.28, 0, -0.09]} rotation={[0, -0.3, 0]} castShadow>
            <boxGeometry args={[0.02, 0.02, 0.18]} />
            <meshStandardMaterial color="#1c1c1c" />
          </mesh>
        </group>
      )}
    </group>
  )
}

export function PeopleScene() {
  return (
    <div className="scene3d">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 5, 11], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.75} />
        <directionalLight
          position={[4, 8, 4]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
          shadow-camera-near={1}
          shadow-camera-far={25}
        />

        <PickleballCourt />

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

        <OrbitControls
          enablePan={false}
          minDistance={2.5}
          maxDistance={22}
          minPolarAngle={0.15}
          maxPolarAngle={Math.PI / 2 - 0.02}
          target={[0, 0.8, -1]}
        />
      </Canvas>
    </div>
  )
}
