import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { wetGroundVertexShader, wetGroundFragmentShader } from '../shaders/wetGround'
import {
  createAsphaltTexture,
  createConcreteTexture,
  createGrassTexture,
  createBrickTexture,
  createMetalTexture,
  createWoodTexture,
  createSignTexture,
  createNeonSignTexture,
  createCrosswalkTexture,
  createWindowTexture,
  createRoofTexture,
} from '../utils/proceduralTextures'

// Seeded random
function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export const BLOCK_SIZE = 18
export const ROAD_WIDTH = 8
export const ROAD_SPACING = BLOCK_SIZE + ROAD_WIDTH

const BUILDING_TYPES = ['residential', 'commercial', 'skyscraper', 'industrial', 'modern']

export default function City() {
  return (
    <group>
      <Buildings />
      <Roads />
      <Crosswalks />
      <WetGround />
      <StreetLights />
      <Sidewalks />
      <GrassAreas />
      <Trees />
      <TrafficLights />
      <StreetFurniture />
      <StreetSigns />
    </group>
  )
}

// =================== PHASE 3: BUILDINGS 2.0 ===================

function Buildings() {
  const buildingData = useMemo(() => {
    const buildings = []
    const rng = seededRandom(42)
    const gridSize = 6

    for (let gx = -gridSize; gx <= gridSize; gx++) {
      for (let gz = -gridSize; gz <= gridSize; gz++) {
        if (Math.abs(gx) <= 1 && Math.abs(gz) <= 1) continue

        const blockCenterX = gx * ROAD_SPACING
        const blockCenterZ = gz * ROAD_SPACING
        const numBuildings = Math.floor(rng() * 3) + 1

        for (let b = 0; b < numBuildings; b++) {
          const typeIndex = rng()
          let type
          if (typeIndex < 0.4) type = 'residential'
          else if (typeIndex < 0.65) type = 'commercial'
          else if (typeIndex < 0.8) type = 'skyscraper'
          else if (typeIndex < 0.9) type = 'industrial'
          else type = 'modern'

          const config = getBuildingConfig(type, rng)
          const offsetX = (rng() - 0.5) * (BLOCK_SIZE - config.width)
          const offsetZ = (rng() - 0.5) * (BLOCK_SIZE - config.depth)

          buildings.push({
            position: [blockCenterX + offsetX, 0, blockCenterZ + offsetZ],
            type,
            config,
            id: buildings.length,
            seed: rng() * 10000,
          })
        }
      }
    }
    return buildings
  }, [])

  return (
    <group>
      {buildingData.map((bld, i) => (
        <BuildingWrapper key={i} data={bld} />
      ))}
    </group>
  )
}

function getBuildingConfig(type, rng) {
  switch (type) {
    case 'residential':
      return {
        width: 5 + rng() * 6, depth: 5 + rng() * 6,
        height: 8 + rng() * 15,
        color: ['#8b6e5a', '#9a7d6b', '#7a6050', '#a08070', '#6e5544'][Math.floor(rng() * 5)],
        hasBalconies: rng() > 0.4, hasStores: rng() > 0.6,
        windowLitChance: 0.5 + rng() * 0.3,
      }
    case 'commercial':
      return {
        width: 6 + rng() * 8, depth: 6 + rng() * 8,
        height: 6 + rng() * 12,
        color: ['#5a5a6a', '#4a4a5a', '#6a6a7a', '#505060'][Math.floor(rng() * 4)],
        hasBalconies: false, hasStores: true,
        windowLitChance: 0.6 + rng() * 0.3,
        neonColor: ['#ff4488', '#44ffaa', '#4488ff', '#ffaa44', '#ff44ff'][Math.floor(rng() * 5)],
        neonText: ['BAR', 'SHOP', 'CAFE', 'HOTEL', 'CLUB', 'PIZZA', '24H'][Math.floor(rng() * 7)],
      }
    case 'skyscraper':
      return {
        width: 6 + rng() * 6, depth: 6 + rng() * 6,
        height: 25 + rng() * 35,
        color: ['#5a6a7a', '#4a5a6a', '#6a7a8a', '#708090'][Math.floor(rng() * 4)],
        hasBalconies: false, hasStores: false,
        windowLitChance: 0.4 + rng() * 0.4,
        hasAntenna: rng() > 0.5,
      }
    case 'industrial':
      return {
        width: 8 + rng() * 10, depth: 8 + rng() * 10,
        height: 5 + rng() * 8,
        color: ['#5a5550', '#6a6560', '#4a4540', '#555050'][Math.floor(rng() * 4)],
        hasBalconies: false, hasStores: false,
        windowLitChance: 0.2 + rng() * 0.2,
      }
    case 'modern':
      return {
        width: 5 + rng() * 7, depth: 5 + rng() * 7,
        height: 10 + rng() * 20,
        color: ['#6a7a8a', '#5a6a7a', '#7a8a9a', '#4a5a6a'][Math.floor(rng() * 4)],
        hasBalconies: rng() > 0.5, hasStores: rng() > 0.5,
        windowLitChance: 0.5 + rng() * 0.3,
        setback: rng() > 0.5,
      }
    default:
      return { width: 6, depth: 6, height: 10, color: '#555565', hasBalconies: false, hasStores: false, windowLitChance: 0.5 }
  }
}

function BuildingWrapper({ data }) {
  const { position, type, config, seed } = data
  const rng = seededRandom(seed)
  const { width, depth, height, color, hasBalconies, hasStores, windowLitChance } = config

  return (
    <group position={position}>
      {/* Foundation */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <boxGeometry args={[width + 0.4, 0.3, depth + 0.4]} />
        <meshStandardMaterial color="#555555" roughness={0.9} />
      </mesh>

      {/* Main body */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={type === 'skyscraper' ? 0.5 : 0.2} />
      </mesh>

      {/* Windows */}
      <BuildingWindows width={width} height={height} depth={depth} windowLitChance={windowLitChance} rng={rng} type={type} />

      {/* Balconies */}
      {hasBalconies && <Balconies width={width} height={height} depth={depth} rng={rng} />}

      {/* Commercial storefront */}
      {hasStores && <Storefront width={width} depth={depth} rng={rng} config={config} />}

      {/* Roof details */}
      <RoofDetails width={width} height={height} depth={depth} type={type} config={config} rng={rng} />

      {/* Neon sign for commercial */}
      {type === 'commercial' && config.neonText && (
        <NeonSign width={width} depth={depth} height={height} config={config} />
      )}
    </group>
  )
}

function BuildingWindows({ width, height, depth, windowLitChance, rng, type }) {
  const windows = []
  const rows = Math.max(1, Math.floor(height / 3.5))
  const cols = Math.max(1, Math.floor(width / 2.5))
  const sideCols = Math.max(1, Math.floor(depth / 2.5))

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = ((col + 0.5) / cols - 0.5) * width * 0.85
      const y = -height / 2 + (row + 0.5) / rows * height * 0.9 + height * 0.05
      const isLit = rng() < windowLitChance
      const hasCurtain = rng() > 0.5

      // Front
      windows.push(
        <mesh key={`f${row}-${col}`} position={[x, y, depth / 2 + 0.02]}>
          <planeGeometry args={[1.2, 1.8]} />
          <meshStandardMaterial
            color={isLit ? '#ffdd88' : '#5577aa'}
            emissive={isLit ? '#ffdd44' : '#111122'}
            emissiveIntensity={isLit ? 0.4 : 0.05}
          />
        </mesh>
      )
      // Back
      windows.push(
        <mesh key={`b${row}-${col}`} position={[x, y, -depth / 2 - 0.02]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.2, 1.8]} />
          <meshStandardMaterial
            color={isLit ? '#ffdd88' : '#5577aa'}
            emissive={isLit ? '#ffdd44' : '#111122'}
            emissiveIntensity={isLit ? 0.4 : 0.05}
          />
        </mesh>
      )
    }

    // Side windows
    for (let col = 0; col < sideCols; col++) {
      const z = ((col + 0.5) / sideCols - 0.5) * depth * 0.85
      const y = -height / 2 + (row + 0.5) / rows * height * 0.9 + height * 0.05
      const isLit = rng() < windowLitChance

      windows.push(
        <mesh key={`l${row}-${col}`} position={[width / 2 + 0.02, y, z]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1.2, 1.8]} />
          <meshStandardMaterial
            color={isLit ? '#ffdd88' : '#5577aa'}
            emissive={isLit ? '#ffdd44' : '#111122'}
            emissiveIntensity={isLit ? 0.4 : 0.05}
          />
        </mesh>
      )
      windows.push(
        <mesh key={`r${row}-${col}`} position={[-width / 2 - 0.02, y, z]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[1.2, 1.8]} />
          <meshStandardMaterial
            color={isLit ? '#ffdd88' : '#5577aa'}
            emissive={isLit ? '#ffdd44' : '#111122'}
            emissiveIntensity={isLit ? 0.4 : 0.05}
          />
        </mesh>
      )
    }
  }
  return <group>{windows}</group>
}

function Balconies({ width, height, depth, rng }) {
  const balconies = []
  const rows = Math.floor(height / 5)

  for (let row = 0; row < rows; row++) {
    const y = -height / 2 + (row + 1) * 5
    const side = rng() > 0.5

    balconies.push(
      <group key={`b${row}`} position={[0, y, depth / 2 + 0.5]}>
        <mesh castShadow>
          <boxGeometry args={[width * 0.8, 0.15, 1.0]} />
          <meshStandardMaterial color="#555560" roughness={0.8} />
        </mesh>
        {/* Railing */}
        <mesh position={[0, 0.5, 0.45]}>
          <boxGeometry args={[width * 0.8, 0.8, 0.05]} />
          <meshStandardMaterial color="#444450" roughness={0.7} metalness={0.4} />
        </mesh>
      </group>
    )
  }
  return <group>{balconies}</group>
}

function Storefront({ width, depth, rng, config }) {
  return (
    <group>
      {/* Glass storefront */}
      <mesh position={[0, 1.5, depth / 2 + 0.02]}>
        <planeGeometry args={[width * 0.9, 3]} />
        <meshStandardMaterial color="#88aacc" roughness={0.1} metalness={0.3} transparent opacity={0.6} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 1.2, depth / 2 + 0.05]}>
        <planeGeometry args={[1.2, 2.4]} />
        <meshStandardMaterial color="#665544" roughness={0.4} />
      </mesh>
      {/* Awning */}
      <mesh position={[0, 3.1, depth / 2 + 0.8]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[width * 0.9, 0.08, 1.2]} />
        <meshStandardMaterial color="#cc3333" roughness={0.6} />
      </mesh>
    </group>
  )
}

function RoofDetails({ width, height, depth, type, config, rng }) {
  const details = []

  // Roof top box (AC units)
  if (type !== 'industrial') {
    const numUnits = 1 + Math.floor(rng() * 3)
    for (let i = 0; i < numUnits; i++) {
      const x = (rng() - 0.5) * width * 0.6
      const z = (rng() - 0.5) * depth * 0.6
      details.push(
        <mesh key={`ac${i}`} position={[x, height + 0.4, z]} castShadow>
          <boxGeometry args={[1.2, 0.8, 1.0]} />
          <meshStandardMaterial color="#888890" roughness={0.6} metalness={0.4} />
        </mesh>
      )
    }
  }

  // Skyscraper antenna
  if (type === 'skyscraper' && config.hasAntenna) {
    details.push(
      <mesh key="antenna" position={[0, height + 3, 0]}>
        <cylinderGeometry args={[0.05, 0.1, 6, 6]} />
        <meshStandardMaterial color="#aa4444" metalness={0.8} />
      </mesh>
    )
    // Blinking light
    details.push(
      <mesh key="blink" position={[0, height + 6.1, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={3} />
      </mesh>
    )
  }

  // Industrial smokestack
  if (type === 'industrial') {
    details.push(
      <mesh key="stack" position={[width * 0.3, height + 2, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.6, 4, 8]} />
        <meshStandardMaterial color="#777770" roughness={0.8} />
      </mesh>
    )
  }

  // Roof ledge
  details.push(
    <mesh key="ledge" position={[0, height + 0.1, 0]}>
      <boxGeometry args={[width + 0.2, 0.2, depth + 0.2]} />
      <meshStandardMaterial color="#555560" roughness={0.8} />
    </mesh>
  )

  return <group>{details}</group>
}

function NeonSign({ width, depth, height, config }) {
  const texture = useMemo(() => createNeonSignTexture(config.neonText, config.neonColor), [config.neonText, config.neonColor])

  return (
    <mesh position={[0, 3.5, depth / 2 + 0.15]}>
      <planeGeometry args={[3, 0.8]} />
      <meshStandardMaterial
        map={texture}
        emissive={config.neonColor}
        emissiveIntensity={2}
        transparent
      />
    </mesh>
  )
}

// =================== PHASE 2: ROADS 2.0 ===================

function Roads() {
  const asphaltTexture = useMemo(() => createAsphaltTexture(), [])
  const roads = []
  const gridSize = 7
  const roadLength = gridSize * 2 * ROAD_SPACING + BLOCK_SIZE

  for (let i = -gridSize; i <= gridSize; i++) {
    const pos = i * ROAD_SPACING - ROAD_WIDTH / 2

    // Horizontal road
    roads.push(
      <mesh key={`h${i}`} position={[0, 0.02, pos]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[roadLength, ROAD_WIDTH]} />
        <meshStandardMaterial map={asphaltTexture} roughness={0.95} />
      </mesh>
    )
    // Center line (dashed yellow)
    const dashes = []
    for (let d = -roadLength / 2; d < roadLength / 2; d += 6) {
      dashes.push(
        <mesh key={`hdl${i}_${d}`} position={[d, 0.03, pos]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3, 0.12]} />
          <meshStandardMaterial color="#ddaa00" emissive="#ddaa00" emissiveIntensity={0.15} />
        </mesh>
      )
    }
    roads.push(...dashes)

    // White lane markings
    roads.push(
      <mesh key={`hwl${i}`} position={[0, 0.03, pos - ROAD_WIDTH / 2 + 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roadLength, 0.15]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>
    )
    roads.push(
      <mesh key={`hwr${i}`} position={[0, 0.03, pos + ROAD_WIDTH / 2 - 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roadLength, 0.15]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>
    )

    // Vertical road
    roads.push(
      <mesh key={`v${i}`} position={[pos, 0.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} receiveShadow>
        <planeGeometry args={[roadLength, ROAD_WIDTH]} />
        <meshStandardMaterial map={asphaltTexture} roughness={0.95} />
      </mesh>
    )
    // Dashed center line
    const vdashes = []
    for (let d = -roadLength / 2; d < roadLength / 2; d += 6) {
      vdashes.push(
        <mesh key={`vdl${i}_${d}`} position={[pos, 0.03, d]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.12, 3]} />
          <meshStandardMaterial color="#ddaa00" emissive="#ddaa00" emissiveIntensity={0.15} />
        </mesh>
      )
    }
    roads.push(...vdashes)

    // White lane markings
    roads.push(
      <mesh key={`vwl${i}`} position={[pos - ROAD_WIDTH / 2 + 0.5, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.15, roadLength]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>
    )
    roads.push(
      <mesh key={`vwr${i}`} position={[pos + ROAD_WIDTH / 2 - 0.5, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.15, roadLength]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>
    )
  }

  return <group>{roads}</group>
}

function Crosswalks() {
  const crosswalks = []
  const gridSize = 6

  for (let i = -gridSize; i <= gridSize; i++) {
    for (let j = -gridSize; j <= gridSize; j++) {
      const x = i * ROAD_SPACING
      const z = j * ROAD_SPACING
      const roadHalf = ROAD_WIDTH / 2

      // Crosswalk at intersection - horizontal
      for (let s = 0; s < 6; s++) {
        crosswalks.push(
          <mesh key={`cw_h${i}_${j}_${s}`} position={[x + (s - 2.5) * 0.6, 0.04, z - roadHalf - ROAD_WIDTH / 2 + 1]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.4, 3]} />
            <meshStandardMaterial color="#dddddd" roughness={0.7} />
          </mesh>
        )
      }
      // Crosswalk at intersection - vertical
      for (let s = 0; s < 6; s++) {
        crosswalks.push(
          <mesh key={`cw_v${i}_${j}_${s}`} position={[x - roadHalf - ROAD_WIDTH / 2 + 1, 0.04, z + (s - 2.5) * 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3, 0.4]} />
            <meshStandardMaterial color="#dddddd" roughness={0.7} />
          </mesh>
        )
      }
    }
  }

  return <group>{crosswalks}</group>
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

function Sidewalks() {
  const concreteTexture = useMemo(() => createConcreteTexture(), [])
  const sidewalks = []
  const gridSize = 7

  for (let gx = -gridSize; gx <= gridSize; gx++) {
    for (let gz = -gridSize; gz <= gridSize; gz++) {
      const x = gx * ROAD_SPACING
      const z = gz * ROAD_SPACING

      // Main sidewalk
      sidewalks.push(
        <mesh key={`sw${gx}_${gz}`} position={[x, 0.15, z]} receiveShadow>
          <boxGeometry args={[BLOCK_SIZE + 2, 0.3, BLOCK_SIZE + 2]} />
          <meshStandardMaterial map={concreteTexture} roughness={0.85} color="#888888" />
        </mesh>
      )

      // Curbs (4 sides)
      const curbH = 0.15
      const curbW = 0.2
      const half = (BLOCK_SIZE + 2) / 2

      sidewalks.push(
        <mesh key={`c1${gx}_${gz}`} position={[x, curbH, z + half + curbW / 2]}>
          <boxGeometry args={[BLOCK_SIZE + 2, curbH * 2, curbW]} />
          <meshStandardMaterial color="#777775" roughness={0.9} />
        </mesh>
      )
      sidewalks.push(
        <mesh key={`c2${gx}_${gz}`} position={[x, curbH, z - half - curbW / 2]}>
          <boxGeometry args={[BLOCK_SIZE + 2, curbH * 2, curbW]} />
          <meshStandardMaterial color="#777775" roughness={0.9} />
        </mesh>
      )
      sidewalks.push(
        <mesh key={`c3${gx}_${gz}`} position={[x + half + curbW / 2, curbH, z]}>
          <boxGeometry args={[curbW, curbH * 2, BLOCK_SIZE + 2]} />
          <meshStandardMaterial color="#777775" roughness={0.9} />
        </mesh>
      )
      sidewalks.push(
        <mesh key={`c4${gx}_${gz}`} position={[x - half - curbW / 2, curbH, z]}>
          <boxGeometry args={[curbW, curbH * 2, BLOCK_SIZE + 2]} />
          <meshStandardMaterial color="#777775" roughness={0.9} />
        </mesh>
      )
    }
  }

  return <group>{sidewalks}</group>
}

// =================== PHASE 4: VEGETATION ===================

function GrassAreas() {
  const grassTexture = useMemo(() => createGrassTexture(), [])
  const patches = []
  const gridSize = 6

  for (let gx = -gridSize; gx <= gridSize; gx++) {
    for (let gz = -gridSize; gz <= gridSize; gz++) {
      const x = gx * ROAD_SPACING
      const z = gz * ROAD_SPACING

      patches.push(
        <mesh key={`g${gx}_${gz}`} position={[x, 0.31, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[BLOCK_SIZE - 2, BLOCK_SIZE - 2]} />
          <meshStandardMaterial map={grassTexture} roughness={0.9} color="#3a7a2a" />
        </mesh>
      )
    }
  }

  return <group>{patches}</group>
}

function Trees() {
  const treesData = useMemo(() => {
    const trees = []
    const rng = seededRandom(123)
    const gridSize = 6

    for (let gx = -gridSize; gx <= gridSize; gx++) {
      for (let gz = -gridSize; gz <= gridSize; gz++) {
        const bx = gx * ROAD_SPACING
        const bz = gz * ROAD_SPACING
        const half = (BLOCK_SIZE + 2) / 2

        // Trees along sidewalks (2-4 per block side)
        const numTrees = 1 + Math.floor(rng() * 3)
        for (let t = 0; t < numTrees; t++) {
          const along = (rng() - 0.5) * (BLOCK_SIZE - 4)
          const side = Math.floor(rng() * 4)
          let tx, tz
          switch (side) {
            case 0: tx = bx + along; tz = bz + half - 1; break
            case 1: tx = bx + along; tz = bz - half + 1; break
            case 2: tx = bx + half - 1; tz = bz + along; break
            default: tx = bx - half + 1; tz = bz + along; break
          }
          const scale = 0.7 + rng() * 0.6
          trees.push({ position: [tx, 0, tz], scale, id: trees.length })
        }
      }
    }
    return trees
  }, [])

  return (
    <group>
      {treesData.map((tree) => (
        <Tree key={tree.id} position={tree.position} scale={tree.scale} />
      ))}
    </group>
  )
}

function Tree({ position, scale }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.25, 3, 6]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
      </mesh>
      {/* Foliage layers */}
      <mesh position={[0, 3.5, 0]} castShadow>
        <coneGeometry args={[1.8, 2.5, 8]} />
        <meshStandardMaterial color="#2a6a1a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 4.5, 0]} castShadow>
        <coneGeometry args={[1.4, 2.0, 8]} />
        <meshStandardMaterial color="#337722" roughness={0.8} />
      </mesh>
      <mesh position={[0, 5.3, 0]} castShadow>
        <coneGeometry args={[0.9, 1.5, 8]} />
        <meshStandardMaterial color="#3a8a2a" roughness={0.8} />
      </mesh>
    </group>
  )
}

// =================== PHASE 5: URBAN PROPS ===================

function StreetLights() {
  const lights = []
  const gridSize = 6

  for (let i = -gridSize; i <= gridSize; i += 2) {
    const pos = i * ROAD_SPACING
    const offset = ROAD_WIDTH / 2 + 1.5

    lights.push(
      <group key={`lx${i}`} position={[pos, 0, -offset]}>
        <mesh position={[0, 3, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 6, 6]} />
          <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Lamp arm */}
        <mesh position={[0.4, 5.8, 0]} castShadow>
          <boxGeometry args={[1.0, 0.08, 0.08]} />
          <meshStandardMaterial color="#555555" metalness={0.8} />
        </mesh>
        {/* Lamp head */}
        <mesh position={[0.8, 5.7, 0]}>
          <boxGeometry args={[0.6, 0.15, 0.3]} />
          <meshStandardMaterial color="#ffcc77" emissive="#ffcc44" emissiveIntensity={2} />
        </mesh>
        <pointLight position={[0.8, 5.5, 0]} color="#ffcc77" intensity={20} distance={25} />
      </group>
    )

    lights.push(
      <group key={`lz${i}`} position={[-offset, 0, pos]}>
        <mesh position={[0, 3, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 6, 6]} />
          <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 5.8, 0.4]} castShadow>
          <boxGeometry args={[0.08, 0.08, 1.0]} />
          <meshStandardMaterial color="#555555" metalness={0.8} />
        </mesh>
        <mesh position={[0, 5.7, 0.8]}>
          <boxGeometry args={[0.3, 0.15, 0.6]} />
          <meshStandardMaterial color="#ffcc77" emissive="#ffcc44" emissiveIntensity={2} />
        </mesh>
        <pointLight position={[0, 5.5, 0.8]} color="#ffcc77" intensity={20} distance={25} />
      </group>
    )
  }

  return <group>{lights}</group>
}

function TrafficLights() {
  const lightsData = useMemo(() => {
    const items = []
    const gridSize = 6
    for (let i = -gridSize; i <= gridSize; i += 2) {
      for (let j = -gridSize; j <= gridSize; j += 2) {
        const x = i * ROAD_SPACING
        const z = j * ROAD_SPACING
        const offset = ROAD_WIDTH / 2 + 0.5
        // 4 corners
        items.push({ position: [x + offset, 0, z + offset], seed: items.length })
        items.push({ position: [x - offset, 0, z - offset], seed: items.length })
      }
    }
    return items
  }, [])

  return (
    <group>
      {lightsData.map((tl, i) => (
        <TrafficLightUnit key={i} position={tl.position} seed={tl.seed} />
      ))}
    </group>
  )
}

function TrafficLightUnit({ position, seed }) {
  const meshRef = useRef()
  const phase = useRef((seed * 137.5) % 20)

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime() + phase.current
    const cycle = t % 10
    // 0-4: green, 4-5: yellow, 5-9: red
    const children = meshRef.current.children
    if (children.length < 3) return

    const redMat = children[0].material
    const yellowMat = children[1].material
    const greenMat = children[2].material

    redMat.emissiveIntensity = cycle > 5 ? 3 : 0
    yellowMat.emissiveIntensity = (cycle > 4 && cycle <= 5) ? 3 : 0
    greenMat.emissiveIntensity = cycle <= 4 ? 3 : 0
  })

  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 5, 6]} />
        <meshStandardMaterial color="#333333" metalness={0.7} />
      </mesh>
      {/* Light housing */}
      <mesh position={[0, 4.8, 0]} castShadow>
        <boxGeometry args={[0.35, 1.2, 0.35]} />
        <meshStandardMaterial color="#222228" roughness={0.5} />
      </mesh>
      {/* Lights */}
      <group ref={meshRef}>
        <mesh position={[0, 5.15, 0.18]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={3} />
        </mesh>
        <mesh position={[0, 4.8, 0.18]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={0} />
        </mesh>
        <mesh position={[0, 4.45, 0.18]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0} />
        </mesh>
      </group>
    </group>
  )
}

function StreetFurniture() {
  const items = useMemo(() => {
    const result = []
    const rng = seededRandom(789)
    const gridSize = 5

    for (let i = -gridSize; i <= gridSize; i += 2) {
      for (let j = -gridSize; j <= gridSize; j += 2) {
        const bx = i * ROAD_SPACING
        const bz = j * ROAD_SPACING
        const half = (BLOCK_SIZE + 2) / 2

        // Bench
        if (rng() > 0.5) {
          result.push({ type: 'bench', position: [bx + (rng() - 0.5) * 8, 0.31, bz + half - 2], rotation: rng() * Math.PI })
        }
        // Trash can
        if (rng() > 0.4) {
          result.push({ type: 'trash', position: [bx + (rng() - 0.5) * 10, 0.31, bz + half - 1.5] })
        }
        // Fire hydrant
        if (rng() > 0.7) {
          result.push({ type: 'hydrant', position: [bx + half - 1, 0.31, bz + (rng() - 0.5) * 10] })
        }
      }
    }
    return result
  }, [])

  return (
    <group>
      {items.map((item, i) => {
        switch (item.type) {
          case 'bench':
            return <Bench key={i} position={item.position} rotation={item.rotation} />
          case 'trash':
            return <TrashCan key={i} position={item.position} />
          case 'hydrant':
            return <FireHydrant key={i} position={item.position} />
          default:
            return null
        }
      })}
    </group>
  )
}

function Bench({ position, rotation }) {
  return (
    <group position={position} rotation={[0, rotation || 0, 0]}>
      {/* Seat */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1.5, 0.08, 0.5]} />
        <meshStandardMaterial color="#6b4226" roughness={0.8} />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0.7, -0.22]} castShadow>
        <boxGeometry args={[1.5, 0.5, 0.06]} />
        <meshStandardMaterial color="#6b4226" roughness={0.8} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.6, 0.22, 0]} castShadow>
        <boxGeometry args={[0.08, 0.44, 0.4]} />
        <meshStandardMaterial color="#444444" metalness={0.6} />
      </mesh>
      <mesh position={[0.6, 0.22, 0]} castShadow>
        <boxGeometry args={[0.08, 0.44, 0.4]} />
        <meshStandardMaterial color="#444444" metalness={0.6} />
      </mesh>
    </group>
  )
}

function TrashCan({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.25, 0.9, 8]} />
        <meshStandardMaterial color="#4a6a4a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.92, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.04, 8]} />
        <meshStandardMaterial color="#3a5a3a" roughness={0.6} />
      </mesh>
    </group>
  )
}

function FireHydrant({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.15, 0.7, 8]} />
        <meshStandardMaterial color="#cc2222" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.14, 8, 8]} />
        <meshStandardMaterial color="#cc2222" roughness={0.5} />
      </mesh>
      {/* Side nozzle */}
      <mesh position={[0.15, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.15, 6]} />
        <meshStandardMaterial color="#cc2222" roughness={0.5} />
      </mesh>
    </group>
  )
}

function StreetSigns() {
  const signs = useMemo(() => {
    const result = []
    const rng = seededRandom(456)
    const gridSize = 5

    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        if (rng() > 0.4) continue
        const x = i * ROAD_SPACING
        const z = j * ROAD_SPACING
        const offset = ROAD_WIDTH / 2 + 1
        const signType = ['stop', 'speed', 'oneway'][Math.floor(rng() * 3)]
        result.push({ position: [x + offset, 0, z + offset], type: signType })
      }
    }
    return result
  }, [])

  return (
    <group>
      {signs.map((sign, i) => (
        <Sign key={i} position={sign.position} type={sign.type} />
      ))}
    </group>
  )
}

function Sign({ position, type }) {
  const texture = useMemo(() => {
    switch (type) {
      case 'stop': return createSignTexture('STOP', '#cc2222', '#ffffff')
      case 'speed': return createSignTexture('50', '#ffffff', '#222222')
      case 'oneway': return createSignTexture('→', '#222222', '#ffffff', 128, 64)
      default: return createSignTexture('STOP', '#cc2222', '#ffffff')
    }
  }, [type])

  const size = type === 'oneway' ? [0.8, 0.4] : [0.6, 0.6]

  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 3, 6]} />
        <meshStandardMaterial color="#777777" metalness={0.6} />
      </mesh>
      {/* Sign face */}
      <mesh position={[0, 2.8, 0.02]}>
        <planeGeometry args={size} />
        <meshStandardMaterial map={texture} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
