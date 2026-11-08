import { motion, useMotionTemplate, useReducedMotion, useTransform, type MotionValue } from 'framer-motion'
import { useEffect, useRef, type RefObject } from 'react'
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Matrix4,
  Mesh,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three'

// A rolling sea of tiny voxels that mirrors the hero headline, in three passes:
//   1. the sea: one dense displaced sheet; the voxels are a procedural square-dot pattern on it, so the
//      count is free. Big swells roll toward the camera, entirely on the GPU.
//   2. + 3. a tilt-shift blur (crisp at the bottom, soft toward the horizon) composited over a dark sky
//      with an indigo horizon glow.
//
// The reflection is ray-traced against the layout: the headline is treated as a billboard standing at the
// far edge of the sea, exactly where the DOM draws it. Each sea fragment reflects the view ray off its wave
// normal, intersects that billboard, and reads the headline texture there, so the letters bend with the swell.
//
// The camera fits the layout: it is pitched so the far edge of the sea (the horizon) sits `horizonGap` of the
// viewport height below the headline's baseline.

export type ReflectedLine = {
  ref: RefObject<HTMLElement | null>
  text: string
  /** Horizontal offset of the element in px (e.g. its scroll exit), read every frame. */
  shift?: MotionValue<number>
}

type VoxelSeaProps = {
  /** Headline pieces. Each is drawn into the reflection at its own layout box and shift. */
  lines: ReflectedLine[]
  /** 0 → 1 as the hero scrolls out of view: the sea fades out early on and stops rendering once faded. */
  exit: MotionValue<number>
  /** Space between the last headline baseline and the horizon, as a share of the viewport height. */
  horizonGap?: number
  className?: string
}

const MAX_LINES = 4
const FOV = 40
const CAMERA_HEIGHT = 30 // in voxels
const SEA_FAR = 2400 // far edge of the sea, in voxels; the headline billboard stands here
const AMPLITUDE = 8 // swell height, in voxels
const DOT_FILL = 0.62 // share of each cell covered by its voxel
const GRID_COLUMNS = 300
const GRID_ROWS = 240
const MAX_DPR = 1.5
// Touch devices (phones, tablets) render the sea a little softer and with lighter antialiasing: the fragment work
// scales with pixel count and the sea runs every frame while the hero is up, so this is where a phone's GPU and
// battery go. The tilt-shift blur hides the difference everywhere but the nearest voxels.
const MAX_DPR_TOUCH = 1.25
const MSAA_SAMPLES = 4
const MSAA_SAMPLES_TOUCH = 2
const TEXT_DPR = 1.5
const BLUR_RADIUS = 10 // CSS px at the horizon
const FROZEN_TIME = 14 // the frame shown with reduced motion
const EXIT_FADE: [number, number] = [0.06, 0.55] // share of the hero's exit over which the sea fades out

// sRGB, written out untouched by the shaders.
const SKY_TOP = '#0b0a14'
const SKY_LOW = '#100d22'
const GLOW = '#2c2384'
const HAZE = '#30278f'
const GAP = '#07060e'
const DEEP = '#221884'
const MID = '#4b3ade'
const BRIGHT = '#9a8cff'
const LETTER = '#f1efff'

const srgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  return new Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

const easeOutCubic = (t: number) => 1 - (1 - Math.min(Math.max(t, 0), 1)) ** 3

const seaVertex = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  uniform float uNear;
  uniform float uFar;
  uniform float uSpread;
  attribute vec2 aGrid;
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying float vDist;

  // Long swells rolling toward the camera (+z): phase k·z − ω·t.
  float swell(vec2 p, float t) {
    p *= 1.1;
    float h = 1.0 * sin(p.y * 0.021 - t * 0.55 + sin(p.x * 0.0055 + t * 0.05) * 2.2);
    h += 0.55 * sin(dot(p, vec2(0.011, 0.016)) - t * 0.42 + 1.3);
    h += 0.35 * sin(dot(p, vec2(-0.016, 0.012)) - t * 0.68 + 0.5);
    h += 0.16 * sin(dot(p, vec2(0.038, 0.047)) - t * 1.05);
    return h;
  }

  void main() {
    // Rows are spaced geometrically so the sheet is evenly dense on screen; each row spans the view.
    float dist = uNear * pow(uFar / uNear, aGrid.y);
    float reach = dist * uSpread + 60.0;
    vec2 p = vec2((aGrid.x * 2.0 - 1.0) * reach, -dist);

    float h = swell(p, uTime) * uAmp;
    float e = 1.5;
    float hx = (swell(p + vec2(e, 0.0), uTime) - swell(p - vec2(e, 0.0), uTime)) * uAmp / (2.0 * e);
    float hz = (swell(p + vec2(0.0, e), uTime) - swell(p - vec2(0.0, e), uTime)) * uAmp / (2.0 * e);

    vec3 world = vec3(p.x, h, p.y);
    vec4 mv = viewMatrix * vec4(world, 1.0);
    gl_Position = projectionMatrix * mv;
    vWorld = world;
    vNormal = vec3(-hx, 1.0, -hz);
    vDist = -mv.z;
  }
`

const seaFragment = /* glsl */ `
  uniform vec3 uCamera;
  uniform mat4 uViewProjection;
  uniform float uBillboard;
  uniform sampler2D uText;
  uniform vec4 uRects[${MAX_LINES}];
  uniform float uShifts[${MAX_LINES}];
  uniform int uLineCount;
  uniform float uReflect;
  uniform float uFill;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform vec3 uGap;
  uniform vec3 uDeep;
  uniform vec3 uMid;
  uniform vec3 uBright;
  uniform vec3 uLetter;
  uniform vec3 uHaze;
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying float vDist;

  // Headline coverage at a screen uv, with every piece slid by its own exit offset.
  float textAt(vec2 uv) {
    float a = 0.0;
    for (int i = 0; i < ${MAX_LINES}; i++) {
      if (i >= uLineCount) break;
      vec2 p = uv - vec2(uShifts[i], 0.0);
      vec4 r = uRects[i];
      if (p.x > r.x && p.x < r.z && p.y > r.y && p.y < r.w) a = max(a, texture(uText, p).a);
    }
    return a;
  }

  void main() {
    // Full slope for shading, a gentler one for the mirror: at grazing angles the true slope would shred it.
    vec3 n = normalize(vec3(vNormal.x * 0.8, 1.0, vNormal.z * 0.8));
    vec3 view = normalize(vWorld - uCamera);
    vec3 r = reflect(view, n);
    vec3 mirror = reflect(view, normalize(vec3(vNormal.x * 0.14, 1.0, vNormal.z * 0.14)));

    // Square voxels on a one-unit grid, filtered so distant ones settle into their average coverage.
    vec2 g = vWorld.xz;
    vec2 cell = abs(fract(g) - 0.5);
    float d = max(cell.x, cell.y);
    float w = max(fwidth(g.x), fwidth(g.y));
    float edge = 0.5 * uFill;
    float aa = 0.7 * w + 0.002;
    float voxel = 1.0 - smoothstep(edge - aa, edge + aa, d);
    voxel = mix(voxel, uFill * uFill * 1.15, smoothstep(0.45, 1.0, w));

    // Faces toward the camera catch a front light; slopes that mirror the horizon catch its glow.
    float facing = clamp(dot(n, normalize(vec3(0.0, 0.55, 0.85))), 0.0, 1.0);
    float glow = exp(-abs(r.y - 0.03) * 10.0);
    vec3 col = mix(uDeep, uMid, smoothstep(0.35, 1.0, facing)) + uBright * glow * 0.55;

    // Trace the reflected ray to the headline billboard at the far edge.
    if (mirror.z < -0.001 && mirror.y > 0.0) {
      vec3 q = vWorld + mirror * ((-uBillboard - vWorld.z) / mirror.z);
      vec4 clip = uViewProjection * vec4(q, 1.0);
      if (clip.w > 0.0) col += uLetter * textAt(clip.xy / clip.w * 0.5 + 0.5) * uReflect * 0.75;
    }

    col = mix(uGap, col, voxel);
    col = mix(col, uHaze, smoothstep(uFogNear, uFogFar, vDist) * 0.92);
    gl_FragColor = vec4(col, 1.0);
  }
`

const screenVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

// Separable gaussian whose radius grows from 0 near the bottom to uRadius at the horizon and above.
const blurCommon = /* glsl */ `
  uniform sampler2D uInput;
  uniform vec2 uTexel;
  uniform vec2 uDirection;
  uniform float uRadius;
  uniform float uHorizon;
  varying vec2 vUv;

  vec4 blurred() {
    float fromTop = 1.0 - vUv.y;
    float t = clamp((0.98 - fromTop) / (0.98 - uHorizon), 0.0, 1.0);
    float radius = uRadius * pow(t, 2.0);
    if (radius < 0.6) return texture(uInput, vUv);
    vec4 sum = vec4(0.0);
    float total = 0.0;
    for (int i = -6; i <= 6; i++) {
      float x = float(i) / 6.0;
      float weight = exp(-x * x * 2.2);
      sum += texture(uInput, vUv + uDirection * uTexel * x * radius) * weight;
      total += weight;
    }
    return sum / total;
  }
`

const blurFragment = /* glsl */ `
  ${blurCommon}
  void main() {
    gl_FragColor = blurred();
  }
`

const compositeFragment = /* glsl */ `
  ${blurCommon}
  uniform vec3 uSkyTop;
  uniform vec3 uSkyLow;
  uniform vec3 uGlow;
  uniform float uAspect;

  void main() {
    vec4 sea = blurred(); // premultiplied: the sea is opaque, the sky behind it is clear
    float fromTop = 1.0 - vUv.y;
    vec3 sky = mix(uSkyTop, uSkyLow, smoothstep(0.0, uHorizon, fromTop));
    vec2 o = vec2((vUv.x - 0.5) / 0.62, (fromTop - uHorizon) / 0.2);
    sky += uGlow * exp(-dot(o, o));

    vec3 col = sky * (1.0 - sea.a) + sea.rgb;
    vec2 v = (vUv - 0.5) * vec2(uAspect / max(uAspect, 1.0), 1.0) * 1.35;
    col *= 1.0 - 0.45 * smoothstep(0.35, 0.95, length(v));
    gl_FragColor = vec4(col, 1.0);
  }
`

/** Offsets of `el` relative to each of its offset parents, walking up. Transforms are ignored. */
function offsetChain(el: HTMLElement) {
  const chain = new Map<Element | null, { left: number; top: number }>()
  let left = 0
  let top = 0
  let node: HTMLElement | null = el
  while (node) {
    left += node.offsetLeft
    top += node.offsetTop
    chain.set(node.offsetParent, { left, top })
    node = node.offsetParent as HTMLElement | null
  }
  return chain
}

/** Layout box of `el` in `reference`'s coordinates, ignoring transforms (the headline animates in and out). */
function layoutBoxIn(el: HTMLElement, reference: HTMLElement) {
  const own = offsetChain(el)
  const ref = offsetChain(reference)
  for (const [ancestor, a] of own) {
    const b = ref.get(ancestor)
    if (b) return { left: a.left - b.left, top: a.top - b.top, width: el.offsetWidth, height: el.offsetHeight }
  }
  return { left: 0, top: 0, width: el.offsetWidth, height: el.offsetHeight }
}

function buildSheet() {
  const grid = new Float32Array((GRID_COLUMNS + 1) * (GRID_ROWS + 1) * 2)
  for (let row = 0, k = 0; row <= GRID_ROWS; row++) {
    for (let col = 0; col <= GRID_COLUMNS; col++) {
      grid[k++] = col / GRID_COLUMNS
      grid[k++] = row / GRID_ROWS
    }
  }
  const index = new Uint32Array(GRID_COLUMNS * GRID_ROWS * 6)
  for (let row = 0, k = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLUMNS; col++) {
      const a = row * (GRID_COLUMNS + 1) + col
      const b = a + GRID_COLUMNS + 1
      // Front faces toward the camera: rows run away from it, columns left to right.
      index.set([a, a + 1, b, a + 1, b + 1, b], k)
      k += 6
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('aGrid', new BufferAttribute(grid, 2))
  // three needs a position attribute to size the draw; the real positions come from aGrid.
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(grid.length * 1.5), 3))
  geometry.setIndex(new BufferAttribute(index, 1))
  return geometry
}

export function VoxelSea({ lines, exit, horizonGap = 0.085, className }: VoxelSeaProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const linesRef = useRef(lines)
  useEffect(() => {
    linesRef.current = lines
  }, [lines])
  const reducedMotion = useReducedMotion() ?? false
  const opacity = useTransform(exit, EXIT_FADE, [1, 0])
  // As the hero scrolls up, its bottom edge feathers out so the sea dissolves instead of ending in a hard line.
  const feather = useTransform(exit, [0, EXIT_FADE[1] * 0.6], [0, 45])
  const mask = useMotionTemplate`linear-gradient(to bottom, #000 calc(100% - ${feather}%), transparent)`

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let renderer: WebGLRenderer
    try {
      renderer = new WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' })
    } catch {
      return // No WebGL: the headline still stands on the plain background.
    }
    const touch = window.matchMedia('(pointer: coarse)').matches
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, touch ? MAX_DPR_TOUCH : MAX_DPR))
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%'
    container.appendChild(renderer.domElement)

    const seaTarget = new WebGLRenderTarget(1, 1, { samples: touch ? MSAA_SAMPLES_TOUCH : MSAA_SAMPLES })
    const blurTarget = new WebGLRenderTarget(1, 1)

    // --- the sea
    const scene = new Scene()
    const camera = new PerspectiveCamera(FOV, 1, 1, SEA_FAR * 1.5)
    camera.position.set(0, CAMERA_HEIGHT, 0)
    const tanHalf = Math.tan((FOV * Math.PI) / 360)

    const textCanvas = document.createElement('canvas')
    const textContext = textCanvas.getContext('2d')
    let textTexture = new CanvasTexture(textCanvas)

    const seaUniforms = {
      uTime: { value: 0 },
      uAmp: { value: 0 },
      uNear: { value: 80 },
      uFar: { value: SEA_FAR },
      uSpread: { value: 1 },
      uCamera: { value: camera.position },
      uViewProjection: { value: new Matrix4() },
      uBillboard: { value: SEA_FAR },
      uText: { value: textTexture },
      uRects: { value: Array.from({ length: MAX_LINES }, () => new Vector4()) },
      uShifts: { value: new Array<number>(MAX_LINES).fill(0) },
      uLineCount: { value: 0 },
      uReflect: { value: 0 },
      uFill: { value: DOT_FILL },
      uFogNear: { value: 200 },
      uFogFar: { value: SEA_FAR },
      uGap: { value: srgb(GAP) },
      uDeep: { value: srgb(DEEP) },
      uMid: { value: srgb(MID) },
      uBright: { value: srgb(BRIGHT) },
      uLetter: { value: srgb(LETTER) },
      uHaze: { value: srgb(HAZE) },
    }
    const seaMaterial = new ShaderMaterial({
      uniforms: seaUniforms,
      vertexShader: seaVertex,
      fragmentShader: seaFragment,
    })
    const sheet = buildSheet()
    const sea = new Mesh(sheet, seaMaterial)
    sea.frustumCulled = false
    scene.add(sea)

    // --- the screen passes
    const screenCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const screenScene = new Scene()
    const quad = new PlaneGeometry(2, 2)
    const blurUniforms = {
      uInput: { value: seaTarget.texture },
      uTexel: { value: new Vector2() },
      uDirection: { value: new Vector2(1, 0) },
      uRadius: { value: BLUR_RADIUS },
      uHorizon: { value: 0.53 },
    }
    const compositeUniforms = {
      ...blurUniforms,
      uInput: { value: blurTarget.texture },
      uDirection: { value: new Vector2(0, 1) },
      uSkyTop: { value: srgb(SKY_TOP) },
      uSkyLow: { value: srgb(SKY_LOW) },
      uGlow: { value: srgb(GLOW) },
      uAspect: { value: 1 },
    }
    const blurMaterial = new ShaderMaterial({
      uniforms: blurUniforms,
      vertexShader: screenVertex,
      fragmentShader: blurFragment,
    })
    const compositeMaterial = new ShaderMaterial({
      uniforms: compositeUniforms,
      vertexShader: screenVertex,
      fragmentShader: compositeFragment,
    })
    const screen = new Mesh(quad, blurMaterial)
    screenScene.add(screen)

    const viewProjection = new Matrix4()
    let width = 1
    let height = 1

    const layout = () => {
      width = Math.max(container.clientWidth, 1)
      height = Math.max(container.clientHeight, 1)
      renderer.setSize(width, height, false)
      const buffer = renderer.getDrawingBufferSize(new Vector2())
      seaTarget.setSize(buffer.x, buffer.y)
      blurTarget.setSize(buffer.x, buffer.y)
      blurUniforms.uTexel.value.set(1 / buffer.x, 1 / buffer.y)
      const pixelRatio = renderer.getPixelRatio()
      blurUniforms.uRadius.value = BLUR_RADIUS * pixelRatio
      compositeUniforms.uRadius.value = BLUR_RADIUS * pixelRatio
      compositeUniforms.uAspect.value = width / height

      // Redraw the headline where the DOM has it. A fresh texture each time: WebGL2 storage can't be resized.
      const scale = Math.min(window.devicePixelRatio, TEXT_DPR)
      textCanvas.width = Math.round(width * scale)
      textCanvas.height = Math.round(height * scale)
      let baselineY = height * 0.45
      let count = 0
      if (textContext) {
        textContext.setTransform(scale, 0, 0, scale, 0, 0)
        textContext.clearRect(0, 0, width, height)
        textContext.fillStyle = '#fff'
        for (const { ref, text } of linesRef.current.slice(0, MAX_LINES)) {
          const el = ref.current
          if (!el) continue
          const box = layoutBoxIn(el, container)
          const style = getComputedStyle(el)
          const fontSize = parseFloat(style.fontSize)
          textContext.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
          textContext.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing
          // Same baseline CSS uses: the font's content area centred in the line box.
          const m = textContext.measureText(text)
          const content = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent
          const baseline = box.top + (box.height - content) / 2 + m.fontBoundingBoxAscent
          textContext.fillText(text, box.left, baseline)
          baselineY = Math.max(baselineY, baseline)
          // The piece's rect in uv (y up), padded for glyph overhang.
          const pad = fontSize * 0.25
          seaUniforms.uRects.value[count].set(
            (box.left - pad) / width,
            1 - (box.top + box.height + pad) / height,
            (box.left + box.width + pad) / width,
            1 - (box.top - pad) / height,
          )
          count++
        }
      }
      seaUniforms.uLineCount.value = count
      textTexture.dispose()
      textTexture = new CanvasTexture(textCanvas)
      seaUniforms.uText.value = textTexture

      // Pitch the camera so the far edge of the sea lands `horizonGap` below the headline.
      const horizon = Math.min(baselineY / height + horizonGap, 0.9)
      blurUniforms.uHorizon.value = horizon
      compositeUniforms.uHorizon.value = horizon
      const ndcHorizon = 1 - 2 * horizon
      const pitch = -Math.atan(CAMERA_HEIGHT / SEA_FAR) - Math.atan(ndcHorizon * tanHalf)
      camera.aspect = width / height
      camera.rotation.set(pitch, 0, 0)
      camera.updateProjectionMatrix()
      camera.updateMatrixWorld()
      viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
      seaUniforms.uViewProjection.value.copy(viewProjection)

      // Start the sheet just below the bottom edge; spread each row a little past the view.
      const bottomRay = Math.max(Math.atan(tanHalf) - pitch, 0.05)
      const nearest = (CAMERA_HEIGHT - AMPLITUDE * 2) / Math.tan(bottomRay)
      seaUniforms.uNear.value = Math.max(nearest * 0.7, 5)
      seaUniforms.uSpread.value = tanHalf * camera.aspect * 1.1
      seaUniforms.uFogNear.value = nearest * 1.6
    }

    const start = performance.now()
    let frame = 0
    const render = (now: number) => {
      frame = 0
      if (exit.get() >= EXIT_FADE[1]) return // fully faded: idle until the hero comes back
      const t = reducedMotion ? FROZEN_TIME : (now - start) / 1000
      seaUniforms.uTime.value = t + 10
      seaUniforms.uAmp.value = AMPLITUDE * (reducedMotion ? 1 : 0.35 + 0.65 * easeOutCubic(t / 2.6))
      seaUniforms.uReflect.value = reducedMotion ? 1 : easeOutCubic((t - 0.5) / 1.6)
      const current = linesRef.current
      for (let i = 0; i < MAX_LINES; i++) seaUniforms.uShifts.value[i] = (current[i]?.shift?.get() ?? 0) / width

      renderer.setRenderTarget(seaTarget)
      renderer.setClearColor(0x000000, 0)
      renderer.clear()
      renderer.render(scene, camera)

      screen.material = blurMaterial
      renderer.setRenderTarget(blurTarget)
      renderer.render(screenScene, screenCamera)

      screen.material = compositeMaterial
      renderer.setRenderTarget(null)
      renderer.render(screenScene, screenCamera)

      if (!reducedMotion) frame = requestAnimationFrame(render)
    }
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(render)
    }

    let layoutFrame = 0
    const relayout = () => {
      cancelAnimationFrame(layoutFrame)
      layoutFrame = requestAnimationFrame(() => {
        layout()
        kick()
      })
    }
    layout()
    kick()
    const resizeObserver = new ResizeObserver(relayout)
    resizeObserver.observe(container)
    document.fonts?.ready.then(relayout, relayout)
    const unsubscribe = exit.on('change', kick)

    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(layoutFrame)
      resizeObserver.disconnect()
      unsubscribe()
      sheet.dispose()
      quad.dispose()
      seaMaterial.dispose()
      blurMaterial.dispose()
      compositeMaterial.dispose()
      textTexture.dispose()
      seaTarget.dispose()
      blurTarget.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [exit, reducedMotion, horizonGap])

  // Outer layer fades with the exit, inner layer fades in once on load; neither is transformed, so the
  // reflection lines up with the DOM headline.
  return (
    <motion.div aria-hidden className={className} style={{ opacity, maskImage: mask, WebkitMaskImage: mask }}>
      <motion.div
        ref={containerRef}
        className="h-full w-full bg-[#0b0a14]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
    </motion.div>
  )
}
