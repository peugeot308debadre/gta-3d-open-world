import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { createGrassTexture } from '../utils/proceduralTextures'
import { BLOCK_SIZE } from './City'

function seededRandom(seed) {
  let s = seed
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646 }
}

// ==================== HILLS & TERRAIN ====================

function TerrainHills() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(600, 600, 120, 120)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getY(i)
      // Multi-octave noise approximation
      let h = 0
      h += Math.sin(x * 0.008 + 1.3) * Math.cos(z * 0.008 + 0.7) * 12
      h += Math.sin(x * 0.02 + 2.1) * Math.cos(z * 0.02 + 1.4) * 4
      h += Math.sin(x * 0.05 + 0.3) * Math.cos(z * 0.05 + 3.2) * 1.5
      // Flatten the center city area (radius ~120)
      const dist = Math.sqrt(x * x + z * z)
      const flatten = Math.max(0, 1 - dist / 120)
      h *= (1 - flatten * 0.95)
      // Negative = water areas at edges
      if (dist > 200 && h < 0) h = h * 2
      pos.setZ(i, h)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  const texture = useMemo(() => {
    const t = createGrassTexture()
    t.repeat.set(60, 60)
    return t
  }, [])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]} receiveShadow>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial map={texture} color="#4a8a30" roughness={0.95} metalness={0} />
    </mesh>
  )
}

// ==================== WATER BODY ====================

function WaterBody() {
  const ref = useRef()

  useFrame((state) => {
    if (ref.current) {
      ref.current.material.uniforms.uTime.value = state.clock.getElapsedTime()
    }
  })

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color('#1a4a6a') },
        uColor2: { value: new THREE.Color('#2a7aaa') },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        uniform float uTime;
        void main() {
          vUv = uv;
          vec3 pos = position;
          pos.z += sin(pos.x * 0.3 + uTime * 1.5) * 0.3 + cos(pos.y * 0.2 + uTime) * 0.2;
          vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        void main() {
          float wave = sin(vWorldPos.x * 0.5 + uTime * 2.0) * cos(vWorldPos.z * 0.3 + uTime * 1.5);
          float spec = pow(max(wave, 0.0), 4.0) * 0.6;
          vec3 col = mix(uColor1, uColor2, vUv.y * 0.5 + 0.25 + wave * 0.1);
          col += spec * vec3(1.0, 0.95, 0.85);
          // Fresnel-like edge glow
          float edge = smoothstep(0.0, 0.05, vUv.x) * smoothstep(1.0, 0.95, vUv.x)
                     * smoothstep(0.0, 0.05, vUv.y) * smoothstep(1.0, 0.95, vUv.y);
          gl_FragColor = vec4(col, 0.75 * edge);
        }
      `,
    })
  }, [])

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[-180, -1.5, -160]} material={material}>
      <planeGeometry args={[80, 60, 32, 32]} />
    </mesh>
  )
}

// ==================== DENSE VEGETATION ====================

function DenseVegetation() {
  const data = useMemo(() => {
    const items = []
    const rng = seededRandom(999)
    const gridSize = 6

    // Dense tree line along outer edges
    for (let i = -gridSize; i <= gridSize; i++) {
      for (let side = -1; side <= 1; side += 2) {
        // Trees along road edges
        const numTrees = 2 + Math.floor(rng() * 3)
        for (let t = 0; t < numTrees; t++) {
          const along = (rng() - 0.5) * BLOCK_SIZE * 0.8
          const bx = i * 26
          const bz = side * (gridSize + 1) * 26 + rng() * 20 - 10
          const scale = 0.8 + rng() * 0.8
          const treeType = Math.floor(rng() * 3)
          items.push({ pos: [bx + along, 0, bz], scale, type: treeType, id: items.length })
        }
        items.push({ pos: [side * (gridSize + 1) * 26 + rng() * 20 - 10, 0, i * 26 + (rng() - 0.5) * BLOCK_SIZE], scale: 0.8 + rng() * 0.8, type: Math.floor(rng() * 3), id: items.length })
      }
    }

    // Hedge rows along some sidewalks
    for (let i = -gridSize; i <= gridSize; i += 2) {
      for (let j = -gridSize; j <= gridSize; j++) {
        if (rng() > 0.5) continue
        const bx = i * 26
        const bz = j * 26
        const half = (BLOCK_SIZE + 2) / 2
        // Hedge along one side
        const hedgeLen = 3 + rng() * 8
        items.push({ pos: [bx + (rng() - 0.5) * BLOCK_SIZE * 0.5, 0.31, bz + half - 0.5], scale: 1, type: 'hedge', hedgeLen, id: items.length })
      }
    }

    // Flower patches
    for (let p = 0; p < 30; p++) {
      const gx = Math.floor(rng() * 13) - 6
      const gz = Math.floor(rng() * 13) - 6
      const bx = gx * 26
      const bz = gz * 26
      items.push({ pos: [bx + (rng() - 0.5) * BLOCK_SIZE, 0.31, bz + (rng() - 0.5) * BLOCK_SIZE], scale: 1, type: 'flowers', id: items.length })
    }

    return items
  }, [])

  return (
    <group>
      {data.map((item) => {
        if (item.type === 'hedge') return <Hedge key={item.id} position={item.pos} length={item.hedgeLen} />
        if (item.type === 'flowers') return <FlowerPatch key={item.id} position={item.pos} />
        return <DenseTree key={item.id} position={item.pos} scale={item.scale} treeType={item.type} />
      })}
    </group>
  )
}

function DenseTree({ position, scale, treeType }) {
  const trunkColor = ['#5a3a1a', '#4a3015', '#3a2510'][treeType]
  const leafColor = ['#1a6a1a', '#2a7a22', '#1a5a2a'][treeType]
  const leafColor2 = ['#228822', '#2a9928', '#1a7720'][treeType]

  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.22, 4, 8]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} />
      </mesh>
      {/* Lower foliage - wider */}
      <mesh position={[0, 4.5, 0]} castShadow>
        <sphereGeometry args={[2.2, 10, 8]} />
        <meshStandardMaterial color={leafColor} roughness={0.85} />
      </mesh>
      {/* Upper foliage */}
      <mesh position={[0, 6, 0]} castShadow>
        <sphereGeometry args={[1.6, 8, 8]} />
        <meshStandardMaterial color={leafColor2} roughness={0.85} />
      </mesh>
      {/* Top */}
      <mesh position={[0, 7.2, 0]} castShadow>
        <sphereGeometry args={[0.9, 8, 6]} />
        <meshStandardMaterial color={leafColor} roughness={0.85} />
      </mesh>
    </group>
  )
}

function Hedge({ position, length }) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={[length, 0.6, 0.4]} />
      <meshStandardMaterial color="#2a6a1a" roughness={0.9} />
    </mesh>
  )
}

function FlowerPatch({ position }) {
  const flowers = useMemo(() => {
    const f = []
    for (let i = 0; i < 8; i++) {
      f.push({
        offset: [(Math.random() - 0.5) * 2, Math.random() * 0.3, (Math.random() - 0.5) * 2],
        color: ['#ff4466', '#ffaa22', '#ff66aa', '#aa44ff', '#ffdd44', '#44aaff'][Math.floor(Math.random() * 6)],
      })
    }
    return f
  }, [])

  return (
    <group position={position}>
      {flowers.map((f, i) => (
        <mesh key={i} position={f.offset}>
          <sphereGeometry args={[0.08, 6, 6]} />
          <meshStandardMaterial color={f.color} emissive={f.color} emissiveIntensity={0.15} />
        </mesh>
      ))}
      {/* Stem leaves */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[2, 0.1, 2]} />
        <meshStandardMaterial color="#2a7a1a" roughness={0.9} />
      </mesh>
    </group>
  )
}

// ==================== AMBIENT PARTICLES ====================

function AmbientParticles() {
  return (
    <group>
      <Sparkles count={200} scale={[200, 30, 200]} size={0.8} speed={0.3} opacity={0.3} color="#ffffcc" />
    </group>
  )
}

// ==================== ROAD DETAILS ====================

function RoadDetails() {
  const details = useMemo(() => {
    const items = []
    const gridSize = 6
    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        const cx = i * 26
        const cz = j * 26
        // Manholes near intersections
        if ((i + j) % 2 === 0) {
          items.push({ type: 'manhole', pos: [cx + 10 + (i % 3), 0.04, cz + 3 + (j % 3)] })
        }
        // Drain grates
        if ((i * 3 + j) % 3 === 0) {
          items.push({ type: 'drain', pos: [cx - 10, 0.04, cz - 2] })
        }
      }
    }
    return items
  }, [])

  return (
    <group>
      {details.map((d, i) => {
        if (d.type === 'manhole') return <Manhole key={i} position={d.pos} />
        return <DrainGrate key={i} position={d.pos} />
      })}
    </group>
  )
}

function Manhole({ position }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.45, 16]} />
      <meshStandardMaterial color="#3a3a3a" roughness={0.6} metalness={0.7} />
    </mesh>
  )
}

function DrainGrate({ position }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.6, 0.3]} />
      <meshStandardMaterial color="#222222" roughness={0.4} metalness={0.8} />
    </mesh>
  )
}

// ==================== STEAM VENTS ====================

function SteamVents() {
  const vents = useMemo(() => {
    const items = []
    const rng = seededRandom(777)
    const gridSize = 5
    for (let i = -gridSize; i <= gridSize; i += 2) {
      for (let j = -gridSize; j <= gridSize; j += 2) {
        if (rng() > 0.3) continue
        items.push({ pos: [i * 26 + (rng() - 0.5) * 8, 0, j * 26 + (rng() - 0.5) * 8] })
      }
    }
    return items
  }, [])

  return (
    <group>
      {vents.map((v, i) => (
        <SteamColumn key={i} position={v.pos} />
      ))}
    </group>
  )
}

function SteamColumn({ position }) {
  const ref = useRef()
  const speed = useRef(0.5 + Math.random() * 0.5)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.getElapsedTime() * speed.current
    ref.current.position.y = 1 + Math.sin(t) * 0.5 + (t % 3)
    ref.current.material.opacity = Math.max(0, 0.4 - (t % 3) * 0.13)
  })

  return (
    <group position={position}>
      {/* Vent pipe */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 0.6, 8]} />
        <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Steam puff */}
      <mesh ref={ref} position={[0, 1, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="#cccccc" transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

// ==================== POWER LINES ====================

function PowerLines() {
  const lines = useMemo(() => {
    const items = []
    const gridSize = 5
    for (let i = -gridSize; i <= gridSize; i += 3) {
      // Lines along X
      items.push({ start: [i * 26 - 30, 7, -5], end: [i * 26 + 30, 7, -5] })
      // Lines along Z
      items.push({ start: [-5, 7, i * 26 - 30], end: [-5, 7, i * 26 + 30] })
    }
    return items
  }, [])

  return (
    <group>
      {lines.map((l, i) => {
        const midX = (l.start[0] + l.end[0]) / 2
        const midZ = (l.start[2] + l.end[2]) / 2
        return (
          <group key={i}>
            {/* Poles */}
            <mesh position={[l.start[0], 3.5, l.start[2]]}>
              <cylinderGeometry args={[0.06, 0.08, 7, 6]} />
              <meshStandardMaterial color="#777" metalness={0.6} />
            </mesh>
            <mesh position={[l.end[0], 3.5, l.end[2]]}>
              <cylinderGeometry args={[0.06, 0.08, 7, 6]} />
              <meshStandardMaterial color="#777" metalness={0.6} />
            </mesh>
            {/* Cross arm */}
            <mesh position={[l.start[0], 7, l.start[2]]}>
              <boxGeometry args={[1.5, 0.06, 0.06]} />
              <meshStandardMaterial color="#555" />
            </mesh>
            <mesh position={[l.end[0], 7, l.end[2]]}>
              <boxGeometry args={[1.5, 0.06, 0.06]} />
              <meshStandardMaterial color="#555" />
            </mesh>
            {/* Wire (catenary curve) */}
            <mesh position={[midX, 6.5, midZ]}>
              <cylinderGeometry args={[0.01, 0.01, Math.sqrt((l.end[0] - l.start[0]) ** 2 + (l.end[2] - l.start[2]) ** 2), 4]} />
              <meshStandardMaterial color="#333" />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

// ==================== EXPORT ALL ====================

export default function MaxGraphics() {
  return (
    <group>
      <TerrainHills />
      <WaterBody />
      <DenseVegetation />
      <AmbientParticles />
      <RoadDetails />
      <SteamVents />
      <PowerLines />
    </group>
  )
}
