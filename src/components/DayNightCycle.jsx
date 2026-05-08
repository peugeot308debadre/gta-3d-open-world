import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sky, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import useGameStore from '../hooks/useGameStore'

const DAY_CYCLE_DURATION = 180

export default function DayNightCycle() {
  const lightRef = useRef()
  const ambientRef = useRef()
  const hemisphereRef = useRef()
  const fogRef = useRef()
  const backLightRef = useRef()
  const rimLightRef = useRef()
  const fillLightRef = useRef()
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

    // === MAIN SUNLIGHT - 3-point lighting setup ===
    if (lightRef.current) {
      lightRef.current.position.set(sx, sy, sz)
      const dayIntensity = Math.max(0, sunHeight)
      lightRef.current.intensity = dayIntensity * 8

      // Cinematic sun color transitions
      const sunColor = new THREE.Color()
      if (sunHeight > 0.4) {
        sunColor.setRGB(1.0, 0.98, 0.95)
      } else if (sunHeight > 0.15) {
        const t = (sunHeight - 0.15) / 0.25
        sunColor.setRGB(1.0, 0.75 + t * 0.23, 0.45 + t * 0.5)
      } else if (sunHeight > -0.05) {
        const t = (sunHeight + 0.05) / 0.2
        sunColor.setRGB(1.0, 0.4 + t * 0.35, 0.15 + t * 0.3)
      } else {
        sunColor.setRGB(0.12, 0.12, 0.25)
      }
      lightRef.current.color = sunColor
    }

    // === BACK LIGHT for rim lighting ===
    if (backLightRef.current) {
      backLightRef.current.position.set(-sx * 0.3, 30, -sz)
      backLightRef.current.intensity = Math.max(0, sunHeight) * 3
      const isDay = sunHeight > 0
      backLightRef.current.color.setHex(isDay ? 0xaabbff : 0x112244)
    }

    // === RIM LIGHT for character silhouette ===
    if (rimLightRef.current) {
      rimLightRef.current.position.set(sx * 0.5, 15, -30)
      rimLightRef.current.intensity = Math.max(0, sunHeight) * 2
      rimLightRef.current.color.setRGB(1, 0.85, 0.7)
    }

    // === FILL LIGHT for shadow detail ===
    if (fillLightRef.current) {
      fillLightRef.current.position.set(-30, 10, 40)
      fillLightRef.current.intensity = 0.3 + Math.max(0, sunHeight) * 0.8
      fillLightRef.current.color.setHex(sunHeight > 0 ? 0x8899bb : 0x1a1a33)
    }

    // === AMBIENT - rich color variation ===
    if (ambientRef.current) {
      const nightAmbient = 0.25
      const dayAmbient = 1.0
      ambientRef.current.intensity = nightAmbient + (dayAmbient - nightAmbient) * Math.max(0, sunHeight)

      // Warm night, cool day
      if (sunHeight > 0.3) {
        ambientRef.current.color.setHex(0xdde0f0)
      } else if (sunHeight > 0) {
        ambientRef.current.color.setRGB(0.95, 0.82, 0.65)
      } else {
        ambientRef.current.color.setRGB(0.08, 0.08, 0.18)
      }
    }

    // === HEMISPHERE - sky/ground color ===
    if (hemisphereRef.current) {
      const isDay = sunHeight > 0
      if (isDay) {
        hemisphereRef.current.color.setRGB(0.7, 0.8, 1.0)
        hemisphereRef.current.groundColor.setRGB(0.5, 0.45, 0.35)
      } else {
        hemisphereRef.current.color.setRGB(0.06, 0.06, 0.15)
        hemisphereRef.current.groundColor.setRGB(0.03, 0.03, 0.06)
      }
      hemisphereRef.current.intensity = isDay ? 1.2 : 0.3
    }

    // === DYNAMIC FOG - cinematic atmosphere ===
    if (fogRef.current) {
      const fogColor = new THREE.Color()
      if (sunHeight > 0.4) {
        fogColor.setRGB(0.78, 0.84, 0.95)
      } else if (sunHeight > 0.15) {
        const t = (sunHeight - 0.15) / 0.25
        fogColor.setRGB(0.95 - t * 0.17, 0.7 + t * 0.14, 0.5 + t * 0.45)
      } else if (sunHeight > -0.05) {
        const t = (sunHeight + 0.05) / 0.2
        fogColor.setRGB(0.35 + t * 0.6, 0.25 + t * 0.45, 0.3 + t * 0.2)
      } else {
        fogColor.setRGB(0.04, 0.04, 0.08)
      }
      fogRef.current.color.copy(fogColor)
    }
  })

  return (
    <>
      {/* Physical sky - cinematic preset */}
      <Sky
        sunPosition={sunPosition.current}
        turbidity={4}
        rayleigh={2}
        mieCoefficient={0.003}
        mieDirectionalG={0.97}
      />

      {/* Stars */}
      <Sparkles
        count={1000}
        scale={[400, 250, 400]}
        size={2}
        speed={0.05}
        opacity={0.9}
        color="#ffffff"
      />

      {/* === KEY LIGHT - Main Sun === */}
      <directionalLight
        ref={lightRef}
        position={[50, 80, 30]}
        intensity={6}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={200}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />

      {/* === BACK LIGHT - Separation === */}
      <directionalLight
        ref={backLightRef}
        intensity={3}
        castShadow={false}
      />

      {/* === RIM LIGHT - Silhouette edge === */}
      <directionalLight
        ref={rimLightRef}
        intensity={2}
      />

      {/* === FILL LIGHT - Shadow color === */}
      <directionalLight
        ref={fillLightRef}
        intensity={0.5}
      />

      {/* Ambient - mood */}
      <ambientLight ref={ambientRef} intensity={0.4} color="#dde0f0" />

      {/* Hemisphere - sky/ground bounce */}
      <hemisphereLight ref={hemisphereRef} args={['#8899cc', '#554433', 1.0]} />

      {/* Cinematic fog */}
      <fog ref={fogRef} attach="fog" args={['#ccddee', 80, 600]} />
    </>
  )
}
