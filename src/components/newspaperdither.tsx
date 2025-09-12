"use client";

import React, { useRef, useEffect, useState } from "react";

interface NewspaperDitherProps {
  src?: string;
  isVideo?: boolean;
  dotDistance?: number;
  minDotSize?: number;
  maxDotSize?: number;
  width?: number;
  height?: number;
  saturation?: number;
  contrast?: number;
  color?: string;
}

const NewspaperDither: React.FC<NewspaperDitherProps> = ({
  src,
  isVideo = false,
  dotDistance = 6,
  minDotSize = 0,
  maxDotSize = 4,
  width = 800,
  height = 600,
  saturation = 0.8,
  contrast = 1.2,
  color = "#2a2a2a",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [sourceElement, setSourceElement] = useState<
    HTMLImageElement | HTMLVideoElement | null
  >(null);

  // Load source content
  useEffect(() => {
    if (!src) return;

    if (isVideo) {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.loop = true;
      video.muted = false;
      video.playsInline = true;

      const playVideo = async () => {
        try {
          await video.play();
          setSourceElement(video);
        } catch (error) {
          const playButton = document.createElement("button");
          playButton.textContent = "▶ Play";
          playButton.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
            padding: 15px 30px;
            font-size: 18px;
            background: #000000;
            color: #ffffff;
            border: 2px solid #ffffff;
            cursor: pointer;
          `;

          playButton.onclick = async () => {
            try {
              await video.play();
              playButton.remove();
              setSourceElement(video);
            } catch (e) {
              console.error("Failed to play video:", e);
            }
          };

          document.body.appendChild(playButton);
        }
      };

      video.onloadeddata = () => {
        playVideo();
      };

      video.src = src;
    } else {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        setSourceElement(img);
      };

      img.src = src;
    }
  }, [src, isVideo]);

  // Main rendering function
  useEffect(() => {
    if (!sourceElement || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      // Clear canvas with paper color
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // Sample source content
      const sampleCanvas = document.createElement("canvas");
      const sampleCtx = sampleCanvas.getContext("2d");
      if (!sampleCtx) return;

      sampleCanvas.width = width;
      sampleCanvas.height = height;

      if (sourceElement instanceof HTMLVideoElement) {
        if (sourceElement.readyState >= 2) {
          sampleCtx.drawImage(sourceElement, 0, 0, width, height);
        }
      } else {
        sampleCtx.drawImage(sourceElement, 0, 0, width, height);
      }

      const imageData = sampleCtx.getImageData(0, 0, width, height);

      // Draw halftone dots
      for (let gridY = 0; gridY < height; gridY += dotDistance) {
        for (let gridX = 0; gridX < width; gridX += dotDistance) {
          // Sample luminance at this position
          const sampleX = Math.floor(gridX);
          const sampleY = Math.floor(gridY);

          if (
            sampleX >= 0 &&
            sampleX < width &&
            sampleY >= 0 &&
            sampleY < height
          ) {
            const pixelIndex = (sampleY * width + sampleX) * 4;
            const r = imageData.data[pixelIndex] / 255;
            const g = imageData.data[pixelIndex + 1] / 255;
            const b = imageData.data[pixelIndex + 2] / 255;

            // Calculate luminance
            let luminance = 0.299 * r + 0.587 * g + 0.114 * b;

            // Apply contrast
            luminance = Math.pow(luminance, 1 / contrast);
            luminance = Math.max(0, Math.min(1, luminance));

            // Calculate dot size (inverted for newspaper effect)
            let dotSize =
              (1 - luminance) * (maxDotSize - minDotSize) + minDotSize;

            // Skip very small dots
            if (dotSize <= 0.1) continue;

            // Apply saturation to color
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            const finalR = Math.floor(255 * (gray + (r - gray) * saturation));
            const finalG = Math.floor(255 * (gray + (g - gray) * saturation));
            const finalB = Math.floor(255 * (gray + (b - gray) * saturation));

            // Draw dot
            ctx.fillStyle = `rgb(${Math.max(
              0,
              Math.min(255, finalR)
            )}, ${Math.max(0, Math.min(255, finalG))}, ${Math.max(
              0,
              Math.min(255, finalB)
            )})`;
            ctx.beginPath();
            ctx.arc(gridX, gridY, dotSize, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Continue animation for video
      if (isVideo && sourceElement instanceof HTMLVideoElement) {
        animationRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    sourceElement,
    dotDistance,
    minDotSize,
    maxDotSize,
    width,
    height,
    saturation,
    contrast,
    color,
    isVideo,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (sourceElement instanceof HTMLVideoElement) {
        sourceElement.pause();
        sourceElement.src = "";
      }
    };
  }, [sourceElement]);

  return (
    <div style={{ width, height, backgroundColor: "#000000" }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default NewspaperDither;
