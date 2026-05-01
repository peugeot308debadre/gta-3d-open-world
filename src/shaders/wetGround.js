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

    // Subtle wave displacement for puddles
    float wave = sin(worldPos.x * 3.0 + uTime * 2.0) * cos(worldPos.z * 3.0 + uTime * 1.5) * 0.02 * uRainIntensity;
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

  // Simplex noise function
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

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewDir);
    vec3 lightDir = normalize(uLightDirection);

    // Base asphalt/road color
    vec3 baseColor = vec3(0.15, 0.15, 0.17);

    // Add road markings
    float roadLine = smoothstep(0.48, 0.5, abs(fract(vWorldPosition.x * 0.1) - 0.5));
    vec3 roadColor = mix(vec3(0.7, 0.7, 0.6), baseColor, roadLine);

    // Puddle detection using noise
    float puddleNoise = snoise(vWorldPosition.xz * 0.15 + uTime * 0.1);
    float puddle = smoothstep(0.3, 0.6, puddleNoise) * uRainIntensity;

    // Ripple effect for puddles
    float ripple1 = sin(length(vWorldPosition.xz - vec2(2.0, 3.0)) * 15.0 - uTime * 8.0) * 0.5 + 0.5;
    float ripple2 = sin(length(vWorldPosition.xz - vec2(-5.0, 1.0)) * 12.0 - uTime * 6.0) * 0.5 + 0.5;
    float ripple3 = sin(length(vWorldPosition.xz - vec2(1.0, -4.0)) * 18.0 - uTime * 10.0) * 0.5 + 0.5;
    float ripple = max(max(ripple1, ripple2), ripple3) * puddle;

    // Reflection calculation (fake environment reflection)
    vec3 reflectDir = reflect(-viewDir, normal + vec3(ripple * 0.1));
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
    vec3 fakeEnvColor = vec3(0.1, 0.1, 0.2) + reflectDir.y * 0.3;

    // Mix wet surface with puddle reflection
    float wetness = uRainIntensity * 0.6;
    vec3 wetColor = roadColor * (1.0 - wetness * 0.3);
    vec3 puddleColor = mix(wetColor, fakeEnvColor, fresnel * puddle * 0.8);
    vec3 finalColor = mix(wetColor, puddleColor, puddle);

    // Specular highlight from light
    vec3 halfDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), 64.0);
    finalColor += spec * uLightColor * 0.5 * (wetness + puddle * 0.5);

    // Ambient light
    finalColor *= (uAmbientIntensity + 0.3);

    // Rain streak effect
    float streak = snoise(vec2(vWorldPosition.x * 2.0 + uTime * 3.0, vWorldPosition.z * 0.5));
    finalColor += vec3(0.02) * max(streak, 0.0) * uRainIntensity;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`
