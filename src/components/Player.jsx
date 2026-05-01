import React, { useRef, useEffect, useCallback } from 'react'
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

  useEffect(() => {
    const unsubVel = api.velocity.subscribe((v) => {
      velocity.current = v
    })
    const unsubPos = api.position.subscribe((p) => {
      position.current = p
    })
    return () => {
      unsubVel()
      unsubPos()
    }
  }, [api])

  // Mouse look controls
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (e.button === 2 || e.button === 0) {
        isDragging.current = true
        lastMouse.current = { x: e.clientX, y: e.clientY }
      }
    }
    const handleMouseUp = () => {
      isDragging.current = false
    }
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

    // Calculate movement direction relative to camera angle
    const angle = cameraAngleY.current
    const sinA = Math.sin(angle)
    const cosA = Math.cos(angle)

    const moveX = (right * cosA + forward * sinA) * speed
    const moveZ = (-right * sinA + forward * cosA) * speed

    if (isMoving) {
      api.velocity.set(
        moveX * DAMPING,
        velocity.current[1],
        moveZ * DAMPING
      )

      // Player rotation faces movement direction
      const targetRotation = Math.atan2(moveX, moveZ)
      setPlayerRotation(targetRotation)
    } else {
      // Apply damping when not moving
      api.velocity.set(
        velocity.current[0] * 0.9,
        velocity.current[1],
        velocity.current[2] * 0.9
      )
    }

    // Jump
    if (jump && canJump.current && Math.abs(velocity.current[1]) < 0.5) {
      api.velocity.set(velocity.current[0], JUMP_FORCE, velocity.current[2])
      canJump.current = false
      setTimeout(() => { canJump.current = true }, 500)
    }

    // Update store
    setPlayerPosition([...position.current])
    setIsRunning(sprint && isMoving)
    setSpeed(isMoving ? (sprint ? 2 : 1) : 0)
    setPlayerMinimapAngle(cameraAngleY.current)

    // Smooth camera follow
    const pos = position.current
    const targetCamX = pos[0] + Math.sin(cameraAngleY.current) * CAMERA_DISTANCE
    const targetCamZ = pos[2] + Math.cos(cameraAngleY.current) * CAMERA_DISTANCE
    const targetCamY = pos[1] + CAMERA_HEIGHT

    camera.position.x += (targetCamX - camera.position.x) * CAMERA_SMOOTHING
    camera.position.y += (targetCamY - camera.position.y) * CAMERA_SMOOTHING
    camera.position.z += (targetCamZ - camera.position.z) * CAMERA_SMOOTHING

    const lookTarget = new THREE.Vector3(pos[0], pos[1] + 1.5, pos[2])
    camera.lookAt(lookTarget)
  })

  return (
    <group>
      {/* Player capsule body */}
      <mesh ref={sphereRef} castShadow>
        <capsuleGeometry args={[0.4, 1.0, 8, 16]} />
        <meshStandardMaterial color="#4488ff" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Direction indicator (arrow) */}
      <PlayerDirectionIndicator />
    </group>
  )
}

function PlayerDirectionIndicator() {
  const ref = useRef()
  const playerRotation = useGameStore((s) => s.playerRotation)

  useFrame(() => {
    if (ref.current) {
      ref.current.position.y = 2.0
      ref.current.rotation.y = playerRotation
    }
  })

  return (
    <group ref={ref}>
      <mesh position={[0, 0, -0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.15, 0.4, 8]} />
        <meshStandardMaterial color="#ff4444" emissive="#ff2222" emissiveIntensity={0.5} />
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
