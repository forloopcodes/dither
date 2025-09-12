"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";

interface LineDitherProps {
  src?: string; // Image source URL
  lineSpacing?: number;
  animationSpeed?: number;
  waveAmplitude?: number;
  waveFrequency?: number;
  waveLineFrequency?: number; // New prop for line wave frequency
  wavelength?: number; // New prop for wavelength
  minLineWidth?: number;
  maxLineWidth?: number;
  useImageColors?: boolean;
  color?: string;
  width?: number;
  height?: number;
  glowIntensity?: number;
  cursorWaveIntensity?: number;
  lineDirection?: "horizontal" | "vertical" | "both";
}

const LineDither: React.FC<LineDitherProps> = ({
  src,
  lineSpacing = 5,
  animationSpeed = 1,
  waveAmplitude = 10,
  waveFrequency = 0.01,
  waveLineFrequency = 0.2, // Default line wave frequency
  wavelength = 200, // Default wavelength
  minLineWidth = 0.5,
  maxLineWidth = 4,
  useImageColors = true,
  color = "#00ffff",
  width = 800,
  height = 600,
  glowIntensity = 0.5,
  cursorWaveIntensity = 0,
  lineDirection = "horizontal",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const linesRef = useRef<THREE.Object3D[]>([]);
  const animationRef = useRef<number | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const initThreeJS = () => {
    if (!canvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Changed to black background
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      1,
      1000
    );
    camera.position.z = 100;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;

    setIsReady(true);
  };

  const loadImage = async () => {
    if (!src) return;

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = width;
        canvas.height = height;

        // Draw and scale image to canvas size
        ctx.drawImage(img, 0, 0, width, height);
        const data = ctx.getImageData(0, 0, width, height);
        setImageData(data);
      };

      img.src = src;
    } catch (error) {
      console.error("Error loading image:", error);
    }
  };

  const getBrightness = (x: number, y: number): number => {
    if (!imageData) return 0.5; // Default brightness

    const pixelIndex = (Math.floor(y) * width + Math.floor(x)) * 4;
    const r = imageData.data[pixelIndex] || 0;
    const g = imageData.data[pixelIndex + 1] || 0;
    const b = imageData.data[pixelIndex + 2] || 0;

    // Calculate brightness (0 to 1)
    return (r + g + b) / (3 * 255);
  };

  const getPixelColor = (x: number, y: number): THREE.Color => {
    if (!imageData) return new THREE.Color(color);

    const pixelIndex = (Math.floor(y) * width + Math.floor(x)) * 4;
    const r = (imageData.data[pixelIndex] || 0) / 255;
    const g = (imageData.data[pixelIndex + 1] || 0) / 255;
    const b = (imageData.data[pixelIndex + 2] || 0) / 255;

    return new THREE.Color(r, g, b);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - width / 2; // Center coordinates
    const y = -(event.clientY - rect.top - height / 2); // Flip Y and center
    setCursorPos({ x, y });
  };

  const createLines = () => {
    if (!sceneRef.current) return;

    // Clear existing lines
    linesRef.current.forEach((line) => {
      sceneRef.current?.remove(line);
    });
    linesRef.current = [];

    if (lineDirection === "horizontal" || lineDirection === "both") {
      createHorizontalLines();
    }
    if (lineDirection === "vertical" || lineDirection === "both") {
      createVerticalLines();
    }
  };

  const createHorizontalLines = () => {
    const numLines = Math.floor(height / lineSpacing);

    // Create horizontal lines with variable thickness
    for (let i = 0; i < numLines; i++) {
      const y = (i / numLines) * height - height / 2;
      const actualY = height - i * lineSpacing;

      const geometry = new THREE.BufferGeometry();
      const positions: number[] = [];
      const colors: number[] = [];

      // Higher resolution for smooth curves
      const segments = width; // 1 point per pixel for smooth lines
      for (let j = 0; j < segments; j++) {
        const x1 = (j / segments) * width - width / 2;
        const x2 = ((j + 1) / segments) * width - width / 2;

        const imageX = (j / segments) * width;
        const brightness = getBrightness(imageX, actualY);

        // Calculate thickness with proper range mapping
        const thickness =
          brightness * (maxLineWidth - minLineWidth) + minLineWidth;

        // Skip rendering if thickness is too small (effectively invisible)
        if (thickness <= 0) continue;

        const pixelColor = useImageColors
          ? getPixelColor(imageX, actualY)
          : new THREE.Color(color);

        // Create thick line as multiple thin lines for smoothness
        const lineCount = Math.max(1, Math.ceil(Math.abs(thickness) * 2));
        for (let k = 0; k < lineCount; k++) {
          const offsetY = y + (k / lineCount - 0.5) * Math.abs(thickness);

          positions.push(x1, offsetY, 0);
          positions.push(x2, offsetY, 0);

          colors.push(pixelColor.r, pixelColor.g, pixelColor.b);
          colors.push(pixelColor.r, pixelColor.g, pixelColor.b);
        }
      }

      // Only create line if we have positions (some segments had thickness > 0)
      if (positions.length === 0) continue;

      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3)
      );

      geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(colors, 3)
      );

      const material = createGlowMaterial();
      const line = new THREE.LineSegments(geometry, material);

      // Store original data for animation
      (line as any).originalY = y;
      (line as any).lineIndex = i;
      (line as any).originalPositions = [...positions];
      (line as any).isHorizontal = true;

      sceneRef.current?.add(line);
      linesRef.current.push(line);
    }
  };

  const createVerticalLines = () => {
    const numLines = Math.floor(width / lineSpacing);

    // Create vertical lines with variable thickness
    for (let i = 0; i < numLines; i++) {
      const x = (i / numLines) * width - width / 2;
      const actualX = i * lineSpacing;

      const geometry = new THREE.BufferGeometry();
      const positions: number[] = [];
      const colors: number[] = [];

      // Higher resolution for smooth curves
      const segments = height; // 1 point per pixel for smooth lines
      for (let j = 0; j < segments; j++) {
        const y1 = (j / segments) * height - height / 2;
        const y2 = ((j + 1) / segments) * height - height / 2;

        const imageY = height - (j / segments) * height;
        const brightness = getBrightness(actualX, imageY);

        // Calculate thickness with proper range mapping
        const thickness =
          brightness * (maxLineWidth - minLineWidth) + minLineWidth;

        // Skip rendering if thickness is too small (effectively invisible)
        if (thickness <= 0) continue;

        const pixelColor = useImageColors
          ? getPixelColor(actualX, imageY)
          : new THREE.Color(color);

        // Create thick line as multiple thin lines for smoothness
        const lineCount = Math.max(1, Math.ceil(Math.abs(thickness) * 2));
        for (let k = 0; k < lineCount; k++) {
          const offsetX = x + (k / lineCount - 0.5) * Math.abs(thickness);

          positions.push(offsetX, y1, 0);
          positions.push(offsetX, y2, 0);

          colors.push(pixelColor.r, pixelColor.g, pixelColor.b);
          colors.push(pixelColor.r, pixelColor.g, pixelColor.b);
        }
      }

      // Only create line if we have positions (some segments had thickness > 0)
      if (positions.length === 0) continue;

      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3)
      );

      geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(colors, 3)
      );

      const material = createGlowMaterial();
      const line = new THREE.LineSegments(geometry, material);

      // Store original data for animation
      (line as any).originalX = x;
      (line as any).lineIndex = i + 1000; // Offset to distinguish from horizontal
      (line as any).originalPositions = [...positions];
      (line as any).isHorizontal = false;

      sceneRef.current?.add(line);
      linesRef.current.push(line);
    }
  };

  const createGlowMaterial = () => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(color) },
        glowIntensity: { value: glowIntensity },
        useVertexColors: { value: useImageColors },
      },
      vertexShader: `
        attribute vec3 color;
        varying vec3 vColor;
        varying vec3 vPosition;
        
        void main() {
          vColor = color;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float glowIntensity;
        uniform bool useVertexColors;
        varying vec3 vColor;
        varying vec3 vPosition;
        
        void main() {
          vec3 finalColor = useVertexColors ? vColor : color;
          
          // For white background, we need normal blending
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      transparent: false, // Changed from true
      blending: THREE.NormalBlending, // Changed from AdditiveBlending
    });
  };

  const animate = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    const time = Date.now() * 0.001 * animationSpeed;

    // Animate lines with wave effect and cursor interaction
    linesRef.current.forEach((line) => {
      const lineData = line as any;
      const positions = (line as THREE.LineSegments).geometry.attributes
        .position.array as Float32Array;
      const originalPositions = lineData.originalPositions;

      // Apply wave animation
      for (let i = 0; i < positions.length; i += 3) {
        const x = originalPositions[i];
        const y = originalPositions[i + 1];

        if (lineData.isHorizontal) {
          // Horizontal line animation with wavelength
          const waveOffset =
            Math.sin(time + lineData.lineIndex * waveLineFrequency) *
            (waveAmplitude * 0.5);
          const ripple =
            Math.sin(time * 2 + (x * Math.PI * 2) / wavelength) *
            (waveAmplitude * 0.3);

          // Cursor-based wave effect
          const distanceFromCursor = Math.sqrt(
            Math.pow(x - cursorPos.x, 2) + Math.pow(y - cursorPos.y, 2)
          );
          const cursorInfluence = Math.max(0, 1 - distanceFromCursor / 150);
          const cursorWave =
            Math.sin(time * 3 - distanceFromCursor * 0.02) *
            cursorInfluence *
            cursorWaveIntensity;

          positions[i + 1] = y + waveOffset + ripple + cursorWave;
        } else {
          // Vertical line animation with wavelength
          const waveOffset =
            Math.sin(time + lineData.lineIndex * waveLineFrequency) *
            (waveAmplitude * 0.5);
          const ripple =
            Math.sin(time * 2 + (y * Math.PI * 2) / wavelength) *
            (waveAmplitude * 0.3);

          // Cursor-based wave effect
          const distanceFromCursor = Math.sqrt(
            Math.pow(x - cursorPos.x, 2) + Math.pow(y - cursorPos.y, 2)
          );
          const cursorInfluence = Math.max(0, 1 - distanceFromCursor / 150);
          const cursorWave =
            Math.sin(time * 3 - distanceFromCursor * 0.02) *
            cursorInfluence *
            cursorWaveIntensity;

          positions[i] = x + waveOffset + ripple + cursorWave;
        }
      }

      (line as THREE.LineSegments).geometry.attributes.position.needsUpdate =
        true;
    });

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    initThreeJS();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (src) {
      loadImage();
    }
  }, [src]);

  useEffect(() => {
    if (isReady) {
      createLines();
    }
  }, [
    isReady,
    lineSpacing,
    useImageColors,
    color,
    minLineWidth,
    maxLineWidth,
    imageData,
    lineDirection,
  ]);

  useEffect(() => {
    if (isReady && linesRef.current.length > 0) {
      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    isReady,
    animationSpeed,
    waveAmplitude,
    waveFrequency,
    waveLineFrequency,
    wavelength,
  ]);

  return (
    <div
      style={{
        position: "relative",
        width: `${width}px`,
        height: `${height}px`,
        overflow: "hidden",
        backgroundColor: "black", // Add white background to container
      }}
      onMouseMove={handleMouseMove}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "block",
          filter: `blur(0.5px) brightness(${1 + glowIntensity})`,
          backgroundColor: "black", // Add white background to canvas
        }}
      />
    </div>
  );
};

export default LineDither;
