"use client";

import { useRef, useEffect, forwardRef, useState } from "react";
import { createNoise2D } from "simplex-noise";

interface GradientCanvasProps {
  colors: string[];
  grainAmount: number;
  glassEffect?: boolean;
  glassStripes?: number;
  glassOpacity?: number;
  isAnimating?: boolean;
  verticalStripes?: boolean;
  ribbonColor?: string;
}

const GradientCanvas = forwardRef<HTMLCanvasElement, GradientCanvasProps>(
  (props, ref) => {
    const {
      colors,
      grainAmount,
      glassEffect,
      glassStripes,
      glassOpacity,
      verticalStripes,
      ribbonColor,
    } = props;

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const noise2D = useRef<ReturnType<typeof createNoise2D>>(createNoise2D());

    // Convert hex to RGB
    const hexToRgb = (hex: string): [number, number, number] => {
      const r = Number.parseInt(hex.slice(1, 3), 16);
      const g = Number.parseInt(hex.slice(3, 5), 16);
      const b = Number.parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    };

    // Use pickable ribbon color or fallback to black
    const ribbonColorHex = ribbonColor || "#000000";
    const ribbonColorRgb = hexToRgb(ribbonColorHex);

    // Handle canvas resize
    useEffect(() => {
      const handleResize = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const container = canvas.parentElement;
        if (!container) return;

        const { width, height } = container.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;
        setDimensions({ width, height });
      };

      window.addEventListener("resize", handleResize);
      handleResize();

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, []);

    // Expose canvas ref to parent component
    useEffect(() => {
      if (typeof ref === "function") {
        ref(canvasRef.current);
      } else if (ref) {
        ref.current = canvasRef.current;
      }
    }, [ref]);

    // --- Helper: Glow between colors ---
    const glowBlend = (
      c1: [number, number, number] | undefined,
      c2: [number, number, number] | undefined,
      t: number,
      glow: number
    ) => {
      // Handle edge cases: fallback to black if undefined
      if (!c1 && !c2) return [0, 0, 0];
      if (!c1) return c2!;
      if (!c2) return c1;

      // t: 0..1, glow: 0..1
      const base = [
        c1[0] * (1 - t) + c2[0] * t,
        c1[1] * (1 - t) + c2[1] * t,
        c1[2] * (1 - t) + c2[2] * t,
      ];
      // Add glow at the transition
      const g = Math.exp(-Math.pow((t - 0.5) * 4, 2)) * glow * 255;
      return [
        Math.min(255, base[0] + g),
        Math.min(255, base[1] + g),
        Math.min(255, base[2] + g),
      ];
    };

    // --- Interpolate between multiple colors with glow ---
    const interpolateMultiColorGlow = (
      colorArr: [number, number, number][],
      t: number,
      glow: number
    ): [number, number, number] => {
      const n = colorArr.length;
      if (n === 0) return [0, 0, 0];
      if (n === 1) return colorArr[0];
      const scaled = t * (n - 1);
      let idx = Math.floor(scaled);
      let frac = scaled - idx;
      // Clamp idx and frac to valid range
      if (idx < 0) {
        idx = 0;
        frac = 0;
      }
      if (idx >= n - 1) {
        idx = n - 2;
        frac = 1;
      }
      return glowBlend(colorArr[idx], colorArr[idx + 1], frac, glow);
    };

    // Animation loop
    useEffect(() => {
      if (!canvasRef.current || !dimensions.width || !dimensions.height) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Convert all hex colors to RGB and ensure each is [number, number, number]
      const rgbColors: [number, number, number][] = colors.map((hex) => {
        const rgb = hexToRgb(hex);
        return [rgb[0], rgb[1], rgb[2]];
      });

      const { width, height } = canvas;
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      // --- Main gradient and ribbon rendering ---
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;

          // Normalized coordinates
          const nx = x / width;
          const ny = y / height;

          // --- Diagonal base for main ribbon path ---
          let diag = (nx + (1 - ny)) / 2;

          // --- Main ribbon curve (black or user-selected color) ---
          // Center the main ribbon along a diagonal, with organic curve
          const mainPhase = 0;
          const mainBase =
            diag + 0.06 * Math.sin(ny * Math.PI * 1.2 + mainPhase);
          const mainTwist =
            0.1 * noise2D.current(nx * 2 + mainPhase, ny * 2 + mainPhase);
          const mainCurve = mainBase + mainTwist;

          // Distance from main ribbon center
          const mainDist = Math.abs(diag - mainCurve);
          // Soft edge for main ribbon
          const mainBand = Math.exp(-mainDist * 32);

          // --- Branches: 1–2 smaller, organic offshoots ---
          let branchBand = 0;
          for (let b = 1; b <= 2; b++) {
            const branchPhase = b * 1.2;
            // Branch emerges from main ribbon, curves away, then fades back
            const branchCurve =
              mainCurve +
              0.08 * Math.sin(ny * Math.PI * (1.1 + 0.2 * b) + branchPhase) +
              0.05 *
                noise2D.current(
                  nx * 3 + branchPhase * 10,
                  ny * 3 + branchPhase * 10
                );
            const branchDist = Math.abs(diag - branchCurve);
            // Branch is thinner and softer than main ribbon
            branchBand += Math.exp(-branchDist * 40) * 0.7;
          }
          // Total ribbon field (main + branches)
          let ribbon = Math.min(1, mainBand + branchBand);

          // --- Background radial gradient for depth ---
          const cx = width / 2;
          const cy = height / 2;
          const dx = x - cx;
          const dy = y - cy;
          const radius =
            Math.sqrt(dx * dx + dy * dy) / Math.sqrt(cx * cx + cy * cy);

          // --- Color blending: background gradient ---
          let gradT = diag * 0.7 + radius * 0.3;
          gradT = Math.max(0, Math.min(1, gradT));
          let bgColor = interpolateMultiColorGlow(rgbColors, gradT, 0.18);

          // --- Blend ribbon color into background with soft edges and high contrast ---
          // The ribbon color is black or user-selected, but blends softly
          let color = [
            bgColor[0] * (1 - ribbon) + ribbonColorRgb[0] * ribbon,
            bgColor[1] * (1 - ribbon) + ribbonColorRgb[1] * ribbon,
            bgColor[2] * (1 - ribbon) + ribbonColorRgb[2] * ribbon,
          ];

          // --- Fade ribbon into background at edges (no hard lines) ---
          // Soften the ribbon even more at the outer edge
          const fade = Math.exp(-mainDist * 12);
          color = [
            color[0] * fade + bgColor[0] * (1 - fade),
            color[1] * fade + bgColor[1] * (1 - fade),
            color[2] * fade + bgColor[2] * (1 - fade),
          ];

          // --- Add soft highlight for upward motion (like heat rising) ---
          const highlight =
            Math.exp(-Math.pow((ny - 0.18) * 3, 2)) *
            Math.abs(Math.sin(nx * Math.PI * 2 + gradT * 2)) *
            28 *
            ribbon;
          color = [
            Math.min(255, color[0] + highlight),
            Math.min(255, color[1] + highlight),
            Math.min(255, color[2] + highlight),
          ];

          // --- Add grain effect if enabled ---
          // Store grain separately so it can be added after blur
          let grain = 0;
          if (grainAmount > 0) {
            grain = (Math.random() - 0.5) * grainAmount * 50;
          }

          data[i] = color[0];
          data[i + 1] = color[1];
          data[i + 2] = color[2];
          data[i + 3] = 255;
          // Store grain for later
          if (!("grainMap" in window)) (window as any).grainMap = {};
          (window as any).grainMap[i] = grain;
        }
      }

      // --- Vertical glass-like stripes with parallax/distortion effect ---
      if (verticalStripes) {
        const numStripes = 28;
        const stripeWidth = width / numStripes;
        const gap = Math.max(2, Math.round(stripeWidth * 0.18));
        ctx.save();
        ctx.globalAlpha = 1;

        // Read the current image for distortion
        const srcData = ctx.getImageData(0, 0, width, height);

        for (let i = 0; i < numStripes; i++) {
          const xStart = Math.round(i * stripeWidth + gap);
          const xEnd = Math.round((i + 1) * stripeWidth - gap);
          if (xEnd <= xStart) continue;

          // Blur the gap region between stripes
          if (gap > 0) {
            const blurGap = (xStart: number, width: number) => {
              const blurRadius = Math.max(2, Math.round(stripeWidth * 0.18));
              for (let x = xStart; x < xStart + width; x++) {
                if (x < 0 || x >= ctx.canvas.width) continue;
                for (let y = 0; y < height; y++) {
                  let rSum = 0,
                    gSum = 0,
                    bSum = 0,
                    count = 0;
                  for (let bx = -blurRadius; bx <= blurRadius; bx++) {
                    const px = Math.max(
                      0,
                      Math.min(ctx.canvas.width - 1, x + bx)
                    );
                    const idx = (y * ctx.canvas.width + px) * 4;
                    rSum += data[idx];
                    gSum += data[idx + 1];
                    bSum += data[idx + 2];
                    count++;
                  }
                  const dstIdx = (y * ctx.canvas.width + x) * 4;
                  data[dstIdx + 0] = Math.round(
                    data[dstIdx + 0] * 0.3 + (rSum / count) * 0.7
                  );
                  data[dstIdx + 1] = Math.round(
                    data[dstIdx + 1] * 0.3 + (gSum / count) * 0.7
                  );
                  data[dstIdx + 2] = Math.round(
                    data[dstIdx + 2] * 0.3 + (bSum / count) * 0.7
                  );
                  // Do not touch alpha or grain here
                }
              }
            };
            blurGap(Math.round(i * stripeWidth), gap);
            blurGap(Math.round((i + 1) * stripeWidth - gap), gap);
          }

          // Sharper, more defined edges
          const edgeSoftness = stripeWidth * 0.09;

          // --- Blur the background under the stripe (pixel manipulation for blur effect) ---
          const blurRadius = Math.max(2, Math.round(stripeWidth * 0.18));
          for (let x = xStart; x < xEnd; x++) {
            for (let y = 0; y < height; y++) {
              let rSum = 0,
                gSum = 0,
                bSum = 0,
                count = 0;
              for (let bx = -blurRadius; bx <= blurRadius; bx++) {
                const px = Math.max(0, Math.min(width - 1, x + bx));
                const idx = (y * width + px) * 4;
                rSum += data[idx];
                gSum += data[idx + 1];
                bSum += data[idx + 2];
                count++;
              }
              const dstIdx = (y * width + x) * 4;
              data[dstIdx + 0] = Math.round(
                data[dstIdx + 0] * 0.3 + (rSum / count) * 0.7
              );
              data[dstIdx + 1] = Math.round(
                data[dstIdx + 1] * 0.3 + (gSum / count) * 0.7
              );
              data[dstIdx + 2] = Math.round(
                data[dstIdx + 2] * 0.3 + (bSum / count) * 0.7
              );
              // Do not touch alpha or grain here
            }
          }

          for (let x = xStart; x < xEnd; x++) {
            const center = (xStart + xEnd) / 2;
            const dist = Math.abs(x - center);
            const edgeAlpha = Math.exp(-Math.pow(dist / edgeSoftness, 2));
            const maxShift = stripeWidth * 0.22;
            const shift =
              Math.sin((Math.PI * (x - xStart)) / (xEnd - xStart)) *
              maxShift *
              edgeAlpha;

            for (let y = 0; y < height; y++) {
              let srcX = Math.round(x + shift);
              srcX = Math.max(0, Math.min(width - 1, srcX));
              const srcIdx = (y * width + srcX) * 4;
              const dstIdx = (y * width + x) * 4;

              // Get background color
              const r = srcData.data[srcIdx];
              const g = srcData.data[srcIdx + 1];
              const b = srcData.data[srcIdx + 2];

              // Compute local brightness for adaptive transparency/contrast
              const brightness = (r + g + b) / (3 * 255);

              // Stripe alpha: more visible in dark, less in light
              const baseAlpha = 0.32 + 0.32 * (1 - brightness);
              const alpha = edgeAlpha * baseAlpha;

              // --- Reflect color at the left and right edge of the stripe ---
              let reflectR = r,
                reflectG = g,
                reflectB = b;
              const reflectStrength = Math.max(
                0,
                1 - Math.abs((x - center) / (stripeWidth * 0.5))
              );
              if (x - xStart < stripeWidth * 0.18) {
                // Left edge: sample from right edge
                const reflectX = Math.min(
                  xEnd - 1,
                  x + Math.round(stripeWidth * 0.7)
                );
                const reflectIdx = (y * width + reflectX) * 4;
                reflectR = srcData.data[reflectIdx];
                reflectG = srcData.data[reflectIdx + 1];
                reflectB = srcData.data[reflectIdx + 2];
              } else if (xEnd - x < stripeWidth * 0.18) {
                // Right edge: sample from left edge
                const reflectX = Math.max(
                  xStart,
                  x - Math.round(stripeWidth * 0.7)
                );
                const reflectIdx = (y * width + reflectX) * 4;
                reflectR = srcData.data[reflectIdx];
                reflectG = srcData.data[reflectIdx + 1];
                reflectB = srcData.data[reflectIdx + 2];
              }
              // Blend the reflection into the color for the edge
              const edgeBlend = 0.55 * reflectStrength * edgeAlpha;
              const finalR = Math.round(
                r * (1 - edgeBlend) + reflectR * edgeBlend
              );
              const finalG = Math.round(
                g * (1 - edgeBlend) + reflectG * edgeBlend
              );
              const finalB = Math.round(
                b * (1 - edgeBlend) + reflectB * edgeBlend
              );

              // Blend the distorted color over the original
              data[dstIdx + 0] = Math.round(
                finalR * alpha + data[dstIdx + 0] * (1 - alpha)
              );
              data[dstIdx + 1] = Math.round(
                finalG * alpha + data[dstIdx + 1] * (1 - alpha)
              );
              data[dstIdx + 2] = Math.round(
                finalB * alpha + data[dstIdx + 2] * (1 - alpha)
              );
            }
          }
        }

        // After all blur and stripe effects, re-apply grain
        const grainMap = (window as any).grainMap;
        if (grainMap) {
          for (let i = 0; i < data.length; i += 4) {
            const grain = grainMap[i] || 0;
            data[i] = Math.max(0, Math.min(255, data[i] + grain));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain));
          }
          delete (window as any).grainMap;
        }

        ctx.putImageData(imageData, 0, 0);
        ctx.restore();
      } else {
        // If no stripes, apply grain after all rendering
        const grainMap = (window as any).grainMap;
        if (grainMap) {
          for (let i = 0; i < data.length; i += 4) {
            const grain = grainMap[i] || 0;
            data[i] = Math.max(0, Math.min(255, data[i] + grain));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain));
          }
          delete (window as any).grainMap;
          ctx.putImageData(imageData, 0, 0);
        }
      }
    }, [
      dimensions.width,
      dimensions.height,
      colors,
      grainAmount,
      glassEffect,
      glassStripes,
      glassOpacity,
      verticalStripes,
    ]);

    return (
      <canvas
        ref={(node) => {
          canvasRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className="w-full h-[500px] md:h-[600px]"
      />
    );
  }
);

GradientCanvas.displayName = "GradientCanvas";

export default GradientCanvas;
