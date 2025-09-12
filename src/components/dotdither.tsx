"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";

interface DotDitherProps {
  src?: string; // Image source URL
  dotSpacing?: number;
  animationSpeed?: number;
  waveAmplitude?: number;
  waveFrequency?: number;
  wavelength?: number;
  minDotSize?: number;
  maxDotSize?: number;
  useImageColors?: boolean;
  color?: string;
  width?: number;
  height?: number;
  glowIntensity?: number;
  cursorWaveIntensity?: number;
}

const DotDither: React.FC<DotDitherProps> = ({
  src,
  dotSpacing = 8,
  animationSpeed = 1,
  waveAmplitude = 3,
  waveFrequency = 0.01,
  wavelength = 200,
  minDotSize = 0,
  maxDotSize = 8,
  useImageColors = true,
  color = "#00ffff",
  width = 800,
  height = 600,
  glowIntensity = 0.5,
  cursorWaveIntensity = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const dotsRef = useRef<THREE.Object3D[]>([]);
  const animationRef = useRef<number | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const initThreeJS = () => {
    if (!canvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
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
    if (!imageData) return 0.5;

    const pixelIndex = (Math.floor(y) * width + Math.floor(x)) * 4;
    const r = imageData.data[pixelIndex] || 0;
    const g = imageData.data[pixelIndex + 1] || 0;
    const b = imageData.data[pixelIndex + 2] || 0;

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
    const x = event.clientX - rect.left - width / 2;
    const y = -(event.clientY - rect.top - height / 2);
    setCursorPos({ x, y });
  };

  const createDots = () => {
    if (!sceneRef.current) return;

    // Clear existing dots
    dotsRef.current.forEach((dot) => {
      sceneRef.current?.remove(dot);
    });
    dotsRef.current = [];

    const numDotsX = Math.floor(width / dotSpacing);
    const numDotsY = Math.floor(height / dotSpacing);

    for (let i = 0; i < numDotsY; i++) {
      for (let j = 0; j < numDotsX; j++) {
        const x = (j / numDotsX) * width - width / 2;
        const y = (i / numDotsY) * height - height / 2;

        const actualX = j * dotSpacing;
        const actualY = height - i * dotSpacing;

        const brightness = getBrightness(actualX, actualY);
        const dotSize = brightness * (maxDotSize - minDotSize) + minDotSize;

        // Skip rendering if dot size is too small
        if (dotSize <= 0) continue;

        const pixelColor = useImageColors
          ? getPixelColor(actualX, actualY)
          : new THREE.Color(color);

        // Create dot geometry
        const geometry = new THREE.CircleGeometry(dotSize / 2, 8);
        const material = new THREE.MeshBasicMaterial({
          color: pixelColor,
          transparent: false,
        });

        const dot = new THREE.Mesh(geometry, material);
        dot.position.set(x, y, 0);

        // Store original data for animation
        (dot as any).originalX = x;
        (dot as any).originalY = y;
        (dot as any).dotIndex = i * numDotsX + j;
        (dot as any).originalSize = dotSize / 2;

        sceneRef.current?.add(dot);
        dotsRef.current.push(dot);
      }
    }
  };

  const animate = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    const time = Date.now() * 0.001 * animationSpeed;

    // Animate dots with wave effect and cursor interaction
    dotsRef.current.forEach((dot) => {
      const dotData = dot as any;
      const originalX = dotData.originalX;
      const originalY = dotData.originalY;

      // Wave animations
      const waveOffsetX =
        Math.sin(time + dotData.dotIndex * 0.01) * (waveAmplitude * 0.3);
      const waveOffsetY =
        Math.sin(time + dotData.dotIndex * 0.015) * (waveAmplitude * 0.3);

      const rippleX =
        Math.sin(time * 2 + (originalX * Math.PI * 2) / wavelength) *
        (waveAmplitude * 0.2);
      const rippleY =
        Math.sin(time * 2 + (originalY * Math.PI * 2) / wavelength) *
        (waveAmplitude * 0.2);

      // Cursor-based wave effect
      const distanceFromCursor = Math.sqrt(
        Math.pow(originalX - cursorPos.x, 2) +
          Math.pow(originalY - cursorPos.y, 2)
      );
      const cursorInfluence = Math.max(0, 1 - distanceFromCursor / 150);
      const cursorWaveX =
        Math.sin(time * 3 - distanceFromCursor * 0.02) *
        cursorInfluence *
        cursorWaveIntensity;
      const cursorWaveY =
        Math.cos(time * 3 - distanceFromCursor * 0.02) *
        cursorInfluence *
        cursorWaveIntensity;

      // Update position
      (dot as THREE.Mesh).position.x =
        originalX + waveOffsetX + rippleX + cursorWaveX;
      (dot as THREE.Mesh).position.y =
        originalY + waveOffsetY + rippleY + cursorWaveY;

      // Animate size based on wave
      const sizeWave = 1 + Math.sin(time * 2 + dotData.dotIndex * 0.1) * 0.2;
      (dot as THREE.Mesh).scale.setScalar(sizeWave);
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
      createDots();
    }
  }, [
    isReady,
    dotSpacing,
    useImageColors,
    color,
    minDotSize,
    maxDotSize,
    imageData,
  ]);

  useEffect(() => {
    if (isReady && dotsRef.current.length > 0) {
      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isReady, animationSpeed, waveAmplitude, waveFrequency, wavelength]);

  return (
    <div
      style={{
        position: "relative",
        width: `${width}px`,
        height: `${height}px`,
        overflow: "hidden",
        backgroundColor: "black",
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
          backgroundColor: "black",
        }}
      />
    </div>
  );
};

export default DotDither;
