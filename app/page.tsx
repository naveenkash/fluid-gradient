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

  // Warp settings
  const [warpSpeed, setWarpSpeed] = useState(0.2);
  const [warpScale, setWarpScale] = useState(0.3);
  const [warpComplexity, setWarpComplexity] = useState(2);

  // Effect settings
  const [grainAmount, setGrainAmount] = useState(0);
  const [glassEffect, setGlassEffect] = useState(false);
  const [glassStripes, setGlassStripes] = useState(5);
  const [glassOpacity, setGlassOpacity] = useState(0.2);

  // Animation control
  const [isAnimating, setIsAnimating] = useState(true);

  // Color picker tab state
  const [activeColorTab, setActiveColorTab] = useState("start");

  // Canvas ref for download functionality
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Handle download functionality
  const handleDownload = () => {
    if (!canvasRef.current) return;

    const link = document.createElement("a");
    link.download = "fluid-gradient.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  // Reset to default settings
  const handleReset = () => {
    setColors(generateRandomPalette(3 + Math.floor(Math.random() * 3))); // 3-5 colors
    setWarpSpeed(0.2);
    setWarpScale(0.3);
    setWarpComplexity(2);
    setGrainAmount(0);
    setGlassEffect(false);
    setGlassStripes(5);
    setGlassOpacity(0.2);
    setIsAnimating(true);
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
              ref={canvasRef}
              colors={colors}
              warpSpeed={warpSpeed}
              warpScale={warpScale}
              warpComplexity={warpComplexity}
              grainAmount={grainAmount}
              glassEffect={glassEffect}
              glassStripes={glassStripes}
              glassOpacity={glassOpacity}
              isAnimating={isAnimating}
            />
          </div>

          {/* Controls area */}
          <div className="lg:col-span-1">
            <ControlPanel
              colors={colors}
              setColors={setColors}
              warpSpeed={warpSpeed}
              setWarpSpeed={setWarpSpeed}
              warpScale={warpScale}
              setWarpScale={setWarpScale}
              warpComplexity={warpComplexity}
              setWarpComplexity={setWarpComplexity}
              grainAmount={grainAmount}
              setGrainAmount={setGrainAmount}
              glassEffect={glassEffect}
              setGlassEffect={setGlassEffect}
              glassStripes={glassStripes}
              setGlassStripes={setGlassStripes}
              glassOpacity={glassOpacity}
              setGlassOpacity={setGlassOpacity}
              isAnimating={isAnimating}
              setIsAnimating={setIsAnimating}
              onReset={handleReset}
              onDownload={handleDownload}
              activeColorTab={activeColorTab}
              setActiveColorTab={setActiveColorTab}
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
