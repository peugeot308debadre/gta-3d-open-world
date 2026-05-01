import React, { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Sky, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import useGameStore from '../hooks/useGameStore'

const DAY_CYCLE_DURATION = 120

export default function DayNightCycle() {
  const lightRef = useRef()
  const ambientRef = useRef()
  const hemisphereRef = useRef()
  const fogRef = useRef()
  const setTimeOfDay = useGameStore((s) => s.setTimeOfDay)

  const sunPosition = useRef([100, 80, 30])

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime()
    const timeOfDay = (elapsed / DAY_CYCLE_DURATION) % 1
    setTimeOfDay(timeOfDay)

    const sunAngle = timeOfDay * Math.PI * 2 - Math.PI / 2
    const sunHeight = Math.sin(sunAngle)
    const sunHorizontal = Math.cos(sunAngle)

    const sx = sunHorizontal * 200
    const sy = Math.max(sunHeight * 200, -50)
    const sz = 60
    sunPosition.current = [sx, sy, sz]

    if (lightRef.current) {
      lightRef.current.position.set(sx, sy, sz)
      // Much brighter sun: min 1.5 at horizon, up to 6 at noon
      const dayIntensity = Math.max(0, sunHeight)
      lightRef.current.intensity = dayIntensity * 6

      const sunColor = new THREE.Color()
      if (sunHeight > 0.3) {
        sunColor.setHex(0xffffff)
      } else if (sunHeight > 0) {
        sunColor.setRGB(1, 0.85 + sunHeight * 0.5, 0.6 + sunHeight)
      } else {
        sunColor.setRGB(0.2, 0.2, 0.4)
      }
      lightRef.current.color = sunColor
    }

    // Much brighter ambient: 0.4 at night, 1.2 at day
    if (ambientRef.current) {
      const nightAmbient = 0.35
      const dayAmbient = 1.2
      ambientRef.current.intensity = nightAmbient + (dayAmbient - nightAmbient) * Math.max(0, sunHeight)
    }

    // Brighter hemisphere
    if (hemisphereRef.current) {
      const isDay = sunHeight > 0
      hemisphereRef.current.color.setHex(isDay ? 0xaabbdd : 0x223355)
      hemisphereRef.current.groundColor.setHex(isDay ? 0x888866 : 0x222222)
      hemisphereRef.current.intensity = isDay ? 1.0 : 0.4
    }

    // Dynamic fog - pushed further, brighter
    if (fogRef.current) {
      const fogColor = new THREE.Color()
      if (sunHeight > 0.3) {
        fogColor.setRGB(0.8, 0.85, 0.95)
      } else if (sunHeight > 0.1) {
        const t = (sunHeight - 0.1) / 0.2
        fogColor.setRGB(0.9 - t * 0.1, 0.7 + t * 0.15, 0.5 + t * 0.45)
      } else if (sunHeight > -0.1) {
        const t = (sunHeight + 0.1) / 0.2
        fogColor.setRGB(0.3 + t * 0.6, 0.3 + t * 0.4, 0.35 + t * 0.15)
      } else {
        fogColor.setRGB(0.15, 0.15, 0.25)
      }
      fogRef.current.color.copy(fogColor)
    }
  })

  const timeOfDay = useGameStore((s) => s.timeOfDay)

  return (
    <>
      {/* Physical sky */}
      <Sky
        sunPosition={sunPosition.current}
        turbidity={6}
        rayleigh={1.5}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      {/* Stars */}
      <Sparkles
        count={2000}
        scale={[300, 200, 300]}
        size={1.5}
        speed={0.1}
        opacity={0.8}
        color="#ffffff"
      />

      {/* Sun - much brighter */}
      <directionalLight
        ref={lightRef}
        position={[50, 80, 30]}
        intensity={4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />

      {/* Bright ambient */}
      <ambientLight ref={ambientRef} intensity={0.6} color="#ffffff" />

      {/* Strong hemisphere */}
      <hemisphereLight ref={hemisphereRef} args={['#aabbdd', '#888866', 0.8]} />

      {/* Fog pushed much further */}
      <fog ref={fogRef} attach="fog" args={['#ccddee', 120, 500]} />
    </>
  )
}
