'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer as TimerIcon, X, Plus, Minus } from 'lucide-react';
import { cn } from "@/lib/utils";

interface CookingTimerProps {
  initialMinutes: number;
  onClose: () => void;
}

export default function CookingTimer({ initialMinutes, onClose }: CookingTimerProps) {
  const [seconds, setSeconds] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(true);

  // Función para ajustar el tiempo manualmente (+/- 1 minuto)
  const adjustTime = (amount: number) => {
    setSeconds(prev => Math.max(0, prev + amount));
  };

  useEffect(() => {
    let interval: any;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    } else if (seconds === 0 && isActive) {
      // Sonido de aviso tipo campana de cocina
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => console.log("El navegador bloqueó el audio inicial"));
      setIsActive(false);
      if (Notification.permission === "granted") {
        new Notification("¡Tiempo cumplido!", { body: "Tu receta te espera." });
      }
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-[280px] bg-stone-900/95 backdrop-blur-xl text-white p-6 rounded-[32px] shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-10">
      
      {/* Selector de tiempo ajustable */}
      <div className="flex items-center justify-between mb-6 px-2">
        <button 
          onClick={() => adjustTime(-60)}
          className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 active:scale-90 transition-all"
        >
          <Minus size={20} />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-4xl font-mono font-bold tracking-tighter tabular-nums text-orange-400">
            {formatTime(seconds)}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mt-1">Minutos</span>
        </div>

        <button 
          onClick={() => adjustTime(60)}
          className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 active:scale-90 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>
      
      {/* Botones de Control */}
      <div className="flex items-center justify-around gap-2 pt-4 border-t border-white/5">
        <button 
          onClick={() => setSeconds(initialMinutes * 60)}
          className="p-3 text-stone-400 hover:text-white transition-colors"
          title="Reiniciar"
        >
          <RotateCcw size={20} />
        </button>

        <button 
          onClick={() => setIsActive(!isActive)}
          className={cn(
            "w-14 h-14 flex items-center justify-center rounded-full transition-all shadow-lg",
            isActive ? "bg-white/10 text-white" : "bg-orange-500 text-white shadow-orange-500/20"
          )}
        >
          {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} className="ml-1" fill="currentColor" />}
        </button>

        <button 
          onClick={onClose}
          className="p-3 text-red-400/70 hover:text-red-400 transition-colors"
          title="Cerrar"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}