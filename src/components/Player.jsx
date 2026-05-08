import React, { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useSphere, usePlane } from '@react-three/cannon'
import * as THREE from 'three'
import useGameStore from '../hooks/useGameStore'
import { keysPressed, getMovementVector } from '../hooks/useKeyboardControls'

const PLAYER_SPEED = 10
const SPRINT_MULTIPLIER = 2.0
const JUMP_FORCE = 7
const CAMERA_DISTANCE = 4
const CAMERA_HEIGHT = 3
const CAMERA_SMOOTHING = 0.12

export default function Player() {
  const { camera } = useThree()
  const setPlayerPosition = useGameStore((s) => s.setPlayerPosition)
  const setPlayerRotation = useGameStore((s) => s.setPlayerRotation)
  const setIsRunning = useGameStore((s) => s.setIsRunning)
  const setSpeed = useGameStore((s) => s.setSpeed)
  const setPlayerMinimapAngle = useGameStore((s) => s.setPlayerMinimapAngle)
  const weapons = useGameStore((s) => s.weapons)
  const currentWeaponIndex = useGameStore((s) => s.currentWeaponIndex)
  const setCurrentWeaponIndex = useGameStore((s) => s.setCurrentWeaponIndex)
  const lastFireTime = useGameStore((s) => s.lastFireTime)
  const setLastFireTime = useGameStore((s) => s.setLastFireTime)
  const setIsShooting = useGameStore((s) => s.setIsShooting)

  const [sphereRef, api] = useSphere(() => ({
    mass: 80,
    position: [0, 2, 0],
    args: [0.5],
    material: { friction: 0.6, restitution: 0.1 },
    linearDamping: 0.5,
    angularDamping: 0.99,
  }))

  const velocity = useRef([0, 0, 0])
  const position = useRef([0, 2, 0])
  const canJump = useRef(true)
  const cameraAngleY = useRef(0)
  const isDragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  const mouseDown = useRef(false)
  const _lookAtTarget = useRef(new THREE.Vector3())

  const leftArmRef = useRef()
  const rightArmRef = useRef()
  const leftLegRef = useRef()
  const rightLegRef = useRef()

  // Shooting raycaster
  const raycaster = useRef(new THREE.Raycaster())
  const projectilesRef = useRef([])

  useEffect(() => {
    const unsubVel = api.velocity.subscribe((v) => { velocity.current = v })
    const unsubPos = api.position.subscribe((p) => { position.current = p })
    return () => { unsubVel(); unsubPos() }
  }, [api])

  // Mouse + keyboard input
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (e.button === 0) {
        mouseDown.current = true
        setIsShooting(true)
      }
      if (e.button === 2) {
        isDragging.current = true
      }
      lastMouse.current = { x: e.clientX, y: e.clientY }
    }
    const handleMouseUp = (e) => {
      if (e.button === 0) {
        mouseDown.current = false
        setIsShooting(false)
      }
      if (e.button === 2) {
        isDragging.current = false
      }
    }
    const handleMouseMove = (e) => {
      if (isDragging.current || mouseDown.current) {
        const dx = e.clientX - lastMouse.current.x
        cameraAngleY.current -= dx * 0.004
      }
      lastMouse.current = { x: e.clientX, y: e.clientY }
    }
    const handleContextMenu = (e) => e.preventDefault()
    const handleWheel = (e) => {
      // Scroll to switch weapons
      if (e.deltaY > 0) {
        setCurrentWeaponIndex((currentWeaponIndex + 1) % weapons.length)
      } else {
        setCurrentWeaponIndex((currentWeaponIndex - 1 + weapons.length) % weapons.length)
      }
    }
    const handleKeyDown = (e) => {
      // Number keys to switch weapons
      if (e.code === 'Digit1') setCurrentWeaponIndex(0)
      if (e.code === 'Digit2') setCurrentWeaponIndex(1)
      if (e.code === 'Digit3') setCurrentWeaponIndex(2)
      if (e.code === 'Digit4') setCurrentWeaponIndex(3)
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('contextmenu', handleContextMenu)
    window.addEventListener('wheel', handleWheel)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('contextmenu', handleContextMenu)
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentWeaponIndex, weapons.length, setCurrentWeaponIndex, setIsShooting])

  useFrame((state, delta) => {
    const { forward, right, jump, sprint } = getMovementVector(keysPressed)
    const speed = PLAYER_SPEED * (sprint ? SPRINT_MULTIPLIER : 1)
    const isMoving = forward !== 0 || right !== 0

    const angle = cameraAngleY.current
    const sinA = Math.sin(angle)
    const cosA = Math.cos(angle)

    const moveX = (right * cosA + forward * sinA) * speed
    const moveZ = (-right * sinA + forward * cosA) * speed

    if (isMoving) {
      api.velocity.set(moveX, velocity.current[1], moveZ)
      setPlayerRotation(Math.atan2(moveX, moveZ))
    } else {
      api.velocity.set(velocity.current[0] * 0.85, velocity.current[1], velocity.current[2] * 0.85)
    }

    if (jump && canJump.current && Math.abs(velocity.current[1]) < 1.5) {
      api.velocity.set(velocity.current[0], JUMP_FORCE, velocity.current[2])
      canJump.current = false
      setTimeout(() => { canJump.current = true }, 400)
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
      if (leftArmRef.current) leftArmRef.current.rotation.x *= 0.9
      if (rightArmRef.current) rightArmRef.current.rotation.x *= 0.9
      if (leftLegRef.current) leftLegRef.current.rotation.x *= 0.9
      if (rightLegRef.current) rightLegRef.current.rotation.x *= 0.9
    }

    // Shooting
    const weapon = weapons[currentWeaponIndex]
    if (mouseDown.current && weapon.ammo > 0) {
      const now = state.clock.getElapsedTime()
      if (now - lastFireTime > weapon.fireRate) {
        setLastFireTime(now)
        fireWeapon(weapon, position.current, cameraAngleY.current)
      }
    }

    // Camera follow
    const pos = position.current
    camera.position.x += (pos[0] + Math.sin(cameraAngleY.current) * CAMERA_DISTANCE - camera.position.x) * CAMERA_SMOOTHING
    camera.position.y += (pos[1] + CAMERA_HEIGHT - camera.position.y) * CAMERA_SMOOTHING
    camera.position.z += (pos[2] + Math.cos(cameraAngleY.current) * CAMERA_DISTANCE - camera.position.z) * CAMERA_SMOOTHING
    _lookAtTarget.current.set(pos[0], pos[1] + 1.5, pos[2])
    camera.lookAt(_lookAtTarget.current)
  })

  function fireWeapon(weapon, pos, angle) {
    if (weapon.type === 'melee') return // TODO: melee
    const dir = new THREE.Vector3(-Math.sin(angle), 0, -Math.cos(angle))
    const origin = new THREE.Vector3(pos[0], pos[1] + 1.2, pos[2])
    // Spawn projectile
    projectilesRef.current.push({
      origin: origin.clone(),
      direction: dir.clone(),
      speed: weapon.type === 'rocket' ? 40 : 120,
      time: 0,
      maxTime: weapon.range / (weapon.type === 'rocket' ? 40 : 120),
      type: weapon.type,
      damage: weapon.damage,
    })
    // Decrease ammo
    if (weapon.ammo !== Infinity) {
      const w = [...weapons]
      w[currentWeaponIndex] = { ...w[currentWeaponIndex], ammo: w[currentWeaponIndex].ammo - 1 }
      useGameStore.setState({ weapons: w })
    }
  }

  return (
    <group>
      <mesh ref={sphereRef}>
        <sphereGeometry args={[0.01]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      <Humanoid
        position={position}
        leftArmRef={leftArmRef}
        rightArmRef={rightArmRef}
        leftLegRef={leftLegRef}
        rightLegRef={rightLegRef}
        currentWeaponIndex={currentWeaponIndex}
      />

      <Projectiles projectilesRef={projectilesRef} />
    </group>
  )
}

function Projectiles({ projectilesRef }) {
  const groupRef = useRef()
  const meshRefs = useRef([])

  useFrame((state, delta) => {
    const projectiles = projectilesRef.current
    // Update existing projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i]
      p.time += delta
      if (p.time > p.maxTime) {
        projectiles.splice(i, 1)
        continue
      }
    }
    // Sync visual meshes
    if (groupRef.current) {
      // Remove extra children
      while (groupRef.current.children.length > projectiles.length) {
        groupRef.current.remove(groupRef.current.children[groupRef.current.children.length - 1])
      }
      // Add missing children
      while (groupRef.current.children.length < projectiles.length) {
        const geo = new THREE.SphereGeometry(0.1, 6, 6)
        const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 })
        const mesh = new THREE.Mesh(geo, mat)
        groupRef.current.add(mesh)
      }
      // Update positions
      for (let i = 0; i < projectiles.length; i++) {
        const p = projectiles[i]
        const dist = p.speed * p.time
        groupRef.current.children[i].position.set(
          p.origin.x + p.direction.x * dist,
          p.origin.y + p.direction.y * dist,
          p.origin.z + p.direction.z * dist
        )
        if (p.type === 'rocket') {
          groupRef.current.children[i].scale.setScalar(2)
          groupRef.current.children[i].material.color.setHex(0xff4400)
        }
      }
    }
  })

  return <group ref={groupRef} />
}

function Humanoid({ position, leftArmRef, rightArmRef, leftLegRef, rightLegRef, currentWeaponIndex }) {
  const groupRef = useRef()
  const playerRotation = useGameStore((s) => s.playerRotation)
  const weaponColors = ['#e8b88a', '#333333', '#555555', '#445544']

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
        <mesh position={[0, -0.35, 0]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#e8b88a" roughness={0.7} />
        </mesh>
      </group>
      {/* Right Arm + Weapon */}
      <group ref={rightArmRef} position={[0.38, 1.35, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.08, 0.45, 4, 8]} />
          <meshStandardMaterial color="#2244aa" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.35, 0]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#e8b88a" roughness={0.7} />
        </mesh>
        {/* Weapon in hand */}
        {currentWeaponIndex > 0 && (
          <mesh position={[0, -0.3, 0.15]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={currentWeaponIndex === 3 ? [0.06, 0.06, 0.6] : [0.05, 0.08, 0.3]} />
            <meshStandardMaterial color={weaponColors[currentWeaponIndex]} metalness={0.7} roughness={0.3} />
          </mesh>
        )}
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
      {/* Direction indicator */}
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
