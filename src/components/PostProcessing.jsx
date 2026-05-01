import React, { useRef, useMemo, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  ToneMapping,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import useGameStore from '../hooks/useGameStore'

export default function PostProcessing() {
  const playerPosition = useGameStore((s) => s.playerPosition)

  const bloomRef = useRef()

  return (
    <EffectComposer multisampling={4}>
      {/* Bloom for neon lights and emissive materials */}
      <Bloom
        ref={bloomRef}
        intensity={1.0}
        luminanceThreshold={0.5}
        luminanceSmoothing={0.4}
        mipmapBlur
      />

      {/* Subtle Chromatic Aberration */}
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(0.0003, 0.0003)}
      />

      {/* Very subtle Vignette */}
      <Vignette
        offset={0.5}
        darkness={0.25}
        blendFunction={BlendFunction.NORMAL}
      />

      {/* Tone mapping */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
