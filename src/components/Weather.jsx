import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const RAIN_COUNT = 6000
const RAIN_AREA = 80
const LIGHTNING_MIN_INTERVAL = 8
const LIGHTNING_MAX_INTERVAL = 25

export default function Weather() {
  return (
    <group>
      <Rain />
      <Lightning />
      <Mist />
    </group>
  )
}

function Rain() {
  const meshRef = useRef()
  const playerPos = useRef([0, 0, 0])

  const { positions, velocities, opacities } = useMemo(() => {
    const positions = new Float32Array(RAIN_COUNT * 3)
    const velocities = new Float32Array(RAIN_COUNT)
    const opacities = new Float32Array(RAIN_COUNT)

    for (let i = 0; i < RAIN_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * RAIN_AREA
      positions[i * 3 + 1] = Math.random() * 50
      positions[i * 3 + 2] = (Math.random() - 0.5) * RAIN_AREA
      velocities[i] = 18 + Math.random() * 14
      opacities[i] = 0.15 + Math.random() * 0.45
    }
    return { positions, velocities, opacities }
  }, [])

  useFrame((state, delta) => {
    if (!meshRef.current) return

    const posAttr = meshRef.current.geometry.attributes.position
    const posArray = posAttr.array

    for (let i = 0; i < RAIN_COUNT; i++) {
      posArray[i * 3 + 1] -= velocities[i] * delta
      // Wind effect
      posArray[i * 3] += delta * 1.5

      if (posArray[i * 3 + 1] < 0) {
        posArray[i * 3] = (Math.random() - 0.5) * RAIN_AREA
        posArray[i * 3 + 1] = 35 + Math.random() * 15
        posArray[i * 3 + 2] = (Math.random() - 0.5) * RAIN_AREA
      }
    }
    posAttr.needsUpdate = true
  })

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [positions])

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        color="#aaccff"
        size={0.12}
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function Mist() {
  const ref = useRef()
  const startTime = useRef(0)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.getElapsedTime()
    ref.current.position.x = Math.sin(t * 0.1) * 10
    ref.current.position.z = Math.cos(t * 0.08) * 10
    ref.current.material.opacity = 0.08 + Math.sin(t * 0.3) * 0.03
  })

  return (
    <mesh ref={ref} position={[0, 3, 0]}>
      <sphereGeometry args={[60, 16, 16]} />
      <meshBasicMaterial
        color="#8899aa"
        transparent
        opacity={0.08}
        depthWrite={false}
        side={THREE.BackSide}
        fog
      />
    </mesh>
  )
}

function Lightning() {
  const lightRef = useRef()
  const nextFlash = useRef(Math.random() * LIGHTNING_MAX_INTERVAL + LIGHTNING_MIN_INTERVAL)
  const flashDuration = useRef(0)
  const isFlashing = useRef(false)
  const flashPhase = useRef(0)

  useFrame((state, delta) => {
    if (!lightRef.current) return

    const time = state.clock.getElapsedTime()

    if (!isFlashing.current && time > nextFlash.current) {
      isFlashing.current = true
      flashPhase.current = 0
      flashDuration.current = 0.08 + Math.random() * 0.2
      lightRef.current.intensity = 5 + Math.random() * 10
      lightRef.current.position.set(
        (Math.random() - 0.5) * 120,
        60,
        (Math.random() - 0.5) * 120
      )
      nextFlash.current = time + LIGHTNING_MIN_INTERVAL + Math.random() * (LIGHTNING_MAX_INTERVAL - LIGHTNING_MIN_INTERVAL)
    }

    if (isFlashing.current) {
      flashPhase.current += delta
      if (flashPhase.current > flashDuration.current) {
        isFlashing.current = false
        lightRef.current.intensity = 0
      } else {
        // Cinematic multi-flash pattern
        const t = flashPhase.current / flashDuration.current
        const flicker = Math.sin(t * Math.PI * 8) * Math.cos(t * Math.PI * 3)
        lightRef.current.intensity = Math.max(0, flicker * 12)
      }
    }
  })

  return (
    <pointLight
      ref={lightRef}
      color="#ddeeff"
      intensity={0}
      distance={400}
      decay={1}
    />
  )
}
