import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useBox } from '@react-three/cannon'
import * as THREE from 'three'
import useGameStore from '../hooks/useGameStore'

const NUM_VEHICLES = 20
const VEHICLE_SPEED_MIN = 3
const VEHICLE_SPEED_MAX = 8
const ROAD_SPACING = 26 // blockSize + roadWidth from City.jsx

const VEHICLE_COLORS = [
  '#cc3333', '#33cc33', '#3333cc', '#cccc33',
  '#cc33cc', '#33cccc', '#cc6633', '#6633cc',
  '#33cc66', '#cc3366', '#66cc33', '#3366cc',
  '#ff5555', '#55ff55', '#5555ff', '#ffff55',
  '#ff55ff', '#55ffff', '#ff8855', '#8855ff',
]

export default function Vehicles() {
  const setNpcPositions = useGameStore((s) => s.setNpcPositions)

  // Define road routes
  const routes = useMemo(() => {
    const r = []
    const gridSize = 6
    for (let i = -gridSize; i <= gridSize; i++) {
      // Horizontal roads (X-direction travel)
      r.push({
        direction: 'x',
        fixedAxis: i * ROAD_SPACING - ROAD_SPACING / 2 + 2,
        length: gridSize * 2 * ROAD_SPACING,
        forward: i % 2 === 0 ? 1 : -1,
      })
      // Vertical roads (Z-direction travel)
      r.push({
        direction: 'z',
        fixedAxis: i * ROAD_SPACING - ROAD_SPACING / 2 + 2,
        length: gridSize * 2 * ROAD_SPACING,
        forward: i % 2 === 0 ? 1 : -1,
      })
    }
    return r
  }, [])

  // Generate vehicles
  const vehicleData = useMemo(() => {
    const vehicles = []
    for (let i = 0; i < NUM_VEHICLES; i++) {
      const route = routes[i % routes.length]
      const progress = (Math.random() - 0.5) * route.length
      const speed = VEHICLE_SPEED_MIN + Math.random() * (VEHICLE_SPEED_MAX - VEHICLE_SPEED_MIN)

      vehicles.push({
        id: i,
        route,
        progress,
        speed: speed * route.forward,
        color: VEHICLE_COLORS[i % VEHICLE_COLORS.length],
      })
    }
    return vehicles
  }, [routes])

  const positionsRef = useRef(vehicleData.map(() => [0, 0, 0]))

  useFrame(() => {
    // Update NPC positions for minimap
    setNpcPositions(positionsRef.current.map((p) => [...p]))
  })

  return (
    <group>
      {vehicleData.map((vehicle, i) => (
        <Vehicle
          key={vehicle.id}
          data={vehicle}
          positionsRef={positionsRef}
          index={i}
        />
      ))}
    </group>
  )
}

function Vehicle({ data, positionsRef, index }) {
  const groupRef = useRef()
  const { route, speed, color } = data
  const progressRef = useRef(data.progress)

  useFrame((state, delta) => {
    if (!groupRef.current) return

    progressRef.current += speed * delta

    // Wrap around
    const halfLength = route.length / 2
    if (progressRef.current > halfLength) progressRef.current = -halfLength
    if (progressRef.current < -halfLength) progressRef.current = halfLength

    let x, z, rotation
    if (route.direction === 'x') {
      x = progressRef.current
      z = route.fixedAxis
      rotation = route.forward > 0 ? 0 : Math.PI
    } else {
      x = route.fixedAxis
      z = progressRef.current
      rotation = route.forward > 0 ? Math.PI / 2 : -Math.PI / 2
    }

    groupRef.current.position.set(x, 0.6, z)
    groupRef.current.rotation.y = rotation

    // Store position for minimap
    positionsRef.current[index] = [x, 0.6, z]
  })

  return (
    <group ref={groupRef}>
      {/* Car body */}
      <mesh castShadow>
        <boxGeometry args={[2.0, 0.8, 3.5]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Car roof */}
      <mesh position={[0, 0.5, -0.2]} castShadow>
        <boxGeometry args={[1.8, 0.6, 2.0]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Headlights */}
      <mesh position={[-0.7, 0, 1.76]}>
        <boxGeometry args={[0.3, 0.2, 0.05]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffcc" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.7, 0, 1.76]}>
        <boxGeometry args={[0.3, 0.2, 0.05]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffcc" emissiveIntensity={2} />
      </mesh>

      {/* Tail lights */}
      <mesh position={[-0.7, 0, -1.76]}>
        <boxGeometry args={[0.3, 0.2, 0.05]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1} />
      </mesh>
      <mesh position={[0.7, 0, -1.76]}>
        <boxGeometry args={[0.3, 0.2, 0.05]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1} />
      </mesh>

      {/* Wheels */}
      <Wheel position={[-1.0, -0.35, 1.1]} />
      <Wheel position={[1.0, -0.35, 1.1]} />
      <Wheel position={[-1.0, -0.35, -1.1]} />
      <Wheel position={[1.0, -0.35, -1.1]} />
    </group>
  )
}

function Wheel({ position }) {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.3, 0.3, 0.2, 12]} />
      <meshStandardMaterial color="#222222" roughness={0.9} />
    </mesh>
  )
}
