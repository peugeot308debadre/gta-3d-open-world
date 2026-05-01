import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { wetGroundVertexShader, wetGroundFragmentShader } from '../shaders/wetGround'

// Seeded random for deterministic generation
function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

// Building colors palette (urban style)
const BUILDING_COLORS = [
  '#2a2a3a', '#3a3a4a', '#4a4a5a', '#353545',
  '#404050', '#2d2d3d', '#383848', '#454555',
  '#505065', '#3b3b4b', '#424252', '#484858',
]

const WINDOW_COLOR = '#88aacc'
const WINDOW_LIT_COLOR = '#ffdd88'

export default function City() {
  return (
    <group>
      <Buildings />
      <Roads />
      <WetGround />
      <StreetLights />
      <Sidewalks />
    </group>
  )
}

function Buildings() {
  const buildingsRef = useRef()
  const windowRefs = useRef([])
  const random = seededRandom(42)

  // Generate building data
  const buildingData = useMemo(() => {
    const buildings = []
    const rng = seededRandom(42)

    // Grid-based city layout with roads
    const gridSize = 6
    const blockSize = 18
    const roadWidth = 8

    for (let gx = -gridSize; gx <= gridSize; gx++) {
      for (let gz = -gridSize; gz <= gridSize; gz++) {
        // Skip center area for player spawn
        if (Math.abs(gx) <= 1 && Math.abs(gz) <= 1) continue

        const blockCenterX = gx * (blockSize + roadWidth)
        const blockCenterZ = gz * (blockSize + roadWidth)

        // Place 1-4 buildings per block
        const numBuildings = Math.floor(rng() * 3) + 1

        for (let b = 0; b < numBuildings; b++) {
          const width = 4 + rng() * 10
          const depth = 4 + rng() * 10
          const height = 6 + rng() * 40

          const offsetX = (rng() - 0.5) * (blockSize - width)
          const offsetZ = (rng() - 0.5) * (blockSize - depth)

          buildings.push({
            position: [blockCenterX + offsetX, height / 2, blockCenterZ + offsetZ],
            scale: [width, height, depth],
            color: BUILDING_COLORS[Math.floor(rng() * BUILDING_COLORS.length)],
            windowLit: rng() > 0.5,
            id: buildings.length,
          })
        }
      }
    }
    return buildings
  }, [])

  return (
    <group ref={buildingsRef}>
      {buildingData.map((bld, i) => (
        <Building key={i} data={bld} />
      ))}
    </group>
  )
}

function Building({ data }) {
  const meshRef = useRef()
  const { position, scale, color, windowLit } = data

  return (
    <group position={position}>
      {/* Main building body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[scale[0], scale[1], scale[2]]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Windows - front face */}
      <WindowGrid
        width={scale[0]}
        height={scale[1]}
        depth={scale[2]}
        windowLit={windowLit}
      />

      {/* Roof detail */}
      <mesh position={[0, scale[1] / 2 + 0.3, 0]} castShadow>
        <boxGeometry args={[scale[0] * 0.9, 0.6, scale[2] * 0.9]} />
        <meshStandardMaterial color="#555565" roughness={0.8} />
      </mesh>
    </group>
  )
}

function WindowGrid({ width, height, depth, windowLit }) {
  const windowRows = Math.max(1, Math.floor(height / 3))
  const windowCols = Math.max(1, Math.floor(width / 2.5))
  const windows = []

  for (let row = 0; row < windowRows; row++) {
    for (let col = 0; col < windowCols; col++) {
      const x = ((col + 0.5) / windowCols - 0.5) * width * 0.85
      const y = ((row + 0.5) / windowRows - 0.5) * height * 0.9

      // Front face windows
      windows.push(
        <mesh key={`f${row}-${col}`} position={[x, y, depth / 2 + 0.01]}>
          <planeGeometry args={[1.2, 1.8]} />
          <meshStandardMaterial
            color={windowLit && Math.random() > 0.3 ? WINDOW_LIT_COLOR : WINDOW_COLOR}
            emissive={windowLit && Math.random() > 0.3 ? '#ffdd44' : '#000000'}
            emissiveIntensity={windowLit ? 0.3 : 0}
          />
        </mesh>
      )

      // Back face windows
      windows.push(
        <mesh key={`b${row}-${col}`} position={[x, y, -depth / 2 - 0.01]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.2, 1.8]} />
          <meshStandardMaterial
            color={windowLit && Math.random() > 0.4 ? WINDOW_LIT_COLOR : WINDOW_COLOR}
            emissive={windowLit && Math.random() > 0.4 ? '#ffdd44' : '#000000'}
            emissiveIntensity={windowLit ? 0.3 : 0}
          />
        </mesh>
      )
    }
  }

  return <group>{windows}</group>
}

function Roads() {
  const roads = []
  const gridSize = 7
  const blockSize = 18
  const roadWidth = 8
  const roadLength = gridSize * 2 * (blockSize + roadWidth) + blockSize

  // Horizontal roads
  for (let i = -gridSize; i <= gridSize; i++) {
    const z = i * (blockSize + roadWidth) - roadWidth / 2
    roads.push(
      <mesh key={`h${i}`} position={[0, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[roadLength, roadWidth]} />
        <meshStandardMaterial color="#2a2a30" roughness={0.95} />
      </mesh>
    )

    // Road center line
    roads.push(
      <mesh key={`hl${i}`} position={[0, 0.03, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roadLength, 0.15]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={0.2} />
      </mesh>
    )
  }

  // Vertical roads
  for (let i = -gridSize; i <= gridSize; i++) {
    const x = i * (blockSize + roadWidth) - roadWidth / 2
    roads.push(
      <mesh key={`v${i}`} position={[x, 0.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} receiveShadow>
        <planeGeometry args={[roadLength, roadWidth]} />
        <meshStandardMaterial color="#2a2a30" roughness={0.95} />
      </mesh>
    )

    roads.push(
      <mesh key={`vl${i}`} position={[x, 0.03, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[roadLength, 0.15]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={0.2} />
      </mesh>
    )
  }

  return <group>{roads}</group>
}

function WetGround() {
  const materialRef = useRef()
  const startTime = useRef(Date.now())

  useFrame((state) => {
    if (materialRef.current) {
      const elapsed = (Date.now() - startTime.current) / 1000
      materialRef.current.uniforms.uTime.value = elapsed
    }
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
      <planeGeometry args={[500, 500, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={wetGroundVertexShader}
        fragmentShader={wetGroundFragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uRainIntensity: { value: 0.5 },
          uLightDirection: { value: new THREE.Vector3(0.5, 1.0, 0.3).normalize() },
          uLightColor: { value: new THREE.Vector3(1.0, 0.95, 0.9) },
          uAmbientIntensity: { value: 0.4 },
        }}
      />
    </mesh>
  )
}

function StreetLights() {
  const lights = []
  const gridSize = 6
  const blockSize = 18
  const roadWidth = 8

  for (let i = -gridSize; i <= gridSize; i += 2) {
    const pos = i * (blockSize + roadWidth)

    // Lights along X roads
    lights.push(
      <group key={`lx${i}`} position={[pos, 0, -roadWidth / 2 - 1]}>
        <mesh position={[0, 4, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 4, 6]} />
          <meshStandardMaterial color="#555555" metalness={0.8} />
        </mesh>
        <pointLight position={[0, 4.2, 0]} color="#ffcc77" intensity={15} distance={20} />
        <mesh position={[0, 4.3, 0]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial color="#ffcc77" emissive="#ffcc44" emissiveIntensity={2} />
        </mesh>
      </group>
    )

    // Lights along Z roads
    lights.push(
      <group key={`lz${i}`} position={[-roadWidth / 2 - 1, 0, pos]}>
        <mesh position={[0, 4, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 4, 6]} />
          <meshStandardMaterial color="#555555" metalness={0.8} />
        </mesh>
        <pointLight position={[0, 4.2, 0]} color="#ffcc77" intensity={15} distance={20} />
        <mesh position={[0, 4.3, 0]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial color="#ffcc77" emissive="#ffcc44" emissiveIntensity={2} />
        </mesh>
      </group>
    )
  }

  return <group>{lights}</group>
}

function Sidewalks() {
  const sidewalks = []
  const gridSize = 7
  const blockSize = 18
  const roadWidth = 8

  for (let gx = -gridSize; gx <= gridSize; gx++) {
    for (let gz = -gridSize; gz <= gridSize; gz++) {
      const x = gx * (blockSize + roadWidth)
      const z = gz * (blockSize + roadWidth)

      sidewalks.push(
        <mesh key={`sw${gx}_${gz}`} position={[x, 0.15, z]} receiveShadow>
          <boxGeometry args={[blockSize + 2, 0.3, blockSize + 2]} />
          <meshStandardMaterial color="#666668" roughness={0.9} />
        </mesh>
      )
    }
  }

  return <group>{sidewalks}</group>
}
