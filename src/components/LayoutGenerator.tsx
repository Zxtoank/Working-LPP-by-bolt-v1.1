import React, { useRef, useEffect, useState } from 'react';
import { Grid, Maximize2, ArrowUpDown } from 'lucide-react';
import { CropShape } from '../types';

interface LayoutGeneratorProps {
  croppedImage: string;
  cropShape: CropShape;
}

export const LayoutGenerator: React.FC<LayoutGeneratorProps> = ({
  croppedImage,
  cropShape,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [maxHeight, setMaxHeight] = useState(30);
  const [spacing, setSpacing] = useState(10);
  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('none');

  // 4" × 6" at 144 DPI = 576 × 864 pixels
  const CANVAS_WIDTH = 576;
  const CANVAS_HEIGHT = 864;
  const MM_TO_PX = 144 / 25.4; // 144 DPI conversion

  useEffect(() => {
    generateLayout();
  }, [croppedImage, maxHeight, spacing, sortOrder]);

  const generateLayout = () => {
    const canvas = canvasRef.current;
    if (!canvas || !croppedImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with white background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load the cropped image
    const img = new Image();
    img.onload = () => {
      // Generate 35 photos with varying sizes (8mm to maxHeight mm)
      const photos = Array.from({ length: 35 }, (_, i) => {
        const minHeightMm = 8;
        const maxHeightMm = maxHeight;
        const sizeVariation = Math.random();
        const heightMm = minHeightMm + (sizeVariation * (maxHeightMm - minHeightMm));
        const heightPx = Math.floor(heightMm * MM_TO_PX);
        return { size: heightPx, index: i, heightMm };
      });

      // Sort if requested
      if (sortOrder === 'asc') {
        photos.sort((a, b) => a.size - b.size);
      } else if (sortOrder === 'desc') {
        photos.sort((a, b) => b.size - a.size);
      }

      // Layout photos with proper spacing
      let x = spacing;
      let y = spacing;
      let rowHeight = 0;

      photos.forEach((photo) => {
        // Check if we need to move to next row
        if (x + photo.size + spacing > canvas.width) {
          x = spacing;
          y += rowHeight + spacing;
          rowHeight = 0;
        }

        // Skip if we're running out of vertical space
        if (y + photo.size + spacing > canvas.height) {
          return;
        }

        // Draw photo
        drawSticker(ctx, img, x, y, photo.size, photo.size);
        
        x += photo.size + spacing;
        rowHeight = Math.max(rowHeight, photo.size);
      });

      // Add size information text
      ctx.fillStyle = '#666666';
      ctx.font = '12px Arial';
      ctx.fillText(`Photo sizes: ${8}mm - ${maxHeight}mm`, 10, canvas.height - 10);
    };
    img.src = croppedImage;
  };

  const drawSticker = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    ctx.save();
    
    // Create clipping path based on crop shape
    switch (cropShape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI);
        ctx.clip();
        break;
      case 'oval':
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height / 2, width / 2.5, height / 2, 0, 0, 2 * Math.PI);
        ctx.clip();
        break;
      case 'square':
        const squareSize = Math.min(width, height);
        ctx.beginPath();
        ctx.rect(x, y, squareSize, squareSize);
        ctx.clip();
        break;
      case 'rectangle':
        ctx.beginPath();
        ctx.rect(x, y, width, height * 0.6);
        ctx.clip();
        break;
      case 'heart':
        drawHeartPath(ctx, x, y, width, height);
        ctx.clip();
        break;
    }

    ctx.drawImage(img, x, y, width, height);
    ctx.restore();
  };

  const drawHeartPath = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    const topDipY = y + height * 0.4;
    const centerX = x + width / 2;
    const bottomPointY = y + height;
    
    ctx.beginPath();
    ctx.moveTo(centerX, bottomPointY);
    ctx.bezierCurveTo(x, y + height * 0.7, x, y, centerX, topDipY);
    ctx.bezierCurveTo(x + width, y, x + width, y + height * 0.7, centerX, bottomPointY);
    ctx.closePath();
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-blue-600 rounded-full mr-4"></div>
        4" × 6\" Layout (35 Photos)
      </h2>

      {/* Controls */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Maximize2 className="h-4 w-4 mr-2" />
            Max Photo Height: {maxHeight}mm
          </label>
          <input
            type="range"
            min="8"
            max="35"
            value={maxHeight}
            onChange={(e) => setMaxHeight(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>8mm</span>
            <span>35mm</span>
          </div>
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Grid className="h-4 w-4 mr-2" />
            Spacing: {spacing}px
          </label>
          <input
            type="range"
            min="5"
            max="30"
            value={spacing}
            onChange={(e) => setSpacing(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Sort by Size
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'none', label: 'Random' },
              { value: 'asc', label: 'Smallest First' },
              { value: 'desc', label: 'Largest First' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSortOrder(option.value as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  sortOrder === option.value
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="bg-gray-50 rounded-xl p-4">
        <canvas
          ref={canvasRef}
          id="layoutCanvas"
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-gray-300 rounded-lg bg-white shadow-lg mx-auto block max-w-full h-auto"
        />
        <div className="text-center text-sm text-gray-600 mt-3 space-y-1">
          <p>4" × 6" print layout (576 × 864 pixels at 144 DPI)</p>
          <p>Photo heights: 8mm - {maxHeight}mm</p>
        </div>
      </div>
    </div>
  );
};