import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Outlines, RoundedBox } from '@react-three/drei'
import { Group, Quaternion, Vector3 } from 'three'

const OUTLINE_COLOR = '#15130f'

const COURT_NET_Z = -1.5
const COURT_HALF_WIDTH = 2.5
const COURT_HALF_LENGTH = 5
const COURT_KITCHEN_DEPTH = 1.6
const COURT_LINE_COLOR = '#f2f2f2'

const BALL_RADIUS = 0.075

/** Smoothly interpolates between keyframes given as [time, value] pairs,
 * sorted by time. Outside the range it holds the first/last value. */
function keyframe(t: number, keys: [number, number][]): number {
  if (t <= keys[0][0]) return keys[0][1]
  const last = keys[keys.length - 1]
  if (t >= last[0]) return last[1]

  for (let i = 0; i < keys.length - 1; i += 1) {
    const [t0, v0] = keys[i]
    const [t1, v1] = keys[i + 1]
    if (t >= t0 && t <= t1) {
      const u = (t - t0) / (t1 - t0)
      return v0 + (v1 - v0) * (u * u * (3 - 2 * u))
    }
  }
  return last[1]
}

/** Seconds to the nearest occurrence of an event that repeats every
 * `period`, negative before the event and positive after it. */
function timeToEvent(t: number, eventTime: number, period: number): number {
  let dt = (t - eventTime) % period
  if (dt > period / 2) dt -= period
  if (dt < -period / 2) dt += period
  return dt
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

type RallyConfig = {
  fromX: number
  fromZ: number
  toX: number
  toZ: number
  baseHeight: number
  arcHeight: number
  cycleSeconds: number
}

/** The rally is fully deterministic, so both the ball and the players'
 * heads (which track it) can read the same trajectory from the clock. */
function ballPositionAt(t: number, c: RallyConfig): { x: number; y: number; z: number } {
  const phase = (t % (c.cycleSeconds * 2)) / c.cycleSeconds
  const forward = phase < 1
  const localT = forward ? phase : phase - 1

  const startX = forward ? c.fromX : c.toX
  const startZ = forward ? c.fromZ : c.toZ
  const endX = forward ? c.toX : c.fromX
  const endZ = forward ? c.toZ : c.fromZ

  // The endpoints are the paddle faces themselves (see CONTACT_OFFSET), so
  // the ball starts and finishes exactly on the paddle.
  const hitX = startX
  const hitZ = startZ
  const receiveX = endX
  const receiveZ = endZ

  // Bounce past the net so the ball is still high when it crosses the net.
  const netFraction = (COURT_NET_Z - startZ) / (endZ - startZ)
  const bounceFraction = netFraction + (1 - netFraction) * 0.3
  const bounceX = startX + (endX - startX) * bounceFraction
  const bounceZ = startZ + (endZ - startZ) * bounceFraction

  // Constant horizontal speed + a parabolic height curve, i.e. what a toss
  // under constant gravity actually looks like.
  if (localT < 0.5) {
    const subT = localT / 0.5
    return {
      x: hitX + (bounceX - hitX) * subT,
      y: c.baseHeight + (BALL_RADIUS - c.baseHeight) * subT + 4 * c.arcHeight * subT * (1 - subT),
      z: hitZ + (bounceZ - hitZ) * subT,
    }
  }

  const subT = (localT - 0.5) / 0.5
  return {
    x: bounceX + (receiveX - bounceX) * subT,
    y: BALL_RADIUS + (c.baseHeight - BALL_RADIUS) * subT + 4 * (c.arcHeight * 0.45) * subT * (1 - subT),
    z: bounceZ + (receiveZ - bounceZ) * subT,
  }
}

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
  const radius = BALL_RADIUS
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
  faceColor = '#2f9e6b',
  faceShade = '#1f7a52',
  gripColor = '#232323',
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  faceColor?: string
  faceShade?: string
  gripColor?: string
}) {
  const guardColor = '#1c1c1c'
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
          <meshStandardMaterial color={faceShade} />
        </mesh>
      ))}
    </group>
  )
}

function RallyingBall({ config }: { config: RallyConfig }) {
  const groupRef = useRef<Group>(null)

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (!group) return
    const { x, y, z } = ballPositionAt(clock.getElapsedTime(), config)
    group.position.set(x, y, z)
  })

  return (
    <group ref={groupRef}>
      <Pickleball position={[0, 0, 0]} />
    </group>
  )
}

type PersonProps = {
  position: [number, number, number]
  rotationY?: number
  skin: string
  skinShade: string
  hair: string
  outfit: string
  outfitAccent: string
  isFemale: boolean
  holdsPaddle?: boolean
  paddleFaceColor?: string
  paddleFaceShade?: string
  paddleGripColor?: string
  swingHitTime: number
  swingPeriod: number
  rally: RallyConfig
}

const HIP_Y = 0.78
const SHOULDER_Y = 1.47
const NECK_Y = 1.55

function BlockyPerson({
  position,
  rotationY = 0,
  skin,
  skinShade,
  hair,
  outfit,
  outfitAccent,
  isFemale,
  holdsPaddle,
  paddleFaceColor,
  paddleFaceShade,
  paddleGripColor,
  swingHitTime,
  swingPeriod,
  rally,
}: PersonProps) {
  const rootRef = useRef<Group>(null)
  const torsoRef = useRef<Group>(null)
  const headRef = useRef<Group>(null)
  const paddleArmRef = useRef<Group>(null)
  const freeArmRef = useRef<Group>(null)
  const legFrontRef = useRef<Group>(null)
  const legBackRef = useRef<Group>(null)

  const idleSeed = useMemo(() => Math.random() * Math.PI * 2, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const cycle = swingPeriod / 2

    // Own contact, and the opponent's contact half a period later - real
    // players time their split step to the opponent's strike.
    const dtHit = timeToEvent(t, swingHitTime, swingPeriod)
    const dtSplit = timeToEvent(t, swingHitTime + cycle, swingPeriod)

    // Wind up behind the body, whip through contact at dt = 0, then follow
    // through and relax: an asymmetric swing rather than a symmetric pulse.
    const swing = keyframe(dtHit, [
      [-0.75, 0],
      [-0.34, -1.15],
      [-0.1, -0.95],
      [0, 0.2],
      [0.22, 0.85],
      [0.7, 0],
    ])
    const twist = keyframe(dtHit, [
      [-0.75, 0],
      [-0.34, 0.32],
      [0, -0.12],
      [0.24, -0.38],
      [0.7, 0],
    ])

    // Split step: small hop up, then land into a bent-knee ready stance.
    const hop = keyframe(dtSplit, [
      [-0.34, 0],
      [-0.13, 0.12],
      [0, 0.03],
      [0.13, 0],
      [0.45, 0],
    ])
    const crouch = keyframe(dtSplit, [
      [-0.34, 0],
      [0, 0.06],
      [0.14, 0.34],
      [0.5, 0.1],
    ])

    // Step into the shot with the front leg, back leg trails.
    const stride = keyframe(dtHit, [
      [-0.6, 0],
      [-0.22, -0.28],
      [0.06, 0.3],
      [0.55, 0],
    ])

    // Bouncing on the toes: always at or above the court, never below it.
    const idleBob = (Math.sin(t * 2.6 + idleSeed) * 0.5 + 0.5) * 0.02
    const idleSway = Math.sin(t * 1.7 + idleSeed) * 0.02

    const root = rootRef.current
    if (root) {
      // The landing is read as knee bend (torso dipping into the hips), not
      // as the whole body sinking - otherwise the feet go through the court.
      root.position.y = Math.max(0, idleBob + hop)
      root.rotation.z = idleSway
      // Lean into the shot a little as the swing comes through.
      root.rotation.x = clamp(-swing * 0.06, -0.12, 0.12)
    }

    const torso = torsoRef.current
    if (torso) {
      torso.rotation.y = twist
      // Offset from the hip height - not a replacement for it, or the whole
      // upper body drops to the floor and swallows the legs.
      torso.position.y = HIP_Y - crouch * 0.22
    }

    const paddleArm = paddleArmRef.current
    if (paddleArm) {
      paddleArm.rotation.x = swing
      paddleArm.rotation.z = clamp(-0.25 - swing * 0.18, -0.7, 0.2)
    }

    const freeArm = freeArmRef.current
    if (freeArm) {
      // Counter-balances the swinging arm.
      freeArm.rotation.x = -swing * 0.45
      freeArm.rotation.z = clamp(0.25 + swing * 0.12, -0.2, 0.7)
    }

    const legFront = legFrontRef.current
    const legBack = legBackRef.current
    if (legFront && legBack) {
      const shuffle = Math.sin(t * 5.2 + idleSeed) * 0.04
      legFront.rotation.x = stride - crouch * 0.45 + shuffle
      legBack.rotation.x = -stride * 0.55 - crouch * 0.3 - shuffle
    }

    // Head follows the ball, like a player actually watching the rally.
    const head = headRef.current
    if (head) {
      const ball = ballPositionAt(t, rally)
      const dx = ball.x - position[0]
      const dz = ball.z - position[2]
      const yawWorld = Math.atan2(dx, dz)
      const yawLocal = Math.atan2(
        Math.sin(yawWorld - rotationY - twist),
        Math.cos(yawWorld - rotationY - twist),
      )
      const horizontal = Math.hypot(dx, dz)
      const dy = ball.y - (position[1] + NECK_Y + 0.3)
      head.rotation.y = clamp(yawLocal, -0.85, 0.85)
      head.rotation.x = clamp(-Math.atan2(dy, Math.max(horizontal, 0.001)), -0.4, 0.45)
    }
  })

  const shoeColor = '#f4f1e8'
  const soleColor = '#4a4a4a'
  const sockColor = '#ffffff'

  const leg = (side: 1 | -1) => (
    <>
      {/* thigh (shorts) */}
      <mesh position={[0, -0.13, 0]} castShadow>
        <boxGeometry args={[0.26, 0.26, 0.3]} />
        <meshStandardMaterial color={outfit} />
        <Outlines color={OUTLINE_COLOR} thickness={0.006} />
      </mesh>
      {/* knee */}
      <mesh position={[0, -0.28, 0.005]} castShadow>
        <boxGeometry args={[0.235, 0.08, 0.285]} />
        <meshStandardMaterial color={skinShade} />
      </mesh>
      {/* shin */}
      <mesh position={[0, -0.43, 0]} castShadow>
        <boxGeometry args={[0.225, 0.24, 0.26]} />
        <meshStandardMaterial color={skin} />
        <Outlines color={OUTLINE_COLOR} thickness={0.005} />
      </mesh>
      {/* sock */}
      <mesh position={[0, -0.59, 0]} castShadow>
        <boxGeometry args={[0.245, 0.1, 0.28]} />
        <meshStandardMaterial color={sockColor} />
      </mesh>
      {/* shoe upper */}
      <mesh position={[0, -0.66, 0.04 * side]} castShadow>
        <boxGeometry args={[0.28, 0.09, 0.34]} />
        <meshStandardMaterial color={shoeColor} />
        <Outlines color={OUTLINE_COLOR} thickness={0.004} />
      </mesh>
      {/* sole - sits just on top of the court surface */}
      <mesh position={[0, -0.725, 0.04 * side]} castShadow>
        <boxGeometry args={[0.29, 0.05, 0.35]} />
        <meshStandardMaterial color={soleColor} />
      </mesh>
    </>
  )

  const arm = (holding: boolean) => (
    <>
      {/* upper arm (sleeve) */}
      <mesh position={[0, -0.16, 0]} castShadow>
        <boxGeometry args={[0.23, 0.32, 0.23]} />
        <meshStandardMaterial color={outfitAccent} />
        <Outlines color={OUTLINE_COLOR} thickness={0.005} />
      </mesh>
      {/* elbow */}
      <mesh position={[0, -0.335, 0]} castShadow>
        <boxGeometry args={[0.205, 0.06, 0.205]} />
        <meshStandardMaterial color={skinShade} />
      </mesh>
      {/* forearm */}
      <mesh position={[0, -0.48, 0]} castShadow>
        <boxGeometry args={[0.2, 0.26, 0.2]} />
        <meshStandardMaterial color={skin} />
        <Outlines color={OUTLINE_COLOR} thickness={0.005} />
      </mesh>
      {/* wristband */}
      <mesh position={[0, -0.625, 0]} castShadow>
        <boxGeometry args={[0.215, 0.06, 0.215]} />
        <meshStandardMaterial color={holding ? '#ffffff' : outfit} />
      </mesh>
      {/* hand */}
      <mesh position={[0, -0.71, 0.01]} castShadow>
        <boxGeometry args={[0.19, 0.14, 0.22]} />
        <meshStandardMaterial color={skin} />
        <Outlines color={OUTLINE_COLOR} thickness={0.004} />
      </mesh>
    </>
  )

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <group ref={rootRef}>
        {/* legs pivot at the hips */}
        <group ref={legFrontRef} position={[0.16, HIP_Y, 0]}>
          {leg(1)}
        </group>
        <group ref={legBackRef} position={[-0.16, HIP_Y, 0]}>
          {leg(-1)}
        </group>

        {/* everything above the waist rotates into the shot together */}
        <group ref={torsoRef} position={[0, HIP_Y, 0]}>
          {/* waist */}
          <mesh position={[0, 0.175, 0]} castShadow>
            <boxGeometry args={[0.66, 0.35, 0.38]} />
            <meshStandardMaterial color={outfitAccent} />
            <Outlines color={OUTLINE_COLOR} thickness={0.006} />
          </mesh>
          {/* chest */}
          <mesh position={[0, 0.525, 0]} castShadow>
            <boxGeometry args={[0.7, 0.35, 0.4]} />
            <meshStandardMaterial color={outfitAccent} />
            <Outlines color={OUTLINE_COLOR} thickness={0.006} />
          </mesh>
          {/* chest logo */}
          <mesh position={[0.17, 0.56, 0.205]}>
            <boxGeometry args={[0.12, 0.12, 0.015]} />
            <meshStandardMaterial color={outfit} />
          </mesh>
          {/* collar */}
          <mesh position={[0, 0.715, 0]} castShadow>
            <boxGeometry args={[0.44, 0.06, 0.32]} />
            <meshStandardMaterial color={outfit} />
          </mesh>

          {/* head pivots at the neck and tracks the ball */}
          <group ref={headRef} position={[0, NECK_Y - HIP_Y, 0]}>
            <mesh position={[0, 0.01, 0]} castShadow>
              <boxGeometry args={[0.2, 0.14, 0.2]} />
              <meshStandardMaterial color={skinShade} />
            </mesh>
            <mesh position={[0, 0.3, 0]} castShadow>
              <boxGeometry args={[0.52, 0.52, 0.52]} />
              <meshStandardMaterial color={skin} />
              <Outlines color={OUTLINE_COLOR} thickness={0.006} />
            </mesh>
            {/* ears */}
            <mesh position={[-0.28, 0.29, -0.02]} castShadow>
              <boxGeometry args={[0.06, 0.14, 0.12]} />
              <meshStandardMaterial color={skinShade} />
            </mesh>
            <mesh position={[0.28, 0.29, -0.02]} castShadow>
              <boxGeometry args={[0.06, 0.14, 0.12]} />
              <meshStandardMaterial color={skinShade} />
            </mesh>
            {/* eyes */}
            <mesh position={[-0.12, 0.34, 0.262]}>
              <boxGeometry args={[0.08, 0.08, 0.02]} />
              <meshStandardMaterial color="#241d17" />
            </mesh>
            <mesh position={[0.12, 0.34, 0.262]}>
              <boxGeometry args={[0.08, 0.08, 0.02]} />
              <meshStandardMaterial color="#241d17" />
            </mesh>
            {/* nose */}
            <mesh position={[0, 0.245, 0.275]}>
              <boxGeometry args={[0.07, 0.08, 0.04]} />
              <meshStandardMaterial color={skinShade} />
            </mesh>

            {/* hair: cap + fringe + side blocks */}
            <mesh position={[0, 0.51, isFemale ? -0.04 : 0]} castShadow>
              <boxGeometry args={isFemale ? [0.58, 0.3, 0.58] : [0.56, 0.18, 0.56]} />
              <meshStandardMaterial color={hair} />
              <Outlines color={OUTLINE_COLOR} thickness={0.005} />
            </mesh>
            <mesh position={[0, 0.44, 0.24]} castShadow>
              <boxGeometry args={[0.54, 0.1, 0.08]} />
              <meshStandardMaterial color={hair} />
            </mesh>
            <mesh position={[-0.255, 0.4, 0]} castShadow>
              <boxGeometry args={[0.05, 0.16, 0.5]} />
              <meshStandardMaterial color={hair} />
            </mesh>
            <mesh position={[0.255, 0.4, 0]} castShadow>
              <boxGeometry args={[0.05, 0.16, 0.5]} />
              <meshStandardMaterial color={hair} />
            </mesh>
            {isFemale && (
              <mesh position={[0, 0.25, -0.24]} castShadow>
                <boxGeometry args={[0.48, 0.28, 0.14]} />
                <meshStandardMaterial color={hair} />
                <Outlines color={OUTLINE_COLOR} thickness={0.005} />
              </mesh>
            )}

            {isFemale && (
              <group position={[0, 0.34, 0.27]}>
                <RoundedBox args={[0.23, 0.19, 0.025]} radius={0.03} smoothness={4} position={[-0.15, 0, 0]} castShadow>
                  <meshStandardMaterial color="#1c1c1c" />
                  <Outlines color={OUTLINE_COLOR} thickness={0.002} />
                </RoundedBox>
                <RoundedBox args={[0.23, 0.19, 0.025]} radius={0.03} smoothness={4} position={[0.15, 0, 0]} castShadow>
                  <meshStandardMaterial color="#1c1c1c" />
                  <Outlines color={OUTLINE_COLOR} thickness={0.002} />
                </RoundedBox>
                <RoundedBox args={[0.17, 0.13, 0.006]} radius={0.02} smoothness={4} position={[-0.15, 0, 0.017]}>
                  <meshStandardMaterial color="#dbe9f5" transparent opacity={0.55} roughness={0.15} />
                </RoundedBox>
                <RoundedBox args={[0.17, 0.13, 0.006]} radius={0.02} smoothness={4} position={[0.15, 0, 0.017]}>
                  <meshStandardMaterial color="#dbe9f5" transparent opacity={0.55} roughness={0.15} />
                </RoundedBox>
                <mesh position={[0, 0, 0]} castShadow>
                  <boxGeometry args={[0.08, 0.025, 0.02]} />
                  <meshStandardMaterial color="#1c1c1c" />
                </mesh>
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

          {/* arms pivot at the shoulders */}
          <group ref={paddleArmRef} position={[0.5, SHOULDER_Y - HIP_Y, 0]}>
            {arm(true)}
            {holdsPaddle && (
              <PickleballPaddle
                position={[0.05, -0.76, 0.05]}
                rotation={[0.25, 0, -0.1]}
                faceColor={paddleFaceColor}
                faceShade={paddleFaceShade}
                gripColor={paddleGripColor}
              />
            )}
          </group>
          <group ref={freeArmRef} position={[-0.5, SHOULDER_Y - HIP_Y, 0]}>
            {arm(false)}
          </group>
        </group>
      </group>
    </group>
  )
}

const RALLY_CYCLE_SECONDS = 1.4
const RALLY_PERIOD = RALLY_CYCLE_SECONDS * 2

const PLAYER_A_POS: [number, number, number] = [-1.4, 0, 3.2]
const PLAYER_B_POS: [number, number, number] = [1.4, 0, -6.2]

const PLAYER_A_ROTATION_Y = Math.atan2(PLAYER_B_POS[0] - PLAYER_A_POS[0], PLAYER_B_POS[2] - PLAYER_A_POS[2])
const PLAYER_B_ROTATION_Y = Math.atan2(PLAYER_A_POS[0] - PLAYER_B_POS[0], PLAYER_A_POS[2] - PLAYER_B_POS[2])

/** Where the paddle face actually is, in the player's own space, at the
 * moment of contact - measured from the rig rather than guessed, so the
 * ball meets the paddle instead of flying past it. */
const CONTACT_OFFSET: [number, number, number] = [0.5, 1.1, 0.17]

function contactPoint(
  pos: [number, number, number],
  rotationY: number,
): { x: number; y: number; z: number } {
  const [ox, oy, oz] = CONTACT_OFFSET
  const cos = Math.cos(rotationY)
  const sin = Math.sin(rotationY)
  return {
    x: pos[0] + ox * cos + oz * sin,
    y: pos[1] + oy,
    z: pos[2] - ox * sin + oz * cos,
  }
}

const CONTACT_A = contactPoint(PLAYER_A_POS, PLAYER_A_ROTATION_Y)
const CONTACT_B = contactPoint(PLAYER_B_POS, PLAYER_B_ROTATION_Y)

const RALLY: RallyConfig = {
  fromX: CONTACT_A.x,
  fromZ: CONTACT_A.z,
  toX: CONTACT_B.x,
  toZ: CONTACT_B.z,
  baseHeight: (CONTACT_A.y + CONTACT_B.y) / 2,
  arcHeight: 1.3,
  cycleSeconds: RALLY_CYCLE_SECONDS,
}

export function PeopleScene() {
  return (
    <div className="scene3d">
      <Canvas
        shadows="soft"
        dpr={[1, 2]}
        camera={{ position: [3.2, 4.6, 10.5], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
      >
        {/* Warm key light + cool fill, so the blocks read as solid shapes
            instead of flat colour. */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[4, 8, 5]}
          intensity={2}
          color="#fff6ec"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0002}
          shadow-camera-left={-9}
          shadow-camera-right={9}
          shadow-camera-top={9}
          shadow-camera-bottom={-9}
          shadow-camera-near={1}
          shadow-camera-far={28}
        />
        <directionalLight position={[-5, 4, -4]} intensity={0.45} color="#dce9ff" />

        <PickleballCourt />

        <BlockyPerson
          position={PLAYER_A_POS}
          rotationY={PLAYER_A_ROTATION_Y}
          skin="#e8b98d"
          skinShade="#d5a377"
          hair="#2b2118"
          outfit="#2b3a55"
          outfitAccent="#3f5372"
          isFemale={false}
          holdsPaddle
          paddleFaceColor="#c62828"
          paddleFaceShade="#8e1f1f"
          paddleGripColor="#f2c200"
          swingHitTime={0}
          swingPeriod={RALLY_PERIOD}
          rally={RALLY}
        />
        <BlockyPerson
          position={PLAYER_B_POS}
          rotationY={PLAYER_B_ROTATION_Y}
          skin="#f0c9a6"
          skinShade="#dcb08a"
          hair="#5a3825"
          outfit="#c2185b"
          outfitAccent="#1c1c1c"
          isFemale
          holdsPaddle
          paddleFaceColor="#2f9e6b"
          paddleFaceShade="#1f7a52"
          paddleGripColor="#8ecae6"
          swingHitTime={RALLY_CYCLE_SECONDS}
          swingPeriod={RALLY_PERIOD}
          rally={RALLY}
        />

        <RallyingBall config={RALLY} />

        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.05}
          minDistance={2.5}
          maxDistance={22}
          minPolarAngle={0.15}
          maxPolarAngle={Math.PI / 2 - 0.16}
          target={[0, 0.8, -1.5]}
          autoRotate
          autoRotateSpeed={0.8}
        />
      </Canvas>
    </div>
  )
}
