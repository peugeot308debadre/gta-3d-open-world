import React, { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useSphere, usePlane } from '@react-three/cannon'
import * as THREE from 'three'
import useGameStore from '../hooks/useGameStore'
import { keysPressed, getMovementVector } from '../hooks/useKeyboardControls'

const PLAYER_SPEED = 8
const SPRINT_MULTIPLIER = 2.0
const JUMP_FORCE = 7
const DAMPING = 0.85
const CAMERA_DISTANCE = 12
const CAMERA_HEIGHT = 8
const CAMERA_SMOOTHING = 0.05

export default function Player() {
  const { camera } = useThree()
  const setPlayerPosition = useGameStore((s) => s.setPlayerPosition)
  const setPlayerRotation = useGameStore((s) => s.setPlayerRotation)
  const setIsRunning = useGameStore((s) => s.setIsRunning)
  const setSpeed = useGameStore((s) => s.setSpeed)
  const setPlayerMinimapAngle = useGameStore((s) => s.setPlayerMinimapAngle)

  const [sphereRef, api] = useSphere(() => ({
    mass: 80,
    position: [0, 2, 0],
    args: [0.6],
    material: { friction: 0.3, restitution: 0.1 },
    linearDamping: 0.9,
    angularDamping: 0.99,
  }))

  const velocity = useRef([0, 0, 0])
  const position = useRef([0, 2, 0])
  const canJump = useRef(true)
  const cameraAngleY = useRef(0)
  const isDragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  const isMovingRef = useRef(false)
  const isSprintingRef = useRef(false)

  // Refs for limb animation
  const leftArmRef = useRef()
  const rightArmRef = useRef()
  const leftLegRef = useRef()
  const rightLegRef = useRef()

  useEffect(() => {
    const unsubVel = api.velocity.subscribe((v) => { velocity.current = v })
    const unsubPos = api.position.subscribe((p) => { position.current = p })
    return () => { unsubVel(); unsubPos() }
  }, [api])

  useEffect(() => {
    const handleMouseDown = (e) => {
      if (e.button === 2 || e.button === 0) {
        isDragging.current = true
        lastMouse.current = { x: e.clientX, y: e.clientY }
      }
    }
    const handleMouseUp = () => { isDragging.current = false }
    const handleMouseMove = (e) => {
      if (isDragging.current) {
        const dx = e.clientX - lastMouse.current.x
        cameraAngleY.current -= dx * 0.005
        lastMouse.current = { x: e.clientX, y: e.clientY }
      }
    }
    const handleContextMenu = (e) => e.preventDefault()

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('contextmenu', handleContextMenu)
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [])

  useFrame((state, delta) => {
    const { forward, right, jump, sprint } = getMovementVector(keysPressed)
    const speed = PLAYER_SPEED * (sprint ? SPRINT_MULTIPLIER : 1)
    const isMoving = forward !== 0 || right !== 0
    isMovingRef.current = isMoving
    isSprintingRef.current = sprint

    const angle = cameraAngleY.current
    const sinA = Math.sin(angle)
    const cosA = Math.cos(angle)

    const moveX = (right * cosA + forward * sinA) * speed
    const moveZ = (-right * sinA + forward * cosA) * speed

    if (isMoving) {
      api.velocity.set(moveX * DAMPING, velocity.current[1], moveZ * DAMPING)
      setPlayerRotation(Math.atan2(moveX, moveZ))
    } else {
      api.velocity.set(velocity.current[0] * 0.9, velocity.current[1], velocity.current[2] * 0.9)
    }

    if (jump && canJump.current && Math.abs(velocity.current[1]) < 0.5) {
      api.velocity.set(velocity.current[0], JUMP_FORCE, velocity.current[2])
      canJump.current = false
      setTimeout(() => { canJump.current = true }, 500)
    }

    setPlayerPosition([...position.current])
    setIsRunning(sprint && isMoving)
    setSpeed(isMoving ? (sprint ? 2 : 1) : 0)
    setPlayerMinimapAngle(cameraAngleY.current)

    // Animate limbs
    const time = state.clock.getElapsedTime()
    const walkSpeed = sprint ? 12 : 8
    const walkAmplitude = sprint ? 0.8 : 0.5

    if (isMoving) {
      const swing = Math.sin(time * walkSpeed) * walkAmplitude
      if (leftArmRef.current) leftArmRef.current.rotation.x = swing
      if (rightArmRef.current) rightArmRef.current.rotation.x = -swing
      if (leftLegRef.current) leftLegRef.current.rotation.x = -swing
      if (rightLegRef.current) rightLegRef.current.rotation.x = swing
    } else {
      // Return to rest pose
      if (leftArmRef.current) leftArmRef.current.rotation.x *= 0.9
      if (rightArmRef.current) rightArmRef.current.rotation.x *= 0.9
      if (leftLegRef.current) leftLegRef.current.rotation.x *= 0.9
      if (rightLegRef.current) rightLegRef.current.rotation.x *= 0.9
    }

    // Camera follow
    const pos = position.current
    camera.position.x += (pos[0] + Math.sin(cameraAngleY.current) * CAMERA_DISTANCE - camera.position.x) * CAMERA_SMOOTHING
    camera.position.y += (pos[1] + CAMERA_HEIGHT - camera.position.y) * CAMERA_SMOOTHING
    camera.position.z += (pos[2] + Math.cos(cameraAngleY.current) * CAMERA_DISTANCE - camera.position.z) * CAMERA_SMOOTHING
    camera.lookAt(new THREE.Vector3(pos[0], pos[1] + 1.5, pos[2]))
  })

  return (
    <group>
      {/* Invisible physics sphere */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[0.01]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Humanoid character */}
      <Humanoid
        position={position}
        leftArmRef={leftArmRef}
        rightArmRef={rightArmRef}
        leftLegRef={leftLegRef}
        rightLegRef={rightLegRef}
      />
    </group>
  )
}

function Humanoid({ position, leftArmRef, rightArmRef, leftLegRef, rightLegRef }) {
  const groupRef = useRef()
  const playerRotation = useGameStore((s) => s.playerRotation)

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.set(position.current[0], position.current[1] - 0.6, position.current[2])
      groupRef.current.rotation.y = playerRotation
    }
  })

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh position={[0, 1.65, 0]} castShadow>
        <sphereGeometry args={[0.25, 12, 12]} />
        <meshStandardMaterial color="#e8b88a" roughness={0.7} />
      </mesh>

      {/* Hair */}
      <mesh position={[0, 1.82, -0.05]} castShadow>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>

      {/* Torso */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[0.55, 0.7, 0.3]} />
        <meshStandardMaterial color="#2244aa" roughness={0.6} />
      </mesh>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.38, 1.35, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.08, 0.45, 4, 8]} />
          <meshStandardMaterial color="#2244aa" roughness={0.6} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.35, 0]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#e8b88a" roughness={0.7} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.38, 1.35, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.08, 0.45, 4, 8]} />
          <meshStandardMaterial color="#2244aa" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.35, 0]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#e8b88a" roughness={0.7} />
        </mesh>
      </group>

      {/* Hips */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.45, 0.15, 0.28]} />
        <meshStandardMaterial color="#333344" roughness={0.7} />
      </mesh>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.13, 0.35, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.09, 0.45, 4, 8]} />
          <meshStandardMaterial color="#333344" roughness={0.7} />
        </mesh>
        {/* Shoe */}
        <mesh position={[0, -0.35, 0.05]} castShadow>
          <boxGeometry args={[0.12, 0.1, 0.2]} />
          <meshStandardMaterial color="#222222" roughness={0.8} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.13, 0.35, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.09, 0.45, 4, 8]} />
          <meshStandardMaterial color="#333344" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.35, 0.05]} castShadow>
          <boxGeometry args={[0.12, 0.1, 0.2]} />
          <meshStandardMaterial color="#222222" roughness={0.8} />
        </mesh>
      </group>

      {/* Direction indicator arrow on ground */}
      <mesh position={[0, 0.02, -0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.12, 0.35, 6]} />
        <meshStandardMaterial color="#ff4444" emissive="#ff2222" emissiveIntensity={0.5} transparent opacity={0.7} />
      </mesh>
    </group>
  )
}

// Ground physics plane
export function Ground() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    type: 'Static',
    material: { friction: 0.8, restitution: 0.1 },
  }))

  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[500, 500]} />
      <meshStandardMaterial color="#333338" roughness={0.9} />
    </mesh>
  )
}
