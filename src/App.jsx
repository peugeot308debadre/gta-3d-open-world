import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/cannon'
import * as THREE from 'three'

import Player, { Ground } from './components/Player'
import City from './components/City'
import Vehicles from './components/Vehicles'
import DayNightCycle from './components/DayNightCycle'
import PostProcessing from './components/PostProcessing'
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
          toneMappingExposure: 1.0,
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
          {/* Day/Night lighting system */}
          <DayNightCycle />

          {/* Physics world */}
          <Physics
            gravity={[0, -20, 0]}
            broadphase="SAP"
            allowSleep
            defaultContactMaterial={{
              friction: 0.5,
              restitution: 0.1,
            }}
          >
            {/* Ground physics plane */}
            <Ground />

            {/* Player with 3rd person controller */}
            <Player />
          </Physics>

          {/* City environment */}
          <City />

          {/* NPC Vehicles */}
          <Vehicles />

          {/* Post-processing effects */}
          <PostProcessing />
        </Suspense>
      </Canvas>

      {/* HTML/CSS UI overlay */}
      <UI />
    </div>
  )
}
