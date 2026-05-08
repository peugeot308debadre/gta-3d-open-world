import React, { useRef, useMemo } from 'react'
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  ToneMapping,
  BrightnessContrast,
  HueSaturation,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode, KernelSize } from 'postprocessing'
import * as THREE from 'three'

export default function PostProcessing() {
  const bloomRef = useRef()
  const chromaticOffset = useMemo(() => new THREE.Vector2(0.0004, 0.0004), [])

  return (
    <EffectComposer multisampling={4} disableNormalPass>
      <Bloom
        ref={bloomRef}
        intensity={1.4}
        luminanceThreshold={0.25}
        luminanceSmoothing={0.6}
        mipmapBlur
        kernelSize={KernelSize.LARGE}
        levels={8}
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={chromaticOffset}
        radialModulation
        modulationOffset={0.3}
      />
      <Vignette
        offset={0.3}
        darkness={0.65}
        blendFunction={BlendFunction.NORMAL}
        eskil={false}
      />
      <BrightnessContrast brightness={0.05} contrast={0.15} />
      <HueSaturation hue={0.02} saturation={0.2} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
