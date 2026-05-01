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
      const dayIntensity = Math.max(0, sunHeight)
      lightRef.current.intensity = dayIntensity * 2.5

      const sunColor = new THREE.Color()
      if (sunHeight > 0.3) {
        sunColor.setHex(0xffffff)
      } else if (sunHeight > 0) {
        sunColor.setRGB(1, 0.7 + sunHeight, 0.4 + sunHeight)
      } else {
        sunColor.setHex(0x111133)
      }
      lightRef.current.color = sunColor
    }

    if (ambientRef.current) {
      const nightAmbient = 0.08
      const dayAmbient = 0.45
      ambientRef.current.intensity = nightAmbient + (dayAmbient - nightAmbient) * Math.max(0, sunHeight)
    }

    if (hemisphereRef.current) {
      const isDay = sunHeight > 0
      hemisphereRef.current.color.setHex(isDay ? 0x8888cc : 0x111133)
      hemisphereRef.current.groundColor.setHex(isDay ? 0x444422 : 0x111111)
    }

    // Dynamic fog color based on time of day
    if (fogRef.current) {
      const fogColor = new THREE.Color()
      if (sunHeight > 0.3) {
        fogColor.setRGB(0.65, 0.72, 0.85) // Light blue-gray day
      } else if (sunHeight > 0.1) {
        const t = (sunHeight - 0.1) / 0.2
        fogColor.setRGB(0.85 - t * 0.2, 0.55 + t * 0.17, 0.4 + t * 0.45) // Orange sunset
      } else if (sunHeight > -0.1) {
        const t = (sunHeight + 0.1) / 0.2
        fogColor.setRGB(0.15 + t * 0.7, 0.15 + t * 0.4, 0.25 + t * 0.15) // Twilight
      } else {
        fogColor.setRGB(0.06, 0.06, 0.12) // Dark night
      }
      fogRef.current.color.copy(fogColor)
    }
  })

  // Stars visibility based on time - only show at night
  const timeOfDay = useGameStore((s) => s.timeOfDay)

  return (
    <>
      {/* Physical sky with atmospheric scattering */}
      <Sky
        sunPosition={sunPosition.current}
        turbidity={8}
        rayleigh={2}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      {/* Stars at night */}
      <Sparkles
        count={2000}
        scale={[300, 200, 300]}
        size={1.5}
        speed={0.1}
        opacity={0.8}
        color="#ffffff"
      />

      {/* Main directional light (sun/moon) */}
      <directionalLight
        ref={lightRef}
        position={[50, 80, 30]}
        intensity={2}
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

      {/* Ambient light */}
      <ambientLight ref={ambientRef} intensity={0.3} color="#ffffff" />

      {/* Hemisphere light */}
      <hemisphereLight ref={hemisphereRef} args={['#8888cc', '#444422', 0.4]} />

      {/* Dynamic fog */}
      <fog ref={fogRef} attach="fog" args={['#aabbcc', 60, 280]} />
    </>
  )
}
