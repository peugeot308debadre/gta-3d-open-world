import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useGameStore from '../hooks/useGameStore'

const NUM_VEHICLES = 24
const VEHICLE_SPEED_MIN = 4
const VEHICLE_SPEED_MAX = 10
const ROAD_SPACING = 26
const BLOCK = 18
const ROAD_W = 8

const VEHICLE_TYPES = ['sedan', 'suv', 'sport', 'truck']

function getVehicleConfig(type, color) {
  switch (type) {
    case 'sedan': return { bodyW: 1.8, bodyH: 0.6, bodyD: 3.8, cabinH: 0.5, cabinD: 1.8, cabinOff: -0.2, wheelR: 0.28, color }
    case 'suv': return { bodyW: 2.0, bodyH: 0.8, bodyD: 4.2, cabinH: 0.65, cabinD: 2.0, cabinOff: -0.3, wheelR: 0.35, color }
    case 'sport': return { bodyW: 1.7, bodyH: 0.45, bodyD: 4.0, cabinH: 0.35, cabinD: 1.4, cabinOff: -0.1, wheelR: 0.25, color }
    case 'truck': return { bodyW: 2.2, bodyH: 0.9, bodyD: 4.8, cabinH: 0.7, cabinD: 1.6, cabinOff: -1.2, wheelR: 0.38, color }
    default: return { bodyW: 1.8, bodyH: 0.6, bodyD: 3.8, cabinH: 0.5, cabinD: 1.8, cabinOff: -0.2, wheelR: 0.28, color }
  }
}

const VEHICLE_COLORS = [
  '#cc3333', '#33cc33', '#3333cc', '#cccc33',
  '#cc33cc', '#33cccc', '#cc6633', '#6633cc',
  '#ffffff', '#222222', '#ff5555', '#5555ff',
  '#ff8844', '#44ff88', '#8844ff', '#ffaa00',
  '#aacc44', '#44aacc', '#cc44aa', '#888888',
  '#dd6666', '#66dd66', '#6666dd', '#dddd66',
]

export default function Vehicles() {
  const setNpcPositions = useGameStore((s) => s.setNpcPositions)

  // Each vehicle follows a waypoint path on the road grid
  const vehicleData = useMemo(() => {
    const vehicles = []
    const gridSize = 6

    for (let i = 0; i < NUM_VEHICLES; i++) {
      const type = VEHICLE_TYPES[i % VEHICLE_TYPES.length]
      const color = VEHICLE_COLORS[i % VEHICLE_COLORS.length]
      const speed = VEHICLE_SPEED_MIN + Math.random() * (VEHICLE_SPEED_MAX - VEHICLE_SPEED_MIN)
      const config = getVehicleConfig(type, color)

      // Pick a random road to start on
      const roadIdx = Math.floor(Math.random() * (gridSize * 2 + 1)) - gridSize
      const isHorizontal = i % 2 === 0
      const lane = (Math.random() > 0.5 ? 1 : -1) * 2 // Which side of road

      vehicles.push({
        id: i, type, color, config, speed,
        roadIdx, isHorizontal, lane,
        progress: (Math.random() - 0.5) * gridSize * 2 * ROAD_SPACING,
        direction: Math.random() > 0.5 ? 1 : -1,
      })
    }
    return vehicles
  }, [])

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
  const { speed, type, color, config, roadIdx, isHorizontal, lane, direction } = data
  const progressRef = useRef(data.progress)

  useFrame((state, delta) => {
    if (!groupRef.current) return

    progressRef.current += speed * direction * delta

    const halfGrid = 7 * ROAD_SPACING
    if (progressRef.current > halfGrid) progressRef.current = -halfGrid
    if (progressRef.current < -halfGrid) progressRef.current = halfGrid

    let x, z, rotation
    const roadCenter = roadIdx * ROAD_SPACING

    if (isHorizontal) {
      // Car drives along X axis, road at fixed Z
      x = progressRef.current
      z = roadCenter + lane
      rotation = direction > 0 ? 0 : Math.PI
    } else {
      // Car drives along Z axis, road at fixed X
      x = roadCenter + lane
      z = progressRef.current
      rotation = direction > 0 ? Math.PI / 2 : -Math.PI / 2
    }

    const y = config.wheelR + 0.02
    groupRef.current.position.set(x, y, z)
    groupRef.current.rotation.y = rotation

    positionsRef.current[index] = [x, y, z]
  })

  const { bodyW, bodyH, bodyD, cabinH, cabinD, cabinOff, wheelR } = config

  return (
    <group ref={groupRef}>
      {/* Lower body */}
      <mesh castShadow>
        <boxGeometry args={[bodyW, bodyH, bodyD]} />
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.75} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, bodyH / 2 + cabinH / 2, cabinOff]} castShadow>
        <boxGeometry args={[bodyW * 0.88, cabinH, cabinD]} />
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.75} />
      </mesh>
      {/* Windshield */}
      <mesh position={[0, bodyH / 2 + cabinH * 0.4, cabinOff + cabinD / 2 + 0.01]} rotation={[0.15, 0, 0]}>
        <planeGeometry args={[bodyW * 0.78, cabinH * 0.65]} />
        <meshStandardMaterial color="#88aacc" roughness={0.1} metalness={0.2} transparent opacity={0.6} />
      </mesh>
      {/* Side windows */}
      <mesh position={[bodyW * 0.88 / 2 + 0.01, bodyH / 2 + cabinH * 0.4, cabinOff]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[cabinD * 0.78, cabinH * 0.55]} />
        <meshStandardMaterial color="#88aacc" roughness={0.1} transparent opacity={0.5} />
      </mesh>
      <mesh position={[-bodyW * 0.88 / 2 - 0.01, bodyH / 2 + cabinH * 0.4, cabinOff]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[cabinD * 0.78, cabinH * 0.55]} />
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
      <Wheel position={[-bodyW / 2 - 0.04, -bodyH / 2, bodyD / 2 - 0.7]} r={wheelR} />
      <Wheel position={[bodyW / 2 + 0.04, -bodyH / 2, bodyD / 2 - 0.7]} r={wheelR} />
      <Wheel position={[-bodyW / 2 - 0.04, -bodyH / 2, -bodyD / 2 + 0.7]} r={wheelR} />
      <Wheel position={[bodyW / 2 + 0.04, -bodyH / 2, -bodyD / 2 + 0.7]} r={wheelR} />
      {/* Rearview mirrors */}
      <mesh position={[-bodyW / 2 - 0.12, bodyH / 2 + 0.1, cabinOff + cabinD / 2 - 0.3]}>
        <boxGeometry args={[0.12, 0.08, 0.06]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[bodyW / 2 + 0.12, bodyH / 2 + 0.1, cabinOff + cabinD / 2 - 0.3]}>
        <boxGeometry args={[0.12, 0.08, 0.06]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  )
}

function Headlight({ position }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.28, 0.16, 0.05]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffcc" emissiveIntensity={2.5} />
      </mesh>
      <pointLight position={[0, 0, 0.3]} color="#ffffdd" intensity={5} distance={15} decay={2} />
    </group>
  )
}

function Wheel({ position, r }) {
  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[r, r, 0.16, 14]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0, 0.09]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[r * 0.52, r * 0.52, 0.02, 10]} />
        <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}
