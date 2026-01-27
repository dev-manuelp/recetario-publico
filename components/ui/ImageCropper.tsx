'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from "@/components/ui/button";
import { Check, X, ZoomIn } from "lucide-react";

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({ image, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropAreaComplete = useCallback((_: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener('load', () => resolve(img));
      img.addEventListener('error', (error) => reject(error));
      img.src = url;
    });

  const getCroppedImg = async () => {
    try {
      const img = await createImage(image);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx || !croppedAreaPixels) return;

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      canvas.toBlob((blob) => {
        if (blob) onCropComplete(blob);
      }, 'image/jpeg', 0.85);
    } catch (e) {
      console.error("Error al recortar la imagen:", e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in">
      {/* Área de recorte */}
      <div className="relative flex-1">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={3 / 4}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropAreaComplete}
        />
      </div>

      {/* Controles */}
      <div className="bg-white p-6 pb-10 rounded-t-[2.5rem] shadow-2xl">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4 w-full max-w-xs mb-4">
            <ZoomIn className="w-4 h-4 text-stone-400" />
            <input 
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>

          <div className="flex gap-3 w-full">
            <Button 
              variant="outline" 
              className="flex-1 h-14 rounded-2xl border-stone-200 font-bold text-stone-600" 
              onClick={onCancel}
            >
              <X className="w-5 h-5 mr-2" /> Cancelar
            </Button>
            <Button 
              className="flex-1 h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg shadow-orange-200" 
              onClick={getCroppedImg}
            >
              <Check className="w-5 h-5 mr-2" /> Recortar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}