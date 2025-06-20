import { useState, useCallback } from 'react';
import { CropShape } from '../types';

export const useImageEditor = () => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [cropShape, setCropShape] = useState<CropShape>('rectangle');
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

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

  const updateCroppedImage = useCallback(() => {
    if (!image) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 400;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const size = Math.min(canvas.width, canvas.height) * 0.8;
    const startX = centerX - size / 2;
    const startY = centerY - size / 2;

    // Create clipping path
    ctx.save();
    switch (cropShape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2, 0, 2 * Math.PI);
        ctx.clip();
        break;
      case 'oval':
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, size / 2.5, size / 2, 0, 0, 2 * Math.PI);
        ctx.clip();
        break;
      case 'square':
        ctx.beginPath();
        ctx.rect(startX, startY, size, size);
        ctx.clip();
        break;
      case 'rectangle':
        ctx.beginPath();
        ctx.rect(startX, startY, size, size * 0.6);
        ctx.clip();
        break;
      case 'heart':
        drawHeartPath(ctx, startX, startY, size, size);
        ctx.clip();
        break;
    }

    // Apply transformations and draw image
    ctx.translate(centerX + offsetX, centerY + offsetY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    ctx.restore();

    setCroppedImage(canvas.toDataURL());
  }, [image, cropShape, rotation, scale, offsetX, offsetY]);

  return {
    image,
    setImage,
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
  };
};