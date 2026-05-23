"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  initWordle, ensureAnswerCached, getAnswerIndex, getWord, pickRandomGuess,
} from "@/lib/wordle-logic";

interface WordleShaderProps {
  src?: string;
  isVideo?: boolean;
  tileGap?: number;
  gameGap?: number;
  cycleInterval?: number;
}

const BG = "#121213";
const COLS = 5;
const ROWS = 6;

const WordleShader: React.FC<WordleShaderProps> = ({
  src,
  isVideo = false,
  tileGap = 2,
  gameGap = 18,
  cycleInterval = 120,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const gamesRef = useRef<{ rows: { gi: number; c: number }[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initWordle().then(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || !src) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const el = isVideo
      ? Object.assign(document.createElement("video"), {
          crossOrigin: "anonymous",
          loop: true,
          muted: true,
          playsInline: true,
          src,
        })
      : Object.assign(new Image(), { crossOrigin: "anonymous", src });

    if (isVideo) {
      (el as HTMLVideoElement).onloadeddata = () => (el as HTMLVideoElement).play();
      for (const e of ["pointerdown", "keydown"] as const)
        document.addEventListener(e, () => {
          if (el instanceof HTMLVideoElement && el.muted) {
            el.muted = false; el.play();
          }
        }, { once: true });
    }

    let active = true;
    let tileSize = 48, step = 50, gw = 0, gh = 0, gpr = 0, gpc = 0, width = 0, height = 0;

    function layout() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width;
      canvas!.height = height;

      const gamesAcross = Math.max(4, Math.floor(width / 120));
      const num = gamesAcross * COLS;
      tileSize = Math.max(8, Math.floor((width - gamesAcross * (COLS - 1) * tileGap - (gamesAcross - 1) * gameGap) / num));
      step = tileSize + tileGap;
      gw = COLS * step - tileGap + gameGap;
      gh = ROWS * step - tileGap + gameGap;
      gpr = Math.max(1, Math.floor((width + gameGap) / gw));
      gpc = Math.max(1, Math.floor((height + gameGap) / gh));
    }

    layout();

    const hidden = document.createElement("canvas");
    const hctx = hidden.getContext("2d")!;

    const cols = ["#3a3a3c", "#b59f3b", "#538d4e"];

    function lum(px: number, py: number, pd: Uint8ClampedArray) {
      const i = (Math.floor(py) * width + Math.floor(px)) * 4;
      return 0.299 * pd[i] + 0.587 * pd[i + 1] + 0.114 * pd[i + 2];
    }

    function tileColor(ox: number, oy: number, pd: Uint8ClampedArray) {
      const l = lum(ox + tileSize / 2, oy + tileSize / 2, pd);
      return l < 0.33 ? 0 : l < 0.66 ? 1 : 2;
    }

    function pattern(ox: number, oy: number, pd: Uint8ClampedArray) {
      let c = 0;
      for (let i = 0; i < COLS; i++)
        c = c * 3 + tileColor(ox + i * step, oy, pd);
      return c;
    }

    function rebuild(pd: Uint8ClampedArray) {
      hidden.width = width; hidden.height = height;
      hctx.drawImage(el, 0, 0, width, height);
      const gs: typeof gamesRef.current = [];
      for (let gi = 0; gi < gpr * gpc; gi++) {
        const gx = gi % gpr;
        const gy = Math.floor(gi / gpr);
        const ai = getAnswerIndex(gi);
        ensureAnswerCached(ai);
        const rows: { gi: number; c: number }[] = [];
        for (let r = 0; r < ROWS; r++) {
          const pc = pattern(gx * gw, gy * gh + r * step, pd);
          rows.push({ gi: pickRandomGuess(ai, pc), c: pc });
        }
        gs.push({ rows });
      }
      gamesRef.current = gs;
    }

    function update(pd: Uint8ClampedArray) {
      for (let gi = 0; gi < gamesRef.current.length; gi++) {
        const g = gamesRef.current[gi];
        const gx = gi % gpr;
        const gy = Math.floor(gi / gpr);
        for (let r = 0; r < ROWS; r++) {
          const pc = pattern(gx * gw, gy * gh + r * step, pd);
          if (pc !== g.rows[r].c)
            g.rows[r] = { gi: pickRandomGuess(getAnswerIndex(gi), pc), c: pc };
        }
      }
    }

    let fn = 0;

    function draw() {
      if (!active) return;
      if (el instanceof HTMLVideoElement && el.readyState < 2) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      layout();
      hidden.width = width; hidden.height = height;
      hctx.drawImage(el, 0, 0, width, height);
      const pd = hctx.getImageData(0, 0, width, height).data;

      if (fn === 0 || fn % cycleInterval === 0) rebuild(pd);
      else update(pd);
      fn++;

      ctx!.fillStyle = BG;
      ctx!.fillRect(0, 0, width, height);
      const fpx = Math.max(8, Math.floor(tileSize * 0.55));

      for (let gi = 0; gi < gamesRef.current.length; gi++) {
        const g = gamesRef.current[gi];
        const gx = gi % gpr;
        const gy = Math.floor(gi / gpr);
        const ox = gx * gw;
        const oy = gy * gh;

        for (let r = 0; r < ROWS; r++) {
          const row = g.rows[r];
          const cs = [0, 0, 0, 0, 0];
          for (let i = COLS - 1, cc = row.c; i >= 0; i--) { cs[i] = cc % 3; cc = Math.floor(cc / 3); }
          const w = row.gi >= 0 ? getWord(row.gi) : null;

          for (let i = 0; i < COLS; i++) {
            const x = ox + i * step;
            const y = oy + r * step;
            ctx!.fillStyle = cols[cs[i]];
            ctx!.fillRect(x + 0.5, y + 0.5, tileSize - 1, tileSize - 1);
            if (w) {
              ctx!.fillStyle = "#fff";
              ctx!.font = `bold ${fpx}px monospace`;
              ctx!.textAlign = "center";
              ctx!.textBaseline = "middle";
              ctx!.fillText(w[i].toUpperCase(), x + tileSize / 2, y + tileSize / 2);
            }
          }
        }
      }
      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    const onResize = () => { /* layout called each frame */ };
    window.addEventListener("resize", onResize);
    return () => { active = false; cancelAnimationFrame(animRef.current); window.removeEventListener("resize", onResize); };
  }, [loading, src, isVideo, tileGap, gameGap, cycleInterval]);

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: BG }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
};

export default WordleShader;

