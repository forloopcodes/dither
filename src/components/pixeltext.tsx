"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type PixelTextProps = {
  src: string;
  isVideo?: boolean;
  pixelSize?: number;
  characters?: string;
  contrast?: number;
  saturation?: number;
  backgroundColor?: string;
};

const DEFAULT_CHARACTERS =
  " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const GEIST_MONO_URL =
  "https://assets.vercel.com/raw/upload/v1730473896/fonts/geist/GeistMono-Regular.woff2";
const GLYPH_BASE_SIZE = 112;

const srgbColorSpace = (THREE as any).SRGBColorSpace;
const hasColorSpaceSupport = srgbColorSpace !== undefined;
const srgbEncoding = (THREE as any).sRGBEncoding;
const hasEncodingSupport = srgbEncoding !== undefined;

function setRendererOutputColorSpace(renderer: THREE.WebGLRenderer) {
  if (hasColorSpaceSupport && "outputColorSpace" in renderer) {
    (renderer as any).outputColorSpace = srgbColorSpace;
  } else if (hasEncodingSupport && "outputEncoding" in renderer) {
    (renderer as any).outputEncoding = srgbEncoding;
  }
}

function setTextureColorSpace(texture: THREE.Texture) {
  if (hasColorSpaceSupport && "colorSpace" in texture) {
    (texture as any).colorSpace = srgbColorSpace;
  } else if (hasEncodingSupport && "encoding" in texture) {
    (texture as any).encoding = srgbEncoding;
  }
}

async function ensureGeistMono() {
  if (typeof document === "undefined") return;
  const fonts = (document as any).fonts as FontFaceSet | undefined;
  if (!fonts) return;

  const probe = `48px "Geist Mono"`;
  if (fonts.check(probe)) {
    return;
  }

  try {
    const fontFace = new FontFace(
      "Geist Mono",
      `url(${GEIST_MONO_URL}) format("woff2")`,
      { weight: "400", style: "normal" }
    );
    const loaded = await fontFace.load();
    fonts.add(loaded);
  } catch (error) {
    console.warn("Could not load Geist Mono font.", error);
  }

  try {
    await fonts.load(probe);
  } catch {
    // Ignore font loading rejections.
  }
}

function createGlyphAtlas(characters: string) {
  const width = characters.length * GLYPH_BASE_SIZE;
  const height = GLYPH_BASE_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to obtain 2D context for glyph atlas.");
  }

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${height * 0.8}px "Geist Mono"`;

  const centerY = height / 2;

  for (let i = 0; i < characters.length; i++) {
    const x = i * GLYPH_BASE_SIZE + GLYPH_BASE_SIZE / 2;
    ctx.fillText(characters[i], x, centerY);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  setTextureColorSpace(texture);

  return texture;
}

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform sampler2D uTexture;
uniform sampler2D uGlyphAtlas;
uniform vec2 uResolution;
uniform vec2 uCellCount;
uniform float uCharCount;
uniform float uContrast;
uniform float uSaturation;
uniform vec3 uBackgroundColor;
uniform vec2 uTextureSize;

varying vec2 vUv;

vec3 applyContrast(vec3 color, float contrast) {
  return (color - 0.5) * contrast + 0.5;
}

vec3 applySaturation(vec3 color, float saturation) {
  float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(luminance), color, saturation);
}

vec2 coverUv(vec2 uv, vec2 textureSize, vec2 resolution) {
  float textureAspect = textureSize.x / textureSize.y;
  float resolutionAspect = resolution.x / resolution.y;

  if (textureAspect > resolutionAspect) {
    float scale = resolutionAspect / textureAspect;
    float y = uv.y * scale + (1.0 - scale) * 0.5;
    return vec2(uv.x, y);
  } else {
    float scale = textureAspect / resolutionAspect;
    float x = uv.x * scale + (1.0 - scale) * 0.5;
    return vec2(x, uv.y);
  }
}

void main() {
  vec2 cellIndex = floor(vUv * uCellCount);
  vec2 cellCenterUv = (cellIndex + 0.5) / uCellCount;
  vec2 sampleUv = coverUv(cellCenterUv, uTextureSize, uResolution);

  vec4 texColor = texture2D(uTexture, sampleUv);
  vec3 color = applySaturation(texColor.rgb, uSaturation);
  color = applyContrast(color, uContrast);
  float luminance = dot(color, vec3(0.299, 0.587, 0.114));
  vec3 softColor = mix(vec3(luminance), color, 0.6);
  vec3 pixelBackground = mix(uBackgroundColor, softColor, 0.65);

  float glyphIndex = clamp(floor((1.0 - luminance) * (uCharCount - 1.0) + 0.5), 0.0, uCharCount - 1.0);

  vec2 localUv = fract(vUv * uCellCount);

  float glyphWidth = 1.0 / uCharCount;
  vec2 atlasUv = vec2(glyphIndex * glyphWidth + localUv.x * glyphWidth, localUv.y);

  float mask = texture2D(uGlyphAtlas, atlasUv).r;
  vec3 finalColor = mix(pixelBackground, color, mask);
  gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
}
`;

export default function PixelText({
  src,
  isVideo = false,
  pixelSize = 24,
  characters = DEFAULT_CHARACTERS,
  contrast = 1.3,
  saturation = 1.0,
  backgroundColor = "#050505",
}: PixelTextProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let material: THREE.ShaderMaterial | null = null;
    let quad: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | null =
      null;
    let videoElement: HTMLVideoElement | null = null;
    let sourceTexture: THREE.Texture | null = null;
    let glyphAtlas: THREE.CanvasTexture | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let resizeHandler: (() => void) | null = null;
    let animationActive = false;
    let disposed = false;
    let unlockAudioHandler: ((event: Event) => void) | null = null;

    const removeAudioUnlock = () => {
      if (!container || !unlockAudioHandler) return;
      container.removeEventListener("pointerdown", unlockAudioHandler);
      window.removeEventListener("keydown", unlockAudioHandler);
      unlockAudioHandler = null;
    };

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const safePixelSize = Math.max(1, pixelSize);
    const init = async () => {
      await ensureGeistMono();
      if (disposed) return;

      const symbolSet = characters.trim().length
        ? characters
        : DEFAULT_CHARACTERS;
      glyphAtlas = createGlyphAtlas(symbolSet);

      renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: "high-performance",
        alpha: false,
      });
      setRendererOutputColorSpace(renderer);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth, container.clientHeight, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.setClearColor(new THREE.Color(backgroundColor), 1);

      container.innerHTML = "";
      container.appendChild(renderer.domElement);

      const uniforms = {
        uTexture: { value: null as THREE.Texture | null },
        uGlyphAtlas: { value: glyphAtlas },
        uResolution: {
          value: new THREE.Vector2(
            container.clientWidth,
            container.clientHeight
          ),
        },
        uCellCount: { value: new THREE.Vector2(1, 1) },
        uCharCount: { value: symbolSet.length },
        uContrast: { value: contrast },
        uSaturation: { value: saturation },
        uBackgroundColor: { value: new THREE.Color(backgroundColor) },
        uTextureSize: { value: new THREE.Vector2(1, 1) },
      };

      material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
      });

      const geometry = new THREE.PlaneGeometry(2, 2);
      quad = new THREE.Mesh(geometry, material);
      scene.add(quad);

      const updateResolution = () => {
        if (!renderer || !material) return;
        const width = container.clientWidth || 1;
        const height = container.clientHeight || 1;

        renderer.setSize(width, height, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        (material.uniforms.uResolution.value as THREE.Vector2).set(
          width,
          height
        );

        const cellsX = Math.max(1, Math.floor(width / safePixelSize));
        const cellsY = Math.max(1, Math.floor(height / safePixelSize));
        (material.uniforms.uCellCount.value as THREE.Vector2).set(
          cellsX,
          cellsY
        );
      };

      updateResolution();

      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(updateResolution);
        resizeObserver.observe(container);
      } else {
        resizeHandler = updateResolution;
        window.addEventListener("resize", resizeHandler);
      }

      const configureTexture = (
        texture: THREE.Texture,
        width: number,
        height: number
      ) => {
        setTextureColorSpace(texture);
        texture.needsUpdate = true;
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        sourceTexture = texture;
        (material!.uniforms.uTexture.value as THREE.Texture | null) =
          sourceTexture;
        (material!.uniforms.uTextureSize.value as THREE.Vector2).set(
          Math.max(1, width),
          Math.max(1, height)
        );
      };

      const startLoop = () => {
        if (!renderer || animationActive) return;
        const activeRenderer = renderer;
        activeRenderer.setAnimationLoop(() => {
          activeRenderer.render(scene, camera);
        });
        animationActive = true;
      };

      if (isVideo) {
        videoElement = document.createElement("video");
        videoElement.src = src;
        videoElement.loop = true;
        videoElement.muted = true;
        videoElement.playsInline = true;
        videoElement.crossOrigin = "anonymous";
        videoElement.preload = "auto";

        const installAudioUnlock = () => {
          if (!container || unlockAudioHandler) return;
          unlockAudioHandler = () => {
            if (!videoElement) return;
            videoElement.muted = false;
            videoElement.volume = 1;
            const resumed = videoElement.play();
            if (resumed && resumed.catch) {
              resumed.catch(() => undefined);
            }
            removeAudioUnlock();
          };
          container.addEventListener("pointerdown", unlockAudioHandler);
          window.addEventListener("keydown", unlockAudioHandler);
        };

        const attemptUnmutedPlayback = () => {
          if (!videoElement) return;
          videoElement.muted = false;
          videoElement.volume = 1;
          const playPromise = videoElement.play();
          if (playPromise && playPromise.catch) {
            playPromise.catch(() => {
              if (!videoElement) return;
              videoElement.muted = true;
              const silentPlay = videoElement.play();
              if (silentPlay && silentPlay.catch) {
                silentPlay.catch(() => undefined);
              }
              installAudioUnlock();
            });
          }
        };

        const handleLoaded = () => {
          if (!videoElement || disposed) return;

          const videoTexture = new THREE.VideoTexture(videoElement);
          configureTexture(
            videoTexture,
            videoElement.videoWidth || 1,
            videoElement.videoHeight || 1
          );
          startLoop();
          removeAudioUnlock();
          attemptUnmutedPlayback();
        };

        videoElement.addEventListener("loadeddata", handleLoaded, {
          once: true,
        });
        videoElement.addEventListener("error", () => {
          console.error("PixelText: failed to load video source:", src);
        });

        videoElement.load();
      } else {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin("anonymous");
        loader.load(
          src,
          (texture) => {
            if (disposed) {
              texture.dispose();
              return;
            }
            const image = texture.image as { width?: number; height?: number };
            configureTexture(texture, image?.width ?? 1, image?.height ?? 1);
            startLoop();
          },
          undefined,
          (error) => {
            console.error(
              "PixelText: failed to load image source:",
              src,
              error
            );
          }
        );
      }
    };

    init();

    return () => {
      disposed = true;

      removeAudioUnlock();

      if (animationActive && renderer) {
        renderer.setAnimationLoop(null);
        animationActive = false;
      }

      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }

      if (resizeHandler) {
        window.removeEventListener("resize", resizeHandler);
        resizeHandler = null;
      }

      if (videoElement) {
        videoElement.pause();
        videoElement.src = "";
        videoElement.load();
        videoElement = null;
      }

      if (sourceTexture) {
        sourceTexture.dispose();
        sourceTexture = null;
      }

      if (glyphAtlas) {
        glyphAtlas.dispose();
        glyphAtlas = null;
      }

      if (quad) {
        scene.remove(quad);
        quad.geometry.dispose();
        quad = null;
      }

      if (material) {
        material.dispose();
        material = null;
      }

      if (renderer) {
        renderer.dispose();
        const canvas = renderer.domElement;
        if (canvas && canvas.parentElement === container) {
          container.removeChild(canvas);
        }
        renderer = null;
      }
    };
  }, [
    src,
    isVideo,
    pixelSize,
    characters,
    contrast,
    saturation,
    backgroundColor,
  ]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
    />
  );
}
