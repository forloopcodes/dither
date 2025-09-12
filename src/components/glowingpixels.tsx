"use client";

import React, { useRef, useEffect, useState } from "react";

interface GlowingPixelsProps {
  src?: string;
  isVideo?: boolean;
  pixelSize?: number;
  width?: number;
  height?: number;
  glowAmount?: number;
  muted?: boolean; // New prop to control audio
}

const GlowingPixels: React.FC<GlowingPixelsProps> = ({
  src,
  isVideo = false,
  pixelSize = 4,
  width = 800,
  height = 600,
  glowAmount = 2,
  muted = false, // Default to false for sound
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [sourceElement, setSourceElement] = useState<
    HTMLImageElement | HTMLVideoElement | null
  >(null);

  useEffect(() => {
    if (!src) return;

    if (isVideo) {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.loop = true;
      video.muted = muted; // Use the muted prop
      video.playsInline = true;
      video.controls = false; // Hide controls for cleaner look

      // Handle user interaction for unmuted videos
      const playVideo = async () => {
        try {
          await video.play();
          setSourceElement(video);
        } catch (error) {
          console.log("Video autoplay failed, user interaction required");
          // Create a play button overlay
          const playButton = document.createElement("button");
          playButton.textContent = "▶ Click to Play";
          playButton.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
            padding: 20px 40px;
            font-size: 24px;
            background: rgba(0,0,0,0.8);
            color: white;
            border: 2px solid white;
            cursor: pointer;
            border-radius: 10px;
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

      video.onerror = (e) => {
        console.error("Video loading error:", e);
      };

      video.src = src;
    } else {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        setSourceElement(img);
      };

      img.onerror = () => {
        console.error("Image loading error");
      };

      img.src = src;
    }
  }, [src, isVideo, muted]);

  useEffect(() => {
    if (!sourceElement || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      // Clear canvas
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, width, height);

      // Calculate grid
      const cols = Math.floor(width / pixelSize);
      const rows = Math.floor(height / pixelSize);

      // Create temporary canvas to sample colors
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;

      tempCanvas.width = cols;
      tempCanvas.height = rows;

      // Handle video element specifically
      if (sourceElement instanceof HTMLVideoElement) {
        // Check if video is ready to draw
        if (sourceElement.readyState >= 2) {
          tempCtx.drawImage(sourceElement, 0, 0, cols, rows);
        }
      } else {
        tempCtx.drawImage(sourceElement, 0, 0, cols, rows);
      }

      const imageData = tempCtx.getImageData(0, 0, cols, rows);

      // Draw pixels with glow
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const index = (y * cols + x) * 4;
          const r = imageData.data[index];
          const g = imageData.data[index + 1];
          const b = imageData.data[index + 2];

          // Skip very dark pixels
          if (r + g + b < 30) continue;

          const pixelX = x * pixelSize;
          const pixelY = y * pixelSize;

          // Draw glow effect
          if (glowAmount > 0) {
            const gradient = ctx.createRadialGradient(
              pixelX + pixelSize / 2,
              pixelY + pixelSize / 2,
              0,
              pixelX + pixelSize / 2,
              pixelY + pixelSize / 2,
              pixelSize * glowAmount
            );

            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

            ctx.fillStyle = gradient;
            ctx.fillRect(
              pixelX - pixelSize * (glowAmount - 1),
              pixelY - pixelSize * (glowAmount - 1),
              pixelSize * glowAmount * 2,
              pixelSize * glowAmount * 2
            );
          }

          // Draw core pixel
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(pixelX, pixelY, pixelSize, pixelSize);
        }
      }

      // Always continue animation for smooth rendering
      animationRef.current = requestAnimationFrame(render);
    };

    // Start the animation loop
    render();

    // Cleanup function
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [sourceElement, pixelSize, width, height, glowAmount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Cleanup video element
      if (sourceElement instanceof HTMLVideoElement) {
        sourceElement.pause();
        sourceElement.src = "";
      }
    };
  }, [sourceElement]);

  return (
    <div
      style={{ width, height, backgroundColor: "black", position: "relative" }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default GlowingPixels;
