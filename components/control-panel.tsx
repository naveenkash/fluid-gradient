"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HexColorPicker } from "react-colorful";
import { Download, RefreshCw, Pause, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Utility to generate a random hex color
function randomColor() {
  return (
    "#" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")
  );
}

// Utility to get a complementary color (simple hue shift)
function getComplementaryColor(hex: string) {
  // Convert hex to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Convert to HSL
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2 / 255;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 * 255 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  // Complementary hue
  h = (h + 0.5) % 1;
  // Convert back to RGB
  let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  let p = 2 * l - q;
  function hue2rgb(p: number, q: number, t: number) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }
  const r2 = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g2 = Math.round(hue2rgb(p, q, h) * 255);
  const b2 = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
  return (
    "#" +
    r2.toString(16).padStart(2, "0") +
    g2.toString(16).padStart(2, "0") +
    b2.toString(16).padStart(2, "0")
  );
}

interface ControlPanelProps {
  colors: string[];
  setColors: (colors: string[]) => void;
  grainAmount: number;
  setGrainAmount: (value: number) => void;
  onReset: () => void;
  onDownload: (width: number, height: number) => void;
  activeColorTab: string;
  setActiveColorTab: (tab: string) => void;
  verticalStripes?: boolean;
  setVerticalStripes?: (value: boolean) => void;
  ribbonColor?: string;
  setRibbonColor?: (color: string) => void;
}

export default function ControlPanel({
  colors,
  setColors,
  grainAmount,
  setGrainAmount,
  onReset,
  onDownload,
  verticalStripes,
  setVerticalStripes,
  ribbonColor = "#000000",
  setRibbonColor,
}: ControlPanelProps) {
  // Handler for color change
  const handleColorChange = (idx: number, color: string) => {
    const newColors = [...colors];
    newColors[idx] = color;
    setColors(newColors);
  };

  // Handler for adding a color stop
  const handleAddColor = () => {
    let newColor = randomColor();
    if (colors.length > 0) {
      // Use the last color as base for complement
      newColor = getComplementaryColor(colors[colors.length - 1]);
    }
    setColors([...colors, newColor]);
  };

  // Handler for removing a color stop
  const handleRemoveColor = (idx: number) => {
    if (colors.length <= 2) return; // Always keep at least 2 stops
    setColors(colors.filter((_, i) => i !== idx));
  };

  // Handler for ribbon color change
  const handleRibbonColorChange = (color: string) => {
    setRibbonColor?.(color);
  };

  // --- Download Modal State ---
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadWidth, setDownloadWidth] = useState(1920);
  const [downloadHeight, setDownloadHeight] = useState(1080);

  // --- Download Handler with dimensions ---
  const handleDownloadClick = () => setShowDownloadModal(true);

  const handleDownloadConfirm = () => {
    setShowDownloadModal(false);
    onDownload?.(downloadWidth, downloadHeight);
  };

  return (
    <div className="space-y-6">
      {/* Color Controls */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle>Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {colors.map((color, idx) => (
              <div key={idx} className="flex items-center space-x-4">
                <HexColorPicker
                  color={color}
                  onChange={(c) => handleColorChange(idx, c)}
                />
                <div
                  className="w-10 h-10 rounded-md border border-zinc-700"
                  style={{ backgroundColor: color }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveColor(idx)}
                  disabled={colors.length <= 2}
                  aria-label="Remove color"
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleAddColor}
            >
              + Add Color Stop
            </Button>
            {/* Ribbon Color Picker */}
            <div className="flex items-center space-x-4 mt-2">
              <div>
                <Label className="mb-1 block">Ribbon Color</Label>
                <HexColorPicker
                  color={ribbonColor}
                  onChange={handleRibbonColorChange}
                />
              </div>
              <div
                className="w-10 h-10 rounded-md border border-zinc-700"
                style={{ backgroundColor: ribbonColor }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Effects Controls */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle>Effects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="grain-amount">Grain Amount</Label>
              <span className="text-sm text-zinc-400">
                {grainAmount.toFixed(2)}
              </span>
            </div>
            <Slider
              id="grain-amount"
              min={0}
              max={1}
              step={0.01}
              value={[grainAmount]}
              onValueChange={(value) => setGrainAmount(value[0])}
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="vertical-stripes">Vertical Glass Stripes</Label>
            <Switch
              id="vertical-stripes"
              checked={!!verticalStripes}
              onCheckedChange={setVerticalStripes}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col space-y-3">
        <Button
          variant="default"
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          onClick={handleDownloadClick}
        >
          <Download className="mr-2 h-4 w-4" /> Download Image
        </Button>

        <Button
          variant="default"
          className="w-full bg-red-600 hover:bg-red-700 text-white"
          onClick={onReset}
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Reset Settings
        </Button>
      </div>

      {/* Download Modal */}
      <Dialog open={showDownloadModal} onOpenChange={setShowDownloadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Image</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col">
              Width (px)
              <input
                type="number"
                min={1}
                value={downloadWidth}
                onChange={(e) => setDownloadWidth(Number(e.target.value))}
                className="mt-1 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-white"
              />
            </label>
            <label className="flex flex-col">
              Height (px)
              <input
                type="number"
                min={1}
                value={downloadHeight}
                onChange={(e) => setDownloadHeight(Number(e.target.value))}
                className="mt-1 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-white"
              />
            </label>
          </div>
          <DialogFooter>
            <Button
              onClick={handleDownloadConfirm}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
