// Custom GLSL shaders for wet ground / water puddle reflections

export const wetGroundVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  uniform float uTime;
  uniform float uRainIntensity;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vNormal = normalize(normalMatrix * normal);

    // Multi-layer wave displacement for puddles
    float wave = sin(worldPos.x * 3.0 + uTime * 2.0) * cos(worldPos.z * 3.0 + uTime * 1.5) * 0.02 * uRainIntensity;
    wave += sin(worldPos.x * 7.0 - uTime * 3.0) * cos(worldPos.z * 5.0 + uTime * 2.0) * 0.008 * uRainIntensity;
    vec3 displacedPosition = position + normal * wave;

    vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
    vViewDir = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`

export const wetGroundFragmentShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  uniform float uTime;
  uniform float uRainIntensity;
  uniform vec3 uLightDirection;
  uniform vec3 uLightColor;
  uniform float uAmbientIntensity;

  // Simplex noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
      + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Road marking detection
  float roadMarking(vec3 wp) {
    // Center dashed line
    float roadPeriod = 26.0;
    float roadCenter = mod(wp.z + roadPeriod * 0.5, roadPeriod) - roadPeriod * 0.5;
    float onRoadH = abs(roadCenter) < 4.0 ? 1.0 : 0.0;
    float dashH = onRoadH * step(mod(wp.x, 6.0), 3.0) * step(abs(wp.z - floor(wp.z / roadPeriod + 0.5) * roadPeriod), 0.08);

    // Vertical road
    float roadCenterV = mod(wp.x + roadPeriod * 0.5, roadPeriod) - roadPeriod * 0.5;
    float onRoadV = abs(roadCenterV) < 4.0 ? 1.0 : 0.0;
    float dashV = onRoadV * step(mod(wp.z, 6.0), 3.0) * step(abs(wp.x - floor(wp.x / roadPeriod + 0.5) * roadPeriod), 0.08);

    return max(dashH, dashV);
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewDir);
    vec3 lightDir = normalize(uLightDirection);

    // Multi-octave asphalt base
    vec3 baseColor = vec3(0.14, 0.14, 0.16);
    float n1 = snoise(vWorldPosition.xz * 0.15);
    float n2 = snoise(vWorldPosition.xz * 0.5);
    float n3 = snoise(vWorldPosition.xz * 2.0);
    baseColor += vec3(n1 * 0.04 + n2 * 0.02 + n3 * 0.01);

    // Road markings
    float marking = roadMarking(vWorldPosition);
    baseColor = mix(baseColor, vec3(0.8, 0.8, 0.7), marking * 0.6);

    // Sidewalk detection
    float roadPeriod = 26.0;
    float onSidewalkH = step(4.0, abs(mod(vWorldPosition.z + roadPeriod * 0.5, roadPeriod) - roadPeriod * 0.5));
    float onSidewalkV = step(4.0, abs(mod(vWorldPosition.x + roadPeriod * 0.5, roadPeriod) - roadPeriod * 0.5));
    float onSidewalk = max(onSidewalkH, onSidewalkV);
    vec3 sidewalkColor = mix(baseColor, vec3(0.45, 0.45, 0.42), onSidewalk * 0.5);

    // Puddle system
    float puddleNoise = snoise(vWorldPosition.xz * 0.15 + uTime * 0.1);
    float puddleNoise2 = snoise(vWorldPosition.xz * 0.3 - uTime * 0.05);
    float puddle = smoothstep(0.2, 0.6, puddleNoise * 0.7 + puddleNoise2 * 0.3) * uRainIntensity;

    // Multi-source ripples
    float ripple = 0.0;
    for (int i = 0; i < 4; i++) {
      vec2 center = vec2(float(i) * 37.0 + 10.0, float(i) * 23.0 + 5.0);
      float r = sin(length(vWorldPosition.xz - center) * 12.0 - uTime * float(i + 5) * 2.0) * 0.5 + 0.5;
      ripple = max(ripple, r);
    }
    ripple *= puddle;

    // Reflection with perturbation
    vec3 perturbedNormal = normal + vec3(ripple * 0.08, 0.0, ripple * 0.08);
    vec3 reflectDir = reflect(-viewDir, perturbedNormal);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 4.0);

    // Sky reflection color
    vec3 skyRef = mix(vec3(0.3, 0.35, 0.5), vec3(0.6, 0.65, 0.8), reflectDir.y * 0.5 + 0.5);
    vec3 buildingRef = vec3(0.08, 0.08, 0.12) + reflectDir.x * 0.05;
    vec3 fakeEnvColor = mix(buildingRef, skyRef, smoothstep(-0.2, 0.3, reflectDir.y));

    // Mix wet and puddle
    float wetness = uRainIntensity * 0.7;
    vec3 wetSurface = sidewalkColor * (1.0 - wetness * 0.4);
    vec3 puddleSurface = mix(wetSurface, fakeEnvColor, fresnel * 0.7);
    vec3 finalColor = mix(wetSurface, puddleSurface, puddle);

    // Specular highlights
    vec3 halfDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(perturbedNormal, halfDir), 0.0), 80.0);
    finalColor += spec * uLightColor * 0.8 * (wetness + puddle * 0.5);

    // Ambient
    finalColor *= (uAmbientIntensity + 0.4);

    // Rain streaks
    float streak = snoise(vec2(vWorldPosition.x * 3.0 + uTime * 4.0, vWorldPosition.z * 0.5));
    finalColor += vec3(0.015) * max(streak, 0.0) * uRainIntensity;

    // Subtle tire marks on road
    float tireMark = snoise(vec2(vWorldPosition.x * 0.5, vWorldPosition.z * 0.02)) * 0.03;
    finalColor -= vec3(tireMark) * (1.0 - onSidewalk);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`
