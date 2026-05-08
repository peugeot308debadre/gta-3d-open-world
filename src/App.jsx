import React, { Suspense, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/cannon'
import * as THREE from 'three'

import Player, { Ground } from './components/Player'
import City from './components/City'
import Vehicles from './components/Vehicles'
import DayNightCycle from './components/DayNightCycle'
import PostProcessing from './components/PostProcessing'
import Weather from './components/Weather'
import MaxGraphics from './components/MaxGraphics'
import UI from './components/UI'

function LoadingScreen() {
  const [progress, setProgress] = useState(0)
  const [tip, setTip] = useState('')

  const tips = [
    '💡 Utilisez Shift pour sprinter',
    '🔫 Appuyez sur 1-4 pour changer d\'arme',
    '🎯 Clic gauche pour tirer',
    '💰 Appuyez sur B pour la boutique',
    '🌆 Le cycle jour/nuit dure 3 minutes',
    '🚗 24 véhicules parcourent les rues',
  ]

  useEffect(() => {
    setTip(tips[Math.floor(Math.random() * tips.length)])
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 15, 95))
    }, 200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'linear-gradient(135deg, #0a0a12, #0d1117, #0a0a12)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: "'Rajdhani', 'Segoe UI', sans-serif",
    }}>
      <div style={{ fontSize: '48px', fontWeight: 'bold', letterSpacing: '8px', marginBottom: '8px',
        background: 'linear-gradient(135deg, #ff6644, #ffaa22, #ff6644)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        textShadow: 'none', filter: 'drop-shadow(0 0 20px rgba(255,102,68,0.3))',
      }}>
        GTA WORLD
      </div>
      <div style={{ fontSize: '14px', color: '#666', letterSpacing: '4px', marginBottom: '40px' }}>
        OPEN WORLD
      </div>

      <div style={{ width: '300px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{
          width: `${progress}%`, height: '100%',
          background: 'linear-gradient(90deg, #ff6644, #ffaa22)',
          borderRadius: '2px',
          boxShadow: '0 0 10px rgba(255,102,68,0.5)',
          transition: 'width 0.3s ease',
        }} />
      </div>

      <div style={{ fontSize: '12px', color: '#555', letterSpacing: '1px' }}>
        {tip}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        shadows
        shadow-map
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.5,
          powerPreference: 'high-performance',
          logarithmicDepthBuffer: true,
          alpha: false,
          stencil: false,
          depth: true,
        }}
        camera={{
          fov: 55,
          near: 0.1,
          far: 1000,
          position: [0, 10, 15],
        }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
        onCreated={({ gl }) => {
          gl.setClearColor('#0a0a12')
        }}
      >
        <Suspense fallback={null}>
          <DayNightCycle />

          <Physics
            gravity={[0, -20, 0]}
            broadphase="SAP"
            allowSleep
            defaultContactMaterial={{
              friction: 0.5,
              restitution: 0.1,
            }}
          >
            <Ground />
            <Player />
          </Physics>

          <City />
          <Vehicles />
          <Weather />
          <MaxGraphics />
          <PostProcessing />
        </Suspense>
      </Canvas>

      <UI />
    </div>
  )
}
