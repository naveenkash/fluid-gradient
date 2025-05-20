"use client";

import { useState, useRef } from "react";
import GradientCanvas from "@/components/gradient-canvas";
import ControlPanel from "@/components/control-panel";

export default function Home() {
  // Utility to generate a random hex color
  const randomColor = () =>
    "#" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0");

  // Generate a random color palette of n colors
  const generateRandomPalette = (n: number) =>
    Array.from({ length: n }, () => randomColor());

  // Gradient color stops (multi-color support)
  const [colors, setColors] = useState(["#FF4500", "#FF0000", "#000000"]);

  // Effect settings
  const [grainAmount, setGrainAmount] = useState(0);
  const [verticalStripes, setVerticalStripes] = useState(false);

  // Ribbon color state
  const [ribbonColor, setRibbonColor] = useState("#000000");

  // Color picker tab state
  const [activeColorTab, setActiveColorTab] = useState("start");

  // Canvas ref for download functionality
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Add a key to force remount GradientCanvas for new pattern
  const [canvasKey, setCanvasKey] = useState(Math.random());

  // --- Ribbon color change handler (update color only, do not remount canvas) ---
  const handleRibbonColorChange = (color: string) => {
    setRibbonColor(color);
    // Do not update canvasKey, just update the color state
  };

  // --- Download handler with custom dimensions ---
  const handleDownload = (width?: number, height?: number) => {
    if (!canvasRef.current) return;

    // If no custom dimensions, download current canvas
    if (!width || !height) {
      const link = document.createElement("a");
      link.download = "fluid-gradient.png";
      link.href = canvasRef.current.toDataURL("image/png");
      link.click();
      return;
    }

    // Create an offscreen canvas for custom size
    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;

    // Render the gradient at the requested size
    // Reuse the same logic as in GradientCanvas, but with new dimensions
    // For simplicity, we draw the current canvas scaled up/down
    ctx.drawImage(canvasRef.current, 0, 0, width, height);

    const link = document.createElement("a");
    link.download = `fluid-gradient-${width}x${height}.png`;
    link.href = offscreen.toDataURL("image/png");
    link.click();
  };

  // Reset to default settings
  const handleReset = () => {
    setColors(generateRandomPalette(3 + Math.floor(Math.random() * 3))); // 3-5 colors

    setGrainAmount(0);

    // Force a new pattern by resetting the key on GradientCanvas
    setCanvasKey(Math.random());
  };

  // Add a button handler to generate and set a random palette
  const handleRandomPalette = () => {
    setColors(generateRandomPalette(3 + Math.floor(Math.random() * 3))); // 3-5 colors
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">
          Fluid Gradient Generator
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main canvas area */}
          <div className="lg:col-span-2 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800">
            <GradientCanvas
              key={canvasKey}
              ref={canvasRef}
              colors={colors}
              grainAmount={grainAmount}
              verticalStripes={verticalStripes}
              ribbonColor={ribbonColor}
            />
          </div>

          {/* Controls area */}
          <div className="lg:col-span-1">
            <ControlPanel
              colors={colors}
              setColors={setColors}
              grainAmount={grainAmount}
              setGrainAmount={setGrainAmount}
              onReset={handleReset}
              onDownload={handleDownload}
              activeColorTab={activeColorTab}
              setActiveColorTab={setActiveColorTab}
              setVerticalStripes={setVerticalStripes}
              verticalStripes={verticalStripes}
              ribbonColor={ribbonColor}
              setRibbonColor={handleRibbonColorChange}
            />
            <button
              className="mt-4 w-full py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-semibold"
              onClick={handleRandomPalette}
            >
              Generate Random Palette
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
