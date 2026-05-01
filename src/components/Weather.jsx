import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const RAIN_COUNT = 3000
const RAIN_AREA = 60
const LIGHTNING_MIN_INTERVAL = 10
const LIGHTNING_MAX_INTERVAL = 30

export default function Weather() {
  return (
    <group>
      <Rain />
      <Lightning />
    </group>
  )
}

function Rain() {
  const meshRef = useRef()
  const playerPos = useRef([0, 0, 0])

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(RAIN_COUNT * 3)
    const velocities = new Float32Array(RAIN_COUNT)

    for (let i = 0; i < RAIN_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * RAIN_AREA
      positions[i * 3 + 1] = Math.random() * 40
      positions[i * 3 + 2] = (Math.random() - 0.5) * RAIN_AREA
      velocities[i] = 15 + Math.random() * 10
    }
    return { positions, velocities }
  }, [])

  useFrame((state, delta) => {
    if (!meshRef.current) return

    const posAttr = meshRef.current.geometry.attributes.position
    const posArray = posAttr.array

    for (let i = 0; i < RAIN_COUNT; i++) {
      posArray[i * 3 + 1] -= velocities[i] * delta

      // Reset raindrop if below ground
      if (posArray[i * 3 + 1] < 0) {
        posArray[i * 3] = (Math.random() - 0.5) * RAIN_AREA
        posArray[i * 3 + 1] = 30 + Math.random() * 10
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
        size={0.08}
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

function Lightning() {
  const lightRef = useRef()
  const nextFlash = useRef(Math.random() * LIGHTNING_MAX_INTERVAL + LIGHTNING_MIN_INTERVAL)
  const flashDuration = useRef(0)
  const isFlashing = useRef(false)

  useFrame((state, delta) => {
    if (!lightRef.current) return

    const time = state.clock.getElapsedTime()

    if (!isFlashing.current && time > nextFlash.current) {
      isFlashing.current = true
      flashDuration.current = 0.1 + Math.random() * 0.15
      lightRef.current.intensity = 3 + Math.random() * 5
      lightRef.current.position.set(
        (Math.random() - 0.5) * 100,
        50,
        (Math.random() - 0.5) * 100
      )
      nextFlash.current = time + LIGHTNING_MIN_INTERVAL + Math.random() * (LIGHTNING_MAX_INTERVAL - LIGHTNING_MIN_INTERVAL)
    }

    if (isFlashing.current) {
      flashDuration.current -= delta
      if (flashDuration.current <= 0) {
        isFlashing.current = false
        lightRef.current.intensity = 0
      } else {
        // Flicker effect
        lightRef.current.intensity *= (Math.random() > 0.5 ? 1.2 : 0.6)
      }
    }
  })

  return (
    <pointLight
      ref={lightRef}
      color="#ddeeff"
      intensity={0}
      distance={300}
      decay={1}
    />
  )
}
