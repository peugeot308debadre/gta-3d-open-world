import React, { useRef, useMemo, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  DepthOfField,
  ToneMapping,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import useGameStore from '../hooks/useGameStore'

export default function PostProcessing() {
  const playerPosition = useGameStore((s) => s.playerPosition)

  const bloomRef = useRef()
  const dofRef = useRef()

  useFrame(() => {
    // Dynamic depth of field based on player position
    if (dofRef.current) {
      dofRef.current.target = new THREE.Vector3(...playerPosition)
    }
  })

  return (
    <EffectComposer multisampling={4}>
      {/* Bloom for neon lights and emissive materials */}
      <Bloom
        ref={bloomRef}
        intensity={0.8}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.4}
        mipmapBlur
      />

      {/* Depth of Field */}
      <DepthOfField
        ref={dofRef}
        focusDistance={0.01}
        focalLength={0.06}
        bokehScale={3}
      />

      {/* Chromatic Aberration for cinematic feel */}
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(0.0005, 0.0005)}
      />

      {/* Vignette for cinematic framing */}
      <Vignette
        offset={0.3}
        darkness={0.6}
        blendFunction={BlendFunction.NORMAL}
      />

      {/* Tone mapping */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
