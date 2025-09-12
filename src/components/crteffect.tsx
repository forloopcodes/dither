"use client";

import React, { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, extend, useThree } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";

// CRT Shader Material
const CRTMaterial = shaderMaterial(
  {
    uTexture: null,
    uTime: 0,
    uResolution: new THREE.Vector2(1, 1),
    uCurvature: 0.1,
    uScanlines: 0.04,
    uGlow: 0.6,
    uBrightness: 1.2,
    uContrast: 1.1,
    uNoise: 0.1,
    uVignette: 0.3,
    uChromaticAberration: 0.002,
    uScanlineSpeed: 1.0,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uCurvature;
    uniform float uScanlines;
    uniform float uGlow;
    uniform float uBrightness;
    uniform float uContrast;
    uniform float uNoise;
    uniform float uVignette;
    uniform float uChromaticAberration;
    uniform float uScanlineSpeed;
    
    varying vec2 vUv;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    void main() {
      vec2 screenPos = vUv;
      
      // Base color with chromatic aberration
      vec2 aberration = vec2(uChromaticAberration) * (screenPos - 0.5);
      vec4 color;
      color.r = texture2D(uTexture, screenPos + aberration).r;
      color.g = texture2D(uTexture, screenPos).g;
      color.b = texture2D(uTexture, screenPos - aberration).b;
      color.a = 1.0;
      
      // Animated scanlines
      float animatedY = screenPos.y + uTime * uScanlineSpeed * 0.1;
      float scanline = sin(animatedY * 800.0) * 0.15;
      color.rgb -= scanline;
      
      // Phosphor glow
      vec3 glow = color.rgb;
      for (int i = 1; i <= 3; i++) {
        float offset = float(i) * 0.003;
        glow += texture2D(uTexture, screenPos + vec2(offset, 0.0)).rgb * 0.4;
        glow += texture2D(uTexture, screenPos - vec2(offset, 0.0)).rgb * 0.4;
      }
      color.rgb = mix(color.rgb, glow, uGlow);
      
      // Noise
      float noise = random(screenPos + fract(uTime * 0.01)) * uNoise;
      color.rgb += noise;
      
      // Brightness and contrast
      color.rgb = ((color.rgb - 0.5) * uContrast + 0.5) * uBrightness;
      
      // Vignette
      vec2 center = screenPos - 0.5;
      float vignette = 1.0 - dot(center, center) * uVignette;
      color.rgb *= vignette;
      
      // Flicker
      float flicker = 0.95 + 0.05 * sin(110.0 * uTime);
      color.rgb *= flicker;
      
      gl_FragColor = color;
    }
  `
);

// Extend Three.js with our custom material
extend({ CRTMaterial });

// TypeScript declaration for the custom material
declare module "@react-three/fiber" {
  interface ThreeElements {
    cRTMaterial: any;
  }
}

function CRTScreen({ texture, scanlineSpeed = 1.0, ...props }: any) {
  const materialRef = useRef<any>(null);
  const { size, viewport } = useThree();

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      materialRef.current.uResolution.set(size.width, size.height);
      materialRef.current.uScanlineSpeed = scanlineSpeed;
    }
  });

  // Calculate aspect ratio to fill screen
  const aspect = size.width / size.height;
  const scale = Math.max(viewport.width, viewport.height);

  return (
    <mesh scale={[scale * aspect, scale, 1]}>
      <planeGeometry args={[1, 1]} />
      <cRTMaterial ref={materialRef} uTexture={texture} {...props} />
    </mesh>
  );
}

interface CRTEffectProps {
  children: React.ReactNode;
  curvature?: number;
  scanlines?: number;
  glow?: number;
  brightness?: number;
  contrast?: number;
  noise?: number;
  vignette?: number;
  chromaticAberration?: number;
  scanlineSpeed?: number;
}

export default function CRTEffect({
  children,
  curvature = 0.15,
  scanlines = 0.04,
  glow = 0.6,
  brightness = 1.2,
  contrast = 1.1,
  noise = 0.05,
  vignette = 0.3,
  chromaticAberration = 0.003,
  scanlineSpeed = 1.0,
}: CRTEffectProps) {
  const hiddenContainerRef = useRef<HTMLDivElement>(null);
  const visibleContainerRef = useRef<HTMLDivElement>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const [contentTexture, setContentTexture] =
    useState<THREE.CanvasTexture | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 1920, height: 1080 });

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update window size
  useEffect(() => {
    if (!isClient) return;

    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [isClient]);

  useEffect(() => {
    if (!isClient || !visibleContainerRef.current) return;

    const captureContent = async () => {
      const container = visibleContainerRef.current!;

      try {
        // Create a canvas with dynamic size based on window
        const canvas = document.createElement("canvas");
        canvas.width = windowSize.width;
        canvas.height = windowSize.height;
        const ctx = canvas.getContext("2d")!;

        // Clear canvas with black background
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Get container bounds
        const rect = container.getBoundingClientRect();

        // Render DOM elements recursively
        await renderElement(ctx, container, rect);

        // Create or update texture
        if (!textureRef.current) {
          textureRef.current = new THREE.CanvasTexture(canvas);
          textureRef.current.flipY = true;
          setContentTexture(textureRef.current);
        } else {
          textureRef.current.needsUpdate = true;
        }
      } catch (error) {
        console.error("Error capturing content:", error);

        // Fallback to simple text rendering
        const canvas = document.createElement("canvas");
        canvas.width = windowSize.width;
        canvas.height = windowSize.height;
        const ctx = canvas.getContext("2d")!;

        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 48px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          container.textContent || "Content",
          canvas.width / 2,
          canvas.height / 2
        );

        if (!textureRef.current) {
          textureRef.current = new THREE.CanvasTexture(canvas);
          textureRef.current.flipY = true;
          setContentTexture(textureRef.current);
        } else {
          textureRef.current.needsUpdate = true;
        }
      }
    };

    // Function to render DOM elements to canvas
    const renderElement = async (
      ctx: CanvasRenderingContext2D,
      element: Element,
      containerRect: DOMRect
    ) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);

      // Calculate position relative to container
      const x = rect.left - containerRect.left;
      const y = rect.top - containerRect.top;

      // Handle different element types
      if (element.tagName === "IMG") {
        const img = element as HTMLImageElement;
        if (img.complete && img.naturalWidth > 0) {
          try {
            // Draw the image directly without color modification
            ctx.drawImage(img, x, y, rect.width, rect.height);
          } catch (e) {
            // Fallback: draw a placeholder rectangle
            ctx.fillStyle = "#666666";
            ctx.fillRect(x, y, rect.width, rect.height);
            ctx.fillStyle = "#ffffff";
            ctx.font = "12px sans-serif";
            ctx.fillText("[IMAGE]", x + 10, y + 20);
          }
        }
      } else if (element.textContent && element.children.length === 0) {
        // Text node - preserve original color
        const text = element.textContent.trim();
        if (text) {
          ctx.fillStyle = style.color || "#ffffff";
          ctx.font = `${parseInt(style.fontSize) || 16}px ${
            style.fontFamily || "sans-serif"
          }`;
          ctx.fillText(text, x, y + rect.height / 2);
        }
      }

      // Recursively render children
      for (const child of Array.from(element.children)) {
        await renderElement(ctx, child, containerRect);
      }
    };

    captureContent();

    // Update periodically to catch content changes
    const interval = setInterval(captureContent, 500);

    return () => clearInterval(interval);
  }, [children, isClient, windowSize]);

  const defaultTexture = useMemo(() => {
    if (!isClient) return null;

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.flipY = true;
    return texture;
  }, [isClient]);

  // Don't render Three.js on server side
  if (!isClient) {
    return (
      <div className="relative w-full h-full bg-black overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* Visible container to capture children content */}
      <div
        ref={visibleContainerRef}
        className="absolute inset-0 opacity-0 pointer-events-none z-0 w-full h-full"
        style={{
          padding: "20px",
        }}
      >
        {children}
      </div>

      {/* CRT Effect applied to captured content */}
      <Canvas
        className="absolute inset-0 z-10 w-full h-full"
        gl={{ alpha: false, antialias: false }}
        camera={{ position: [0, 0, 1], fov: 75 }}
        style={{ width: "100vw", height: "100vh" }}
      >
        <CRTScreen
          texture={contentTexture || defaultTexture}
          uCurvature={0}
          uScanlines={scanlines}
          uGlow={glow}
          uBrightness={brightness}
          uContrast={contrast}
          uNoise={noise}
          uVignette={vignette}
          uChromaticAberration={chromaticAberration}
          scanlineSpeed={scanlineSpeed}
        />
      </Canvas>

      {/* Interactive overlay for mouse events */}
      <div
        className="absolute inset-0 z-20 pointer-events-auto w-full h-full"
        style={{
          background: "transparent",
        }}
      >
        {/* This div captures mouse events but is invisible */}
      </div>
    </div>
  );
}
