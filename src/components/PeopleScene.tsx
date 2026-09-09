import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Outlines, RoundedBox } from '@react-three/drei'
import { Color, DirectionalLight, Group, Object3D, Quaternion, Vector3 } from 'three'

import { useIsDarkTheme } from '../hooks/useIsDarkTheme'

const OUTLINE_COLOR = '#15130f'

const COURT_NET_Z = -1.5
const COURT_HALF_WIDTH = 2.5
const COURT_HALF_LENGTH = 5
const COURT_KITCHEN_DEPTH = 1.6
const COURT_LINE_COLOR = '#f2f2f2'
const COURT_DAY_SURFACE = '#4a82b0'
const COURT_DAY_KITCHEN = '#5c96c4'
const COURT_NIGHT_SURFACE = '#1e4a67'
const COURT_NIGHT_KITCHEN = '#28607f'

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

function PickleballCourt({ night }: { night: boolean }) {
  const surfaceColor = night ? COURT_NIGHT_SURFACE : COURT_DAY_SURFACE
  const kitchenColor = night ? COURT_NIGHT_KITCHEN : COURT_DAY_KITCHEN
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
        <meshStandardMaterial color={surfaceColor} roughness={0.85} />
      </mesh>

      {/* kitchen (non-volley) zones, slightly lighter */}
      <mesh position={[0, 0.026, (nearKitchenLine + COURT_NET_Z) / 2]} receiveShadow>
        <boxGeometry args={[courtWidth, 0.001, COURT_KITCHEN_DEPTH]} />
        <meshStandardMaterial color={kitchenColor} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.026, (farKitchenLine + COURT_NET_Z) / 2]} receiveShadow>
        <boxGeometry args={[courtWidth, 0.001, COURT_KITCHEN_DEPTH]} />
        <meshStandardMaterial color={kitchenColor} roughness={0.85} />
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

      {/* center service lines, baseline to kitchen line on each side.
        * Both take the same positive length - handing boxGeometry a negative
        * depth turns the box inside out and its normals with it. */}
      {[(nearBaseline + nearKitchenLine) / 2, (farBaseline + farKitchenLine) / 2].map((z) => (
        <mesh key={z} position={[0, 0.03, z]}>
          <boxGeometry args={[0.06, 0.01, COURT_HALF_LENGTH - COURT_KITCHEN_DEPTH]} />
          <meshStandardMaterial color={COURT_LINE_COLOR} />
        </mesh>
      ))}

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

const LAMP_COLOR = '#eaf3ff'

/** A dim light pinned to the camera so whatever faces the viewer keeps some
 * detail while the scene auto-rotates. */
function CameraFill() {
  const ref = useRef<DirectionalLight>(null)
  useFrame((state) => {
    ref.current?.position.copy(state.camera.position)
  })
  return <directionalLight ref={ref} intensity={0.25} color="#a9c1e8" />
}

/** One floodlight beam. There is no fixture to see - only the pool of light
 * it throws onto the court. */
function CourtLight({
  position,
  aimAt,
  castShadow = false,
}: {
  position: [number, number, number]
  aimAt: [number, number, number]
  castShadow?: boolean
}) {
  // A spotlight aims at its `target` object, which has to live in the scene.
  const target = useMemo(() => {
    const object = new Object3D()
    object.position.set(...aimAt)
    return object
  }, [aimAt])

  return (
    <>
      <primitive object={target} />
      <spotLight
        position={position}
        target={target}
        color={LAMP_COLOR}
        intensity={115}
        angle={0.9}
        penumbra={0.85}
        distance={26}
        decay={2}
        castShadow={castShadow}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
    </>
  )
}

/** Daylight: warm key light + cool fill, so the blocks read as solid shapes
 * instead of flat colour. */
function DayLighting() {
  return (
    <>
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
    </>
  )
}

/** Night match: a faint blue night sky, everything else comes from the
 * floodlights around the court. */
function NightLighting() {
  return (
    <>
      <ambientLight intensity={0.16} color="#8ea6cc" />
      <hemisphereLight args={['#33456b', '#0b1018', 0.3]} />
      <directionalLight position={[-6, 7, -5]} intensity={0.14} color="#8ea6cc" />
      <CameraFill />

      <CourtLight position={[3.24, 3.96, 2.6]} aimAt={[-1.1, 0.6, 0.6]} castShadow />
      <CourtLight position={[-3.24, 3.96, 2.6]} aimAt={[1.1, 0.6, 2.2]} />
      <CourtLight position={[3.24, 3.96, -5.6]} aimAt={[-1.1, 0.6, -4.6]} castShadow />
      <CourtLight position={[-3.24, 3.96, -5.6]} aimAt={[1.1, 0.6, -6.0]} />
    </>
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

/** Voxel figures read as "detailed" mostly through shading - nearly every part
 * gets a slightly darker or lighter sibling. Deriving those from one colour
 * keeps the palette coherent instead of hand-picking two dozen hexes. */
function darken(hex: string, amount: number): string {
  return `#${new Color(hex).multiplyScalar(1 - amount).getHexString()}`
}

function lighten(hex: string, amount: number): string {
  return `#${new Color(hex).lerp(new Color(0xffffff), amount).getHexString()}`
}

/** The two players differ in proportion, not just in colour: narrower
 * shoulders, a waist that actually tapers and hips that flare back out are
 * what read as feminine at this blocky resolution. */
type Build = {
  chestWidth: number
  chestDepth: number
  waistWidth: number
  waistDepth: number
  hipsWidth: number
  hipsDepth: number
  /** Half the shoulder span - also where the arms, and so the paddle, pivot. */
  shoulderHalf: number
  hipHalf: number
  armWidth: number
  legWidth: number
  headWidth: number
}

const MALE_BUILD: Build = {
  chestWidth: 0.72,
  chestDepth: 0.41,
  waistWidth: 0.66,
  waistDepth: 0.38,
  hipsWidth: 0.68,
  hipsDepth: 0.39,
  shoulderHalf: 0.5,
  hipHalf: 0.17,
  armWidth: 0.23,
  legWidth: 0.26,
  headWidth: 0.52,
}

const FEMALE_BUILD: Build = {
  chestWidth: 0.6,
  chestDepth: 0.36,
  waistWidth: 0.47,
  waistDepth: 0.3,
  hipsWidth: 0.64,
  hipsDepth: 0.38,
  shoulderHalf: 0.375,
  hipHalf: 0.15,
  armWidth: 0.19,
  legWidth: 0.225,
  headWidth: 0.5,
}

/* The stroke, as keyframes on the seconds-to-contact axis. At module scope so
 * the renderer and the ball's trajectory read the same numbers. */

/** Wind up behind the body, whip through contact at dt = 0, then follow
 * through and relax: an asymmetric swing rather than a symmetric pulse. */
const SWING_KEYS: [number, number][] = [
  [-0.75, 0],
  [-0.34, -1.15],
  [-0.1, -0.95],
  [0, 0.2],
  [0.22, 0.85],
  [0.7, 0],
]

const TWIST_KEYS: [number, number][] = [
  [-0.75, 0],
  [-0.34, 0.32],
  [0, -0.12],
  [0.24, -0.38],
  [0.7, 0],
]

/** Split step: a small hop up, then a landing into a bent-knee ready stance. */
const HOP_KEYS: [number, number][] = [
  [-0.34, 0],
  [-0.13, 0.12],
  [0, 0.03],
  [0.13, 0],
  [0.45, 0],
]

const CROUCH_KEYS: [number, number][] = [
  [-0.34, 0],
  [0, 0.06],
  [0.14, 0.34],
  [0.5, 0.1],
]

/** Step into the shot with the front leg; the back leg trails. */
const STRIDE_KEYS: [number, number][] = [
  [-0.6, 0],
  [-0.22, -0.28],
  [0.06, 0.3],
  [0.55, 0],
]

/* The paddle is held head-down in the right hand, grip running up through the
 * fist, so the stroke is an underhand sweep: the arm pitches the opposite way
 * to an overhand rig, and the shoulder hangs a little away from the body to
 * keep the head clear of the leg (and of her skirt). */
const PADDLE_POSITION: [number, number, number] = [-0.05, -0.6, 0.05]
const PADDLE_ROTATION: [number, number, number] = [-0.25, 0, Math.PI + 0.12]
/** Height of the face's centre within the paddle model. */
const PADDLE_FACE_Y = 0.475

const armPitch = (swing: number) => -swing
const paddleArmRoll = (swing: number) => clamp(-0.15 + swing * 0.12, -0.5, 0.2)
const freeArmRoll = (swing: number) => clamp(0.15 - swing * 0.12, -0.2, 0.5)

// Torso blocks, measured up from the hips (the torso group's own origin).
const HIPS_Y = 0.085
const WAIST_Y = 0.295
const CHEST_Y = 0.57
const COLLAR_Y = 0.745

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
  const build = isFemale ? FEMALE_BUILD : MALE_BUILD

  const palette = useMemo(
    () => ({
      shirt: outfit,
      shirtShade: darken(outfit, 0.2),
      shirtLight: lighten(outfit, 0.22),
      bottom: outfitAccent,
      bottomShade: darken(outfitAccent, 0.22),
      bottomLight: lighten(outfitAccent, 0.28),
      hairShade: darken(hair, 0.32),
      hairLight: lighten(hair, 0.16),
    }),
    [outfit, outfitAccent, hair],
  )

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const cycle = swingPeriod / 2

    // Own contact, and the opponent's contact half a period later - real
    // players time their split step to the opponent's strike.
    const dtHit = timeToEvent(t, swingHitTime, swingPeriod)
    const dtSplit = timeToEvent(t, swingHitTime + cycle, swingPeriod)

    const swing = keyframe(dtHit, SWING_KEYS)
    const twist = keyframe(dtHit, TWIST_KEYS)
    const hop = keyframe(dtSplit, HOP_KEYS)
    const crouch = keyframe(dtSplit, CROUCH_KEYS)
    const stride = keyframe(dtHit, STRIDE_KEYS)

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
      root.rotation.x = clamp(-armPitch(swing) * 0.06, -0.12, 0.12)
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
      paddleArm.rotation.x = armPitch(swing)
      paddleArm.rotation.z = paddleArmRoll(swing)
    }

    const freeArm = freeArmRef.current
    if (freeArm) {
      // Counter-balances the swinging arm.
      freeArm.rotation.x = -armPitch(swing) * 0.45
      freeArm.rotation.z = freeArmRoll(swing)
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
  const shoeShade = '#d9d4c6'
  const soleColor = '#3c3c3c'
  const sockColor = '#ffffff'
  const hw = build.headWidth
  const faceZ = hw / 2

  const leg = (side: 1 | -1) => {
    const w = build.legWidth
    const footZ = 0.04 * side
    const footDepth = w + 0.08
    return (
      <>
        {/* thigh - shorts on him, bare under the skirt on her */}
        <mesh position={[0, -0.13, 0]} castShadow>
          <boxGeometry args={[w, 0.26, w + 0.04]} />
          <meshStandardMaterial color={isFemale ? skin : palette.bottom} />
          <Outlines color={OUTLINE_COLOR} thickness={0.006} />
        </mesh>
        {!isFemale && (
          <>
            {/* shorts hem */}
            <mesh position={[0, -0.245, 0]}>
              <boxGeometry args={[w + 0.014, 0.05, w + 0.052]} />
              <meshStandardMaterial color={palette.bottomShade} />
            </mesh>
            {/* side stripe, on the outboard leg face */}
            <mesh position={[(w / 2) * side, -0.14, 0]}>
              <boxGeometry args={[0.02, 0.2, w + 0.046]} />
              <meshStandardMaterial color={palette.bottomLight} />
            </mesh>
          </>
        )}
        {/* knee */}
        <mesh position={[0, -0.29, 0.005]} castShadow>
          <boxGeometry args={[w - 0.03, 0.07, w + 0.025]} />
          <meshStandardMaterial color={skinShade} />
        </mesh>
        {/* shin */}
        <mesh position={[0, -0.43, 0]} castShadow>
          <boxGeometry args={[w - 0.035, 0.22, w - 0.005]} />
          <meshStandardMaterial color={skin} />
          <Outlines color={OUTLINE_COLOR} thickness={0.005} />
        </mesh>
        {/* calf, a touch deeper at the back */}
        <mesh position={[0, -0.45, -0.045]}>
          <boxGeometry args={[w - 0.07, 0.15, w - 0.06]} />
          <meshStandardMaterial color={skinShade} />
        </mesh>
        {/* sock */}
        <mesh position={[0, -0.585, 0]} castShadow>
          <boxGeometry args={[w - 0.012, 0.12, w + 0.022]} />
          <meshStandardMaterial color={sockColor} />
          <Outlines color={OUTLINE_COLOR} thickness={0.004} />
        </mesh>
        {[-0.552, -0.592].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <boxGeometry args={[w - 0.002, 0.016, w + 0.032]} />
            <meshStandardMaterial color={palette.shirt} />
          </mesh>
        ))}
        {/* shoe upper */}
        <mesh position={[0, -0.66, footZ]} castShadow>
          <boxGeometry args={[w + 0.02, 0.09, footDepth]} />
          <meshStandardMaterial color={shoeColor} />
          <Outlines color={OUTLINE_COLOR} thickness={0.004} />
        </mesh>
        {/* toe cap */}
        <mesh position={[0, -0.675, footZ + footDepth / 2 - 0.045]}>
          <boxGeometry args={[w + 0.024, 0.062, 0.1]} />
          <meshStandardMaterial color={shoeShade} />
        </mesh>
        {/* heel tab */}
        <mesh position={[0, -0.612, footZ - footDepth / 2 + 0.018]}>
          <boxGeometry args={[w - 0.07, 0.055, 0.03]} />
          <meshStandardMaterial color={palette.shirt} />
        </mesh>
        {/* laces */}
        {[0.03, 0.075].map((dz) => (
          <mesh key={dz} position={[0, -0.617, footZ + dz]}>
            <boxGeometry args={[w - 0.08, 0.018, 0.026]} />
            <meshStandardMaterial color={palette.shirtShade} />
          </mesh>
        ))}
        {/* midsole */}
        <mesh position={[0, -0.714, footZ]} castShadow>
          <boxGeometry args={[w + 0.032, 0.038, footDepth + 0.012]} />
          <meshStandardMaterial color={sockColor} />
        </mesh>
        {/* outsole - sits just on top of the court surface */}
        <mesh position={[0, -0.741, footZ]}>
          <boxGeometry args={[w + 0.034, 0.019, footDepth + 0.014]} />
          <meshStandardMaterial color={soleColor} />
        </mesh>
      </>
    )
  }

  const arm = (holding: boolean) => {
    const w = build.armWidth
    // Her top is sleeveless, which is most of what separates the two
    // silhouettes from the shoulders down.
    const sleeveless = isFemale
    return (
      <>
        {/* shoulder cap: a sleeve on him, a strap over a bare shoulder on her */}
        <mesh position={[0, -0.03, 0]} castShadow>
          <boxGeometry args={[w + 0.05, 0.15, w + 0.05]} />
          <meshStandardMaterial color={sleeveless ? skin : palette.shirt} />
          <Outlines color={OUTLINE_COLOR} thickness={0.005} />
        </mesh>
        {sleeveless && (
          <mesh position={[0, 0.015, 0]}>
            <boxGeometry args={[w + 0.056, 0.075, w + 0.056]} />
            <meshStandardMaterial color={palette.shirt} />
          </mesh>
        )}
        {/* upper arm */}
        <mesh position={[0, -0.19, 0]} castShadow>
          <boxGeometry args={[w, 0.28, w]} />
          <meshStandardMaterial color={sleeveless ? skin : palette.shirtShade} />
          <Outlines color={OUTLINE_COLOR} thickness={0.005} />
        </mesh>
        {!sleeveless && (
          /* sleeve hem */
          <mesh position={[0, -0.315, 0]}>
            <boxGeometry args={[w + 0.012, 0.04, w + 0.012]} />
            <meshStandardMaterial color={palette.shirtLight} />
          </mesh>
        )}
        {/* elbow */}
        <mesh position={[0, -0.345, 0]}>
          <boxGeometry args={[w - 0.025, 0.06, w - 0.025]} />
          <meshStandardMaterial color={skinShade} />
        </mesh>
        {/* forearm */}
        <mesh position={[0, -0.48, 0]} castShadow>
          <boxGeometry args={[w - 0.03, 0.25, w - 0.03]} />
          <meshStandardMaterial color={skin} />
          <Outlines color={OUTLINE_COLOR} thickness={0.005} />
        </mesh>
        {/* wristband */}
        <mesh position={[0, -0.625, 0]} castShadow>
          <boxGeometry args={[w - 0.012, 0.075, w - 0.012]} />
          <meshStandardMaterial color={holding ? sockColor : palette.shirt} />
        </mesh>
        <mesh position={[0, -0.625, 0]}>
          <boxGeometry args={[w - 0.002, 0.02, w - 0.002]} />
          <meshStandardMaterial color={holding ? palette.shirt : palette.shirtLight} />
        </mesh>
        {/* hand */}
        <mesh position={[0, -0.71, 0.01]} castShadow>
          <boxGeometry args={[w - 0.035, 0.14, w + 0.015]} />
          <meshStandardMaterial color={skin} />
          <Outlines color={OUTLINE_COLOR} thickness={0.004} />
        </mesh>
        {/* thumb */}
        <mesh position={[0, -0.674, 0.077]}>
          <boxGeometry args={[w - 0.115, 0.05, 0.05]} />
          <meshStandardMaterial color={skinShade} />
        </mesh>
      </>
    )
  }

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <group ref={rootRef}>
        {/* legs pivot at the hips */}
        <group ref={legFrontRef} position={[build.hipHalf, HIP_Y, 0]}>
          {leg(1)}
        </group>
        <group ref={legBackRef} position={[-build.hipHalf, HIP_Y, 0]}>
          {leg(-1)}
        </group>

        {/* everything above the waist rotates into the shot together */}
        <group ref={torsoRef} position={[0, HIP_Y, 0]}>
          {/* hips - her widest point, his narrowest */}
          <mesh position={[0, HIPS_Y, 0]} castShadow>
            <boxGeometry args={[build.hipsWidth, 0.17, build.hipsDepth]} />
            <meshStandardMaterial color={isFemale ? palette.bottom : palette.shirt} />
            <Outlines color={OUTLINE_COLOR} thickness={0.006} />
          </mesh>
          {/* waist - deliberately taller than the gap it fills, so it sinks
            * into the chest and hips instead of sharing a plane with them */}
          <mesh position={[0, WAIST_Y, 0]} castShadow>
            <boxGeometry args={[build.waistWidth, 0.29, build.waistDepth]} />
            <meshStandardMaterial color={palette.shirt} />
            <Outlines color={OUTLINE_COLOR} thickness={0.006} />
          </mesh>
          {/* chest */}
          <mesh position={[0, CHEST_Y, 0]} castShadow>
            <boxGeometry args={[build.chestWidth, 0.3, build.chestDepth]} />
            <meshStandardMaterial color={palette.shirt} />
            <Outlines color={OUTLINE_COLOR} thickness={0.006} />
          </mesh>
          {/* side panels, the way a sports top is cut */}
          {[1, -1].map((side) => (
            <mesh key={side} position={[(build.chestWidth / 2 - 0.02) * side, CHEST_Y - 0.02, 0]}>
              <boxGeometry args={[0.03, 0.26, build.chestDepth + 0.006]} />
              <meshStandardMaterial color={palette.shirtShade} />
            </mesh>
          ))}
          {isFemale && (
            <>
              {/* the top's shaped front */}
              <mesh position={[0, CHEST_Y + 0.02, build.chestDepth / 2 - 0.035]} castShadow>
                <boxGeometry args={[build.chestWidth - 0.2, 0.13, 0.1]} />
                <meshStandardMaterial color={lighten(outfit, 0.1)} />
              </mesh>
              {/* scoop neckline */}
              <mesh position={[0, CHEST_Y + 0.145, build.chestDepth / 2 - 0.03]}>
                <boxGeometry args={[0.17, 0.06, 0.1]} />
                <meshStandardMaterial color={skin} />
              </mesh>
              {/* hem band at the waist */}
              <mesh position={[0, WAIST_Y - 0.1, 0]}>
                <boxGeometry args={[build.waistWidth + 0.014, 0.05, build.waistDepth + 0.014]} />
                <meshStandardMaterial color={palette.shirtShade} />
              </mesh>
            </>
          )}
          {/* chest logo */}
          <mesh position={[isFemale ? -0.16 : 0.17, CHEST_Y + 0.02, build.chestDepth / 2 + 0.006]}>
            <boxGeometry args={[0.1, 0.1, 0.015]} />
            <meshStandardMaterial color={isFemale ? sockColor : palette.bottomLight} />
          </mesh>
          {/* collar */}
          <mesh position={[0, COLLAR_Y, 0]} castShadow>
            <boxGeometry args={[isFemale ? 0.36 : 0.44, 0.06, isFemale ? 0.28 : 0.32]} />
            <meshStandardMaterial color={isFemale ? palette.shirtShade : palette.bottom} />
          </mesh>

          {isFemale && (
            /* pleated skirt, hung from the hips so it stays put while the legs
             * swing underneath it */
            <group position={[0, HIPS_Y - 0.06, 0]}>
              <mesh position={[0, 0.02, 0]} castShadow>
                <boxGeometry args={[build.hipsWidth + 0.02, 0.07, build.hipsDepth + 0.02]} />
                <meshStandardMaterial color={palette.shirt} />
                <Outlines color={OUTLINE_COLOR} thickness={0.005} />
              </mesh>
              <mesh position={[0, -0.13, 0]} castShadow>
                <boxGeometry args={[build.hipsWidth + 0.05, 0.24, build.hipsDepth + 0.05]} />
                <meshStandardMaterial color={palette.bottom} />
                <Outlines color={OUTLINE_COLOR} thickness={0.006} />
              </mesh>
              {/* flared rim */}
              <mesh position={[0, -0.265, 0]} castShadow>
                <boxGeometry args={[build.hipsWidth + 0.1, 0.05, build.hipsDepth + 0.1]} />
                <meshStandardMaterial color={palette.bottomShade} />
                <Outlines color={OUTLINE_COLOR} thickness={0.005} />
              </mesh>
              {/* pleats, front and back */}
              {[-0.21, -0.07, 0.07, 0.21].map((x) =>
                [1, -1].map((face) => (
                  <mesh
                    key={`${x}:${face}`}
                    position={[x, -0.14, ((build.hipsDepth + 0.05) / 2 + 0.004) * face]}
                  >
                    <boxGeometry args={[0.05, 0.23, 0.01]} />
                    <meshStandardMaterial color={palette.bottomLight} />
                  </mesh>
                )),
              )}
            </group>
          )}

          {/* head pivots at the neck and tracks the ball */}
          <group ref={headRef} position={[0, NECK_Y - HIP_Y, 0]}>
            {/* neck */}
            <mesh position={[0, 0.01, 0]} castShadow>
              <boxGeometry args={[isFemale ? 0.17 : 0.2, 0.14, isFemale ? 0.17 : 0.2]} />
              <meshStandardMaterial color={skinShade} />
            </mesh>
            {/* head */}
            <mesh position={[0, 0.3, 0]} castShadow>
              <boxGeometry args={[hw, hw, hw]} />
              <meshStandardMaterial color={skin} />
              <Outlines color={OUTLINE_COLOR} thickness={0.006} />
            </mesh>
            {/* jaw: tapered on her, squared off on him */}
            <mesh position={[0, 0.055, 0.01]}>
              <boxGeometry
                args={isFemale ? [hw - 0.16, 0.07, hw - 0.13] : [hw - 0.06, 0.07, hw - 0.05]}
              />
              <meshStandardMaterial color={isFemale ? skin : skinShade} />
            </mesh>
            {/* ears */}
            {[1, -1].map((side) => (
              <mesh key={side} position={[(hw / 2 + 0.02) * side, 0.29, -0.02]} castShadow>
                <boxGeometry args={[0.055, 0.13, 0.11]} />
                <meshStandardMaterial color={skinShade} />
              </mesh>
            ))}
            {isFemale &&
              [1, -1].map((side) => (
                /* earrings */
                <mesh key={side} position={[(hw / 2 + 0.03) * side, 0.222, -0.02]}>
                  <boxGeometry args={[0.04, 0.04, 0.04]} />
                  <meshStandardMaterial color="#f2c94c" metalness={0.6} roughness={0.3} />
                </mesh>
              ))}

            {/* hair */}
            <mesh position={[0, isFemale ? 0.48 : 0.5, isFemale ? -0.03 : 0]} castShadow>
              <boxGeometry
                args={isFemale ? [hw + 0.045, 0.22, hw + 0.05] : [hw + 0.04, 0.18, hw + 0.04]}
              />
              <meshStandardMaterial color={hair} />
              <Outlines color={OUTLINE_COLOR} thickness={0.005} />
            </mesh>
            {/* a lighter second layer, so the hair is not one flat slab */}
            <mesh position={[0, isFemale ? 0.575 : 0.578, isFemale ? -0.07 : -0.04]}>
              <boxGeometry args={[hw - 0.1, 0.05, hw - 0.08]} />
              <meshStandardMaterial color={palette.hairLight} />
            </mesh>
            {isFemale ? (
              <>
                {/* side-parted fringe: two blocks of different width */}
                <mesh position={[-0.1, 0.472, faceZ - 0.04]} castShadow>
                  <boxGeometry args={[0.29, 0.11, 0.1]} />
                  <meshStandardMaterial color={hair} />
                </mesh>
                <mesh position={[0.165, 0.482, faceZ - 0.04]} castShadow>
                  <boxGeometry args={[0.2, 0.09, 0.1]} />
                  <meshStandardMaterial color={palette.hairLight} />
                </mesh>
                {/* hair clip */}
                <mesh position={[0.215, 0.462, faceZ - 0.03]}>
                  <boxGeometry args={[0.085, 0.03, 0.06]} />
                  <meshStandardMaterial color={palette.shirtLight} />
                </mesh>
                {/* a short bob: the sides stop at the ears instead of
                  * falling past them */}
                {[1, -1].map((side) => (
                  <group key={side}>
                    <mesh position={[(hw / 2 + 0.03) * side, 0.395, -0.04]} castShadow>
                      <boxGeometry args={[0.06, 0.25, hw - 0.1]} />
                      <meshStandardMaterial color={hair} />
                      <Outlines color={OUTLINE_COLOR} thickness={0.004} />
                    </mesh>
                    {/* the tapered tip of the bob */}
                    <mesh position={[(hw / 2 + 0.03) * side, 0.262, -0.07]}>
                      <boxGeometry args={[0.055, 0.07, hw - 0.19]} />
                      <meshStandardMaterial color={palette.hairShade} />
                    </mesh>
                  </group>
                ))}
                {/* back of the hair, cut short into the nape */}
                <mesh position={[0, 0.395, -(hw / 2 + 0.05)]} castShadow>
                  <boxGeometry args={[hw + 0.02, 0.25, 0.11]} />
                  <meshStandardMaterial color={hair} />
                  <Outlines color={OUTLINE_COLOR} thickness={0.005} />
                </mesh>
                <mesh position={[0, 0.268, -(hw / 2 + 0.04)]}>
                  <boxGeometry args={[hw - 0.08, 0.07, 0.09]} />
                  <meshStandardMaterial color={palette.hairShade} />
                </mesh>
              </>
            ) : (
              <>
                {/* fringe */}
                <mesh position={[0, 0.44, faceZ - 0.02]}>
                  <boxGeometry args={[hw + 0.02, 0.1, 0.09]} />
                  <meshStandardMaterial color={hair} />
                </mesh>
                {/* sideburns */}
                {[1, -1].map((side) => (
                  <mesh key={side} position={[(hw / 2 + 0.015) * side, 0.4, 0]}>
                    <boxGeometry args={[0.05, 0.16, hw - 0.02]} />
                    <meshStandardMaterial color={hair} />
                  </mesh>
                ))}
                {/* cropped back */}
                <mesh position={[0, 0.395, -(hw / 2 + 0.02)]}>
                  <boxGeometry args={[hw, 0.17, 0.06]} />
                  <meshStandardMaterial color={palette.hairShade} />
                </mesh>
              </>
            )}

            {isFemale && (
              /* glasses */
              <group position={[0, 0.34, faceZ + 0.022]}>
                {[1, -1].map((side) => (
                  <group key={side} position={[0.132 * side, 0, 0]}>
                    {[0.079, -0.079].map((y) => (
                      <mesh key={y} position={[0, y, 0]}>
                        <boxGeometry args={[0.196, 0.022, 0.022]} />
                        <meshStandardMaterial color="#2a2a2e" />
                      </mesh>
                    ))}
                    {[0.087, -0.087].map((x) => (
                      <mesh key={x} position={[x, 0, 0]}>
                        <boxGeometry args={[0.022, 0.18, 0.022]} />
                        <meshStandardMaterial color="#2a2a2e" />
                      </mesh>
                    ))}
                    <mesh position={[0, 0, 0.006]}>
                      <boxGeometry args={[0.175, 0.16, 0.006]} />
                      <meshStandardMaterial
                        color="#dbe9f5"
                        transparent
                        opacity={0.16}
                        roughness={0.12}
                      />
                    </mesh>
                    {/* temple arm */}
                    <mesh position={[0.128 * side, 0.01, -0.075]} rotation={[0, -0.3 * side, 0]}>
                      <boxGeometry args={[0.018, 0.018, 0.16]} />
                      <meshStandardMaterial color="#2a2a2e" />
                    </mesh>
                  </group>
                ))}
                {/* bridge */}
                <mesh position={[0, 0.02, 0]}>
                  <boxGeometry args={[0.075, 0.02, 0.018]} />
                  <meshStandardMaterial color="#2a2a2e" />
                </mesh>
              </group>
            )}
          </group>

          {/* arms pivot at the shoulders */}
          {/* the paddle hand is the right one, which is -x for a figure
            * facing its own +z */}
          <group ref={paddleArmRef} position={[-build.shoulderHalf, SHOULDER_Y - HIP_Y, 0]}>
            {arm(true)}
            {holdsPaddle && (
              <PickleballPaddle
                position={PADDLE_POSITION}
                rotation={PADDLE_ROTATION}
                faceColor={paddleFaceColor}
                faceShade={paddleFaceShade}
                gripColor={paddleGripColor}
              />
            )}
          </group>
          <group ref={freeArmRef} position={[build.shoulderHalf, SHOULDER_Y - HIP_Y, 0]}>
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

/** Where the paddle face actually is, in the player's own space, at the moment
 * of contact. Rebuilt from the same transforms the renderer uses rather than
 * measured by hand, so re-posing the grip can never leave the ball flying past
 * the paddle. */
function contactOffset(build: Build): Vector3 {
  const swing = keyframe(0, SWING_KEYS)

  const torso = new Object3D()
  torso.position.set(0, HIP_Y, 0)
  torso.rotation.y = keyframe(0, TWIST_KEYS)

  const arm = new Object3D()
  arm.position.set(-build.shoulderHalf, SHOULDER_Y - HIP_Y, 0)
  arm.rotation.x = armPitch(swing)
  arm.rotation.z = paddleArmRoll(swing)
  torso.add(arm)

  const paddle = new Object3D()
  paddle.position.set(...PADDLE_POSITION)
  paddle.rotation.set(...PADDLE_ROTATION)
  arm.add(paddle)

  const face = new Object3D()
  face.position.set(0, PADDLE_FACE_Y, 0)
  paddle.add(face)

  torso.updateWorldMatrix(false, true)
  return face.getWorldPosition(new Vector3())
}

function contactPoint(
  pos: [number, number, number],
  rotationY: number,
  build: Build,
): { x: number; y: number; z: number } {
  const { x: ox, y: oy, z: oz } = contactOffset(build)
  const cos = Math.cos(rotationY)
  const sin = Math.sin(rotationY)
  return {
    x: pos[0] + ox * cos + oz * sin,
    y: pos[1] + oy,
    z: pos[2] - ox * sin + oz * cos,
  }
}

const CONTACT_A = contactPoint(PLAYER_A_POS, PLAYER_A_ROTATION_Y, MALE_BUILD)
const CONTACT_B = contactPoint(PLAYER_B_POS, PLAYER_B_ROTATION_Y, FEMALE_BUILD)

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
  // Dark theme puts the match under floodlights; light theme keeps daylight.
  const night = useIsDarkTheme()
  const hostRef = useRef<HTMLDivElement>(null)
  const [onScreen, setOnScreen] = useState(true)

  // The rally animates every frame, which would keep a core busy the whole
  // time the reader is further down the page. Stop the loop once it scrolls
  // out of view and pick it back up on the way past.
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      rootMargin: '150px',
    })
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="scene3d" ref={hostRef}>
      <Canvas
        frameloop={onScreen ? 'always' : 'never'}
        shadows="soft"
        dpr={[1, 2]}
        camera={{ position: [3.2, 4.6, 10.5], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
      >
        {night ? <NightLighting /> : <DayLighting />}

        <PickleballCourt night={night} />

        <BlockyPerson
          position={PLAYER_A_POS}
          rotationY={PLAYER_A_ROTATION_Y}
          skin="#e8b98d"
          skinShade="#d5a377"
          hair="#2b2118"
          outfit="#496591"
          outfitAccent="#26334a"
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
          hair="#59331f"
          outfit="#e34f83"
          outfitAccent="#33384f"
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
