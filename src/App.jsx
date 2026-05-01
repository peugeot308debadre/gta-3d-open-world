import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/cannon'
import * as THREE from 'three'

import Player, { Ground } from './components/Player'
import City from './components/City'
import Vehicles from './components/Vehicles'
import DayNightCycle from './components/DayNightCycle'
import PostProcessing from './components/PostProcessing'
import Weather from './components/Weather'
import UI from './components/UI'

function LoadingScreen() {
  return (
    <mesh>
      <planeGeometry args={[4, 1]} />
      <meshBasicMaterial color="#333" />
    </mesh>
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
          toneMappingExposure: 1.8,
          powerPreference: 'high-performance',
        }}
        camera={{
          fov: 60,
          near: 0.1,
          far: 500,
          position: [0, 10, 15],
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={<LoadingScreen />}>
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
          <PostProcessing />
        </Suspense>
      </Canvas>

      <UI />
    </div>
  )
}
