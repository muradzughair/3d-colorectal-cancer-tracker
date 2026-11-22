// The wet, pink-red inner lining (mucosa) used in the Inside view.
// It is a normal three.js physical material (wet shine from a clear coat) with a few lines of
// shader code added:
//   - folds (haustra): ring-shaped ridges across the colon, every FOLD_SPACING along it
//   - a fine, uneven surface (bump), made from noise
//   - faint vein-like lines in the colour (not on and around tumors, where the normal vein
//     pattern is lost)
// The folds and bumps only change how light falls on the surface (no change to the model).
// Each vertex needs "along" (its distance along the colon) and "alongDirection" (the way the
// colon runs there); see insideScene.ts.
import * as THREE from 'three'

const FOLD_SPACING = 0.12 // distance between folds, in scene units (about 0.7 x the colon's width)

// Small noise functions (value noise): smooth random numbers in space.
const NOISE = /* glsl */ `
  varying float vAlong;
  varying vec3 vLocal; // position on the wall, in scene units
  varying vec3 vAlongDirection; // the way the colon runs, in camera space
  uniform float uFoldSpacing;
  uniform vec4 uTumors[4]; // tumor positions on the wall (xyz) and how far around them (w)

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3(0, 0, 0)), hash(i + vec3(1, 0, 0)), f.x),
                   mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
                   mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    return 0.5 * noise(p) + 0.3 * noise(p * 2.1) + 0.2 * noise(p * 4.3);
  }

  // Fold ridges across the colon (uneven along their length): height 0..1.
  float foldStrength() {
    return 0.6 + 0.4 * noise(vLocal * 18.0);
  }
  float foldRidge() {
    float wave = 0.5 + 0.5 * cos(6.2831853 * vAlong / uFoldSpacing);
    return pow(wave, 3.0) * foldStrength();
  }
  // How steeply the ridge rises or falls along the colon (the slope of foldRidge).
  float foldSlope() {
    float angle = 6.2831853 * vAlong / uFoldSpacing;
    float wave = 0.5 + 0.5 * cos(angle);
    return 3.0 * wave * wave * (-0.5 * sin(angle)) * (6.2831853 / uFoldSpacing) * foldStrength();
  }
  // Tilt the normal forwards or backwards along the colon, following the fold's slope.
  vec3 foldNormal(vec3 n) {
    vec3 t = vAlongDirection - dot(vAlongDirection, n) * n;
    return normalize(n - 0.022 * foldSlope() * normalize(t + 1e-6));
  }

  // Tilt the surface normal by the slope of the height (the usual "bump map" trick).
  vec3 bumpNormal(vec3 surfPos, vec3 surfNormal, float height, float strength, float faceDirection) {
    vec3 sigmaX = dFdx(surfPos);
    vec3 sigmaY = dFdy(surfPos);
    vec3 r1 = cross(sigmaY, surfNormal);
    vec3 r2 = cross(surfNormal, sigmaX);
    float det = dot(sigmaX, r1) * faceDirection;
    vec2 slope = vec2(dFdx(height), dFdy(height)) * strength;
    vec3 grad = sign(det) * (slope.x * r1 + slope.y * r2);
    return normalize(abs(det) * surfNormal - grad);
  }
`

// tumors: positions (xyz) and reach (w) of up to 4 tumors; the array may be filled in later.
export function createMucosaMaterial(tumors: THREE.Vector4[] = []): THREE.MeshPhysicalMaterial {
  const material = new THREE.MeshPhysicalMaterial({
    color: '#d0605d', // pink-red lining
    roughness: 0.38,
    clearcoat: 0.8, // a wet film on top: the soft bright highlight of the light
    clearcoatRoughness: 0.18,
    sheen: 0.4,
    sheenColor: new THREE.Color('#ffb3a8'),
    // Both sides: where two parts of the model meet there are small gaps, and the far side of
    // the wall shows through them (instead of black holes).
    side: THREE.DoubleSide,
  })

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uFoldSpacing = { value: FOLD_SPACING }
    // Always 4 entries (unused ones have reach 0).
    const spots = Array.from({ length: 4 }, (_, i) => tumors[i] ?? new THREE.Vector4(0, 0, 0, 0))
    shader.uniforms.uTumors = { value: spots }

    // Vertex shader: pass the distance along the colon and the model position on.
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nattribute float along;\nattribute vec3 alongDirection;\nvarying float vAlong;\nvarying vec3 vLocal;\nvarying vec3 vAlongDirection;',
      )
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvAlong = along;\nvLocal = position;\nvAlongDirection = normalize(normalMatrix * alongDirection);',
      )

    // Fragment shader: colour (veins, darker between folds) and the bumpy normal.
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + NOISE)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float vein = 1.0 - smoothstep(0.0, 0.035, abs(fbm(vLocal * 38.0) - 0.5));
        for (int i = 0; i < 4; i++) {
          if (uTumors[i].w > 0.0) vein *= smoothstep(uTumors[i].w * 0.8, uTumors[i].w * 1.6, distance(vLocal, uTumors[i].xyz));
        }
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.55, 0.12, 0.16), vein * 0.35);
        diffuseColor.rgb *= 0.45 + 0.55 * foldRidge(); // darker in the grooves between folds`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        normal = foldNormal(normal);
        normal = bumpNormal(-vViewPosition, normal, fbm(vLocal * 75.0), 0.0012, faceDirection); // fine, uneven texture`,
      )
  }
  return material
}
