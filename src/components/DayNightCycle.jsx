import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useGameStore from '../hooks/useGameStore'

const DAY_CYCLE_DURATION = 120 // seconds for full day/night cycle

export default function DayNightCycle() {
  const lightRef = useRef()
  const ambientRef = useRef()
  const hemisphereRef = useRef()
  const setTimeOfDay = useGameStore((s) => s.setTimeOfDay)

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime()
    const timeOfDay = (elapsed / DAY_CYCLE_DURATION) % 1
    setTimeOfDay(timeOfDay)

    // Sun angle (0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset)
    const sunAngle = timeOfDay * Math.PI * 2 - Math.PI / 2
    const sunHeight = Math.sin(sunAngle)
    const sunHorizontal = Math.cos(sunAngle)

    if (lightRef.current) {
      lightRef.current.position.set(
        sunHorizontal * 80,
        Math.max(sunHeight * 80, -10),
        30
      )

      // Adjust light intensity based on time of day
      const dayIntensity = Math.max(0, sunHeight)
      lightRef.current.intensity = dayIntensity * 2.5

      // Sun color changes throughout the day
      const sunColor = new THREE.Color()
      if (sunHeight > 0.3) {
        sunColor.setHex(0xffffff) // Bright white at noon
      } else if (sunHeight > 0) {
        sunColor.setRGB(1, 0.7 + sunHeight, 0.4 + sunHeight) // Orange at sunrise/sunset
      } else {
        sunColor.setHex(0x111133) // Dark blue at night
      }
      lightRef.current.color = sunColor
    }

    // Ambient light
    if (ambientRef.current) {
      const nightAmbient = 0.1
      const dayAmbient = 0.5
      const ambientIntensity = nightAmbient + (dayAmbient - nightAmbient) * Math.max(0, sunHeight)
      ambientRef.current.intensity = ambientIntensity
    }

    // Hemisphere light
    if (hemisphereRef.current) {
      const isDay = sunHeight > 0
      hemisphereRef.current.color.setHex(isDay ? 0x8888cc : 0x111133) // Sky
      hemisphereRef.current.groundColor.setHex(isDay ? 0x444422 : 0x111111) // Ground
    }
  })

  return (
    <>
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

      {/* Hemisphere light for natural outdoor lighting */}
      <hemisphereLight
        ref={hemisphereRef}
        args={['#8888cc', '#444422', 0.4]}
      />

      {/* Fog for atmosphere */}
      <fog attach="fog" args={['#1a1a2e', 50, 250]} />
    </>
  )
}
