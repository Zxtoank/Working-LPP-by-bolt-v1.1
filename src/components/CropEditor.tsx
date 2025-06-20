import React, { useRef, useEffect } from 'react';
import { RotateCw, Move, ZoomIn } from 'lucide-react';
import { CropShape } from '../types';

interface CropEditorProps {
  image: HTMLImageElement;
  cropShape: CropShape;
  setCropShape: (shape: CropShape) => void;
  rotation: number;
  setRotation: (rotation: number) => void;
  scale: number;
  setScale: (scale: number) => void;
  offsetX: number;
  setOffsetX: (x: number) => void;
  offsetY: number;
  setOffsetY: (y: number) => void;
  croppedImage: string | null;
  updateCroppedImage: () => void;
}

const CROP_SHAPES: { value: CropShape; label: string; icon: string }[] = [
  { value: 'circle', label: 'Circle', icon: '●' },
  { value: 'oval', label: 'Oval', icon: '⬭' },
  { value: 'square', label: 'Square', icon: '■' },
  { value: 'rectangle', label: 'Rectangle', icon: '▬' },
  { value: 'heart', label: 'Heart', icon: '♥' },
];

export const CropEditor: React.FC<CropEditorProps> = ({
  image,
  cropShape,
  setCropShape,
  rotation,
  setRotation,
  scale,
  setScale,
  offsetX,
  setOffsetX,
  offsetY,
  setOffsetY,
  croppedImage,
  updateCroppedImage,
}) => {
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    updateCroppedImage();
  }, [image, cropShape, rotation, scale, offsetX, offsetY]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    lastMousePos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    const deltaX = currentX - lastMousePos.current.x;
    const deltaY = currentY - lastMousePos.current.y;
    
    setOffsetX(offsetX + deltaX);
    setOffsetY(offsetY + deltaY);
    
    lastMousePos.current = { x: currentX, y: currentY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setScale(Math.max(0.1, Math.min(5, scale * zoomFactor)));
  };

  return (
    <div className="space-y-6">
      {/* Crop Shape Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-3"></div>
          Crop Shape
        </h3>
        <div className="grid grid-cols-5 gap-3">
          {CROP_SHAPES.map((shape) => (
            <button
              key={shape.value}
              onClick={() => setCropShape(shape.value)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                cropShape === shape.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl mb-1">{shape.icon}</div>
              <div className="text-xs font-medium">{shape.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Preview Area */}
      <div className="bg-gray-100 rounded-xl p-4">
        <div 
          className="w-full h-96 bg-white rounded-lg shadow-lg mx-auto flex items-center justify-center cursor-move relative overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {croppedImage ? (
            <img
              src={croppedImage}
              alt="Cropped preview"
              className="max-w-full max-h-full object-contain rounded-lg"
              draggable={false}
            />
          ) : (
            <div className="text-gray-400 text-center">
              <div className="text-4xl mb-2">📷</div>
              <p>Preview will appear here</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-center mt-4 space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Move className="h-4 w-4" />
            <span>Drag to move</span>
          </div>
          <div className="flex items-center space-x-1">
            <ZoomIn className="h-4 w-4" />
            <span>Scroll to zoom</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <RotateCw className="h-4 w-4 mr-2" />
            Rotation: {rotation}°
          </label>
          <input
            type="range"
            min="-180"
            max="180"
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <ZoomIn className="h-4 w-4 mr-2" />
            Scale: {scale.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>
    </div>
  );
};