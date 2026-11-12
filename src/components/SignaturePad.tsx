import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Check, PenTool } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  labelUrdu: string;
  value: string;
  onChange: (dataUrl: string) => void;
  required?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  label,
  labelUrdu,
  value,
  onChange,
  required = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-DPI scaling
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f766e'; // Teal brand color
    ctx.lineWidth = 2.5;

    // If pre-existing value, draw image
    if (value && !hasDrawn) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
      img.src = value;
    }
  }, []);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    }
  };

  const clearCanvas = (e: React.MouseEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
    onChange('');
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
        <span className="flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-emerald-600" />
          {label} {required && <span className="text-rose-500">*</span>}
        </span>
        <span className="font-urdu text-emerald-800 text-sm">{labelUrdu}</span>
      </div>

      <div className="relative border-2 border-dashed border-slate-300 rounded-lg bg-slate-50/70 overflow-hidden hover:border-emerald-500 transition-colors">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-28 touch-none cursor-crosshair bg-white"
        />

        {!hasDrawn && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 text-xs">
            <span>Sign with finger, stylus, or mouse here</span>
            <span className="font-urdu text-slate-500 text-xs mt-0.5">یہاں دستخط کریں</span>
          </div>
        )}

        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              const canvas = canvasRef.current;
              if (!canvas) return;
              const ctx = canvas.getContext('2d');
              if (!ctx) return;
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.font = 'italic bold 18px "Inter", sans-serif';
              ctx.fillStyle = '#0f766e';
              ctx.fillText(`✓ Certified ${label.includes('Inspector') ? 'Inspector' : 'Community Rep'}`, 15, 35);
              ctx.beginPath();
              ctx.moveTo(15, 42);
              ctx.lineTo(220, 42);
              ctx.strokeStyle = '#0f766e';
              ctx.lineWidth = 1.5;
              ctx.stroke();
              setHasDrawn(true);
              onChange(canvas.toDataURL('image/png'));
            }}
            className="px-2 py-1 text-[11px] bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold rounded flex items-center gap-1 transition-colors border border-emerald-300 shadow-2xs"
            title="Auto-generate Verified Digital Sign Stamp"
          >
            <span>Sign / تصدیق</span>
          </button>

          {hasDrawn && (
            <button
              type="button"
              onClick={clearCanvas}
              className="px-2 py-1 text-[11px] bg-slate-200 hover:bg-slate-300 text-slate-700 rounded flex items-center gap-1 transition-colors"
              title="Clear Signature"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear / صاف</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
