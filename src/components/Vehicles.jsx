import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useGameStore from '../hooks/useGameStore'

const NUM_VEHICLES = 20
const VEHICLE_SPEED_MIN = 3
const VEHICLE_SPEED_MAX = 8
const ROAD_SPACING = 26

const VEHICLE_TYPES = ['sedan', 'suv', 'sport', 'truck']

function getVehicleConfig(type, color) {
  switch (type) {
    case 'sedan':
      return { bodyW: 2.0, bodyH: 0.7, bodyD: 4.2, cabinH: 0.55, cabinD: 2.0, cabinOffset: -0.2, wheelR: 0.3, color, mass: 'normal' }
    case 'suv':
      return { bodyW: 2.2, bodyH: 0.9, bodyD: 4.5, cabinH: 0.7, cabinD: 2.2, cabinOffset: -0.3, wheelR: 0.38, color, mass: 'heavy' }
    case 'sport':
      return { bodyW: 1.9, bodyH: 0.5, bodyD: 4.6, cabinH: 0.4, cabinD: 1.6, cabinOffset: -0.1, wheelR: 0.28, color, mass: 'light' }
    case 'truck':
      return { bodyW: 2.3, bodyH: 1.0, bodyD: 5.0, cabinH: 0.8, cabinD: 1.8, cabinOffset: -1.2, wheelR: 0.4, color, mass: 'heavy' }
    default:
      return { bodyW: 2.0, bodyH: 0.7, bodyD: 4.2, cabinH: 0.55, cabinD: 2.0, cabinOffset: -0.2, wheelR: 0.3, color, mass: 'normal' }
  }
}

const VEHICLE_COLORS = [
  '#cc3333', '#33cc33', '#3333cc', '#cccc33',
  '#cc33cc', '#33cccc', '#cc6633', '#6633cc',
  '#33cc66', '#cc3366', '#66cc33', '#3366cc',
  '#ff5555', '#55ff55', '#5555ff', '#ffff55',
  '#ff55ff', '#55ffff', '#ff8855', '#8855ff',
]

export default function Vehicles() {
  const setNpcPositions = useGameStore((s) => s.setNpcPositions)

  const routes = useMemo(() => {
    const r = []
    const gridSize = 6
    for (let i = -gridSize; i <= gridSize; i++) {
      r.push({ direction: 'x', fixedAxis: i * ROAD_SPACING - ROAD_SPACING / 2 + 2, length: gridSize * 2 * ROAD_SPACING, forward: i % 2 === 0 ? 1 : -1 })
      r.push({ direction: 'z', fixedAxis: i * ROAD_SPACING - ROAD_SPACING / 2 + 2, length: gridSize * 2 * ROAD_SPACING, forward: i % 2 === 0 ? 1 : -1 })
    }
    return r
  }, [])

  const vehicleData = useMemo(() => {
    const vehicles = []
    for (let i = 0; i < NUM_VEHICLES; i++) {
      const route = routes[i % routes.length]
      const progress = (Math.random() - 0.5) * route.length
      const speed = VEHICLE_SPEED_MIN + Math.random() * (VEHICLE_SPEED_MAX - VEHICLE_SPEED_MIN)
      const type = VEHICLE_TYPES[i % VEHICLE_TYPES.length]
      const color = VEHICLE_COLORS[i % VEHICLE_COLORS.length]

      vehicles.push({ id: i, route, progress, speed: speed * route.forward, type, color, config: getVehicleConfig(type, color) })
    }
    return vehicles
  }, [routes])

  const positionsRef = useRef(vehicleData.map(() => [0, 0, 0]))

  useFrame(() => {
    setNpcPositions(positionsRef.current.map((p) => [...p]))
  })

  return (
    <group>
      {vehicleData.map((vehicle, i) => (
        <Vehicle key={vehicle.id} data={vehicle} positionsRef={positionsRef} index={i} />
      ))}
    </group>
  )
}

function Vehicle({ data, positionsRef, index }) {
  const groupRef = useRef()
  const { route, speed, type, color, config } = data
  const progressRef = useRef(data.progress)

  useFrame((state, delta) => {
    if (!groupRef.current) return

    progressRef.current += speed * delta

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

    const y = config.wheelR + 0.05
    groupRef.current.position.set(x, y, z)
    groupRef.current.rotation.y = rotation

    positionsRef.current[index] = [x, y, z]
  })

  const { bodyW, bodyH, bodyD, cabinH, cabinD, cabinOffset, wheelR } = config

  return (
    <group ref={groupRef}>
      {/* Lower body / chassis */}
      <mesh castShadow>
        <boxGeometry args={[bodyW, bodyH, bodyD]} />
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.75} />
      </mesh>

      {/* Cabin */}
      <mesh position={[0, bodyH / 2 + cabinH / 2, cabinOffset]} castShadow>
        <boxGeometry args={[bodyW * 0.9, cabinH, cabinD]} />
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.75} />
      </mesh>

      {/* Windshield (front) */}
      <mesh position={[0, bodyH / 2 + cabinH * 0.4, cabinOffset + cabinD / 2 + 0.01]} rotation={[0.15, 0, 0]}>
        <planeGeometry args={[bodyW * 0.8, cabinH * 0.7]} />
        <meshStandardMaterial color="#88aacc" roughness={0.1} metalness={0.2} transparent opacity={0.6} />
      </mesh>

      {/* Rear window */}
      <mesh position={[0, bodyH / 2 + cabinH * 0.4, cabinOffset - cabinD / 2 - 0.01]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[bodyW * 0.8, cabinH * 0.6]} />
        <meshStandardMaterial color="#88aacc" roughness={0.1} metalness={0.2} transparent opacity={0.6} />
      </mesh>

      {/* Side windows */}
      <mesh position={[bodyW * 0.9 / 2 + 0.01, bodyH / 2 + cabinH * 0.4, cabinOffset]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[cabinD * 0.8, cabinH * 0.6]} />
        <meshStandardMaterial color="#88aacc" roughness={0.1} transparent opacity={0.5} />
      </mesh>
      <mesh position={[-bodyW * 0.9 / 2 - 0.01, bodyH / 2 + cabinH * 0.4, cabinOffset]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[cabinD * 0.8, cabinH * 0.6]} />
        <meshStandardMaterial color="#88aacc" roughness={0.1} transparent opacity={0.5} />
      </mesh>

      {/* Headlights */}
      <Headlight position={[-bodyW / 2 + 0.3, 0, bodyD / 2 + 0.01]} />
      <Headlight position={[bodyW / 2 - 0.3, 0, bodyD / 2 + 0.01]} />

      {/* Tail lights */}
      <mesh position={[-bodyW / 2 + 0.25, 0.05, -bodyD / 2 - 0.01]}>
        <boxGeometry args={[0.35, 0.15, 0.05]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[bodyW / 2 - 0.25, 0.05, -bodyD / 2 - 0.01]}>
        <boxGeometry args={[0.35, 0.15, 0.05]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1.5} />
      </mesh>

      {/* Wheels */}
      <Wheel position={[-bodyW / 2 - 0.05, -bodyH / 2, bodyD / 2 - 0.8]} radius={wheelR} />
      <Wheel position={[bodyW / 2 + 0.05, -bodyH / 2, bodyD / 2 - 0.8]} radius={wheelR} />
      <Wheel position={[-bodyW / 2 - 0.05, -bodyH / 2, -bodyD / 2 + 0.8]} radius={wheelR} />
      <Wheel position={[bodyW / 2 + 0.05, -bodyH / 2, -bodyD / 2 + 0.8]} radius={wheelR} />

      {/* Rearview mirrors */}
      <mesh position={[-bodyW / 2 - 0.15, bodyH / 2 + 0.1, cabinOffset + cabinD / 2 - 0.3]}>
        <boxGeometry args={[0.15, 0.1, 0.08]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[bodyW / 2 + 0.15, bodyH / 2 + 0.1, cabinOffset + cabinD / 2 - 0.3]}>
        <boxGeometry args={[0.15, 0.1, 0.08]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  )
}

function Headlight({ position }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.3, 0.18, 0.05]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffcc" emissiveIntensity={2.5} />
      </mesh>
      <pointLight position={[0, 0, 0.3]} color="#ffffdd" intensity={5} distance={15} decay={2} />
    </group>
  )
}

function Wheel({ position, radius }) {
  return (
    <group position={position}>
      {/* Tire */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius, radius, 0.18, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
      </mesh>
      {/* Hubcap */}
      <mesh position={[0, 0, 0.1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius * 0.55, radius * 0.55, 0.02, 12]} />
        <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}
