'use client';

/**
 * PÁGINA DE DETALLE DE RECETA
 */
import { useEffect, useState, useRef } from 'react';
import { getRecipeByIdAction } from '@/app/actions/gallery-actions';
import { uploadDishPhotoAction } from '@/app/actions/upload-photo';
import {
  Loader2, ArrowLeft, ChefHat, Pencil, Share2,
  Lightbulb, LightbulbOff, Printer, X, Timer as TimerIcon // Añadido TimerIcon
} from "lucide-react";
import Link from 'next/link';
import { cn } from "@/lib/utils";
import { useParams } from 'next/navigation';
import ImageCropper from '@/components/ui/ImageCropper';

import { RecipeIcon } from '@/lib/icons';

import CookingTimer from '@/components/ui/CookingTimer';

export default function RecipeDetailPage() {
  const params = useParams();

  // --- ESTADOS DE DATOS Y CARGA ---
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // --- GESTIÓN DE PANTALLA (WAKE LOCK) ---
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [isScreenAwake, setIsScreenAwake] = useState(false);

  // --- UI: MODALES Y PREVISTA ---
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- CookingTimer ---
  const [activeTimerMinutes, setActiveTimerMinutes] = useState<number | null>(null);

  // --- foto paso receta ---
  const [activeStep, setActiveStep] = useState<number | null>(null);

  /**
   * CARGA INICIAL
   */
  useEffect(() => {
    if (params.id) {
      loadRecipe(params.id as string);
    }
  }, [params.id]);

  /**
   * LIMPIEZA DE WAKE LOCK AL SALIR
   */
  useEffect(() => {
    return () => {
      if (wakeLock) {
        wakeLock.release().then(() => setWakeLock(null));
      }
    };
  }, [wakeLock]);

  async function loadRecipe(id: string) {
    const result = await getRecipeByIdAction(id);
    if (result.success) {
      setRecipe(result.data);
    }
    setLoading(false);
  }

  /**
   * MANTIENE LA PANTALLA ENCENDIDA (Útil para cocinar)
   */
  async function toggleScreenAwake() {
    try {
      if (isScreenAwake && wakeLock) {
        await wakeLock.release();
        setWakeLock(null);
        setIsScreenAwake(false);
      } else {
        if ('wakeLock' in navigator) {
          const sentinel = await navigator.wakeLock.request('screen');
          setWakeLock(sentinel);
          setIsScreenAwake(true);
        } else {
          alert("Tu dispositivo no soporta esta función.");
        }
      }
    } catch (err) {
      console.error("Error con Wake Lock:", err);
    }
  }

  /**
   * COMPARTIR RECETA (Web Share API)
   */
  async function handleShare() {
    if (!recipe) return;
    const text = `🍽️ *${recipe.titulo}*\n\n📝 Ingredientes:\n${recipe.ingredientes.map((i: any) => `- ${i}`).join('\n')}\n\n👨‍🍳 Pasos:\n${recipe.pasos.join('\n')}\n\n_Enviado desde Cocina de Mamá_`;
    if (navigator.share) {
      try { await navigator.share({ title: recipe.titulo, text: text }); } catch (err) { }
    } else {
      navigator.clipboard.writeText(text);
      alert("¡Receta copiada!");
    }
  }

  /**
   * SUBIDA DE FOTO DE RESULTADO
   */
  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => { setTempImage(reader.result as string); };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleProcessedImage(blob: Blob) {
    setTempImage(null);
    setUploading(true);
    const formData = new FormData();
    const file = new File([blob], `${recipe.titulo}.jpg`, { type: 'image/jpeg' });
    formData.append('image', file);
    formData.append('id', recipe.id);
    formData.append('title', recipe.titulo);
    const result = await uploadDishPhotoAction(formData);
    if (result.success) { loadRecipe(recipe.id); } else { alert("Error: " + result.error); }
    setUploading(false);
  }

  // --- FUNCIÓN PARA RENDERIZAR PASOS CON DETECCIÓN DE TIEMPO ---
  function renderStepWithTimer(text: string, index: number) {
    const timeMatch = text.match(/(\d+)\s*(min|minuto|minutos)/i);
    const minutesFound = timeMatch ? parseInt(timeMatch[1]) : null;
    const isCurrent = activeStep === index;

    return (
      <div
        key={index}
        onClick={() => setActiveStep(index)}
        className={cn(
          "flex gap-4 break-inside-avoid group p-4 -mx-4 rounded-2xl transition-all cursor-pointer",
          isCurrent
            ? "bg-orange-50/80 ring-1 ring-orange-100 shadow-sm"
            : "opacity-60 hover:opacity-100"
        )}
      >
        <span className={cn(
          "font-sans font-bold text-4xl shrink-0 tabular-nums leading-none transition-colors",
          isCurrent ? "text-orange-400" : "text-orange-200"
        )}>
          {index + 1}
        </span>
        <div className="flex-1">
          <p className={cn(
            "text-xl text-stone-700 leading-relaxed text-left text-pasos-print select-text",
            isCurrent ? "font-medium" : ""
          )}>
            {text}
            {minutesFound && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // IMPORTANTE: para que no se active el paso al tocar el reloj
                  setActiveTimerMinutes(minutesFound);
                }}
                className="ml-3 inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[11px] font-bold hover:bg-orange-200 transition-all shadow-sm border border-orange-200 active:scale-95 print:hidden"
              >
                <TimerIcon size={14} className="animate-pulse" />
                <span>Poner {minutesFound} min</span>
              </button>
            )}
          </p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;
  if (!recipe) return <div className="text-center p-10 font-sans">Receta no encontrada</div>;

  return (
    <div className="min-h-screen bg-[#FBF7F4] pb-20 relative print:bg-white print:pb-0">

      {/* ESTILOS ESPECÍFICOS DE IMPRESIÓN (NUEVO) */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page { margin: 0; size: A4; }
          body { background: white !important; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}} />

      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handlePhotoSelect} className="hidden" />

      {/* BLOQUE CABECERA Y ACCIONES */}
      <div className="px-6 pt-16 pb-8 print:hidden">
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-30 print:hidden">
          <Link href="/">
            <button className="flex items-center justify-center bg-white/80 backdrop-blur-sm text-stone-700 h-10 w-10 rounded-full shadow-sm border border-stone-100">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="flex items-center justify-center bg-white/80 backdrop-blur-sm text-stone-700 h-10 w-10 rounded-full shadow-sm border border-stone-100">
              <Printer className="w-5 h-5" />
            </button>
            <button onClick={toggleScreenAwake} className={cn("flex items-center justify-center h-10 w-10 rounded-full shadow-sm border border-stone-100", isScreenAwake ? "bg-yellow-400 text-yellow-900" : "bg-white/80 text-stone-700")}>
              {isScreenAwake ? <Lightbulb className="w-5 h-5 fill-current" /> : <LightbulbOff className="w-5 h-5" />}
            </button>
            <button onClick={handleShare} className="flex items-center justify-center bg-white/80 backdrop-blur-sm text-stone-700 h-10 w-10 rounded-full shadow-sm border border-stone-100">
              <Share2 className="w-5 h-5" />
            </button>
            <Link href={`/receta/${recipe.id}/editar`}>
              <button className="flex items-center justify-center bg-orange-100 text-orange-600 h-10 w-10 rounded-full shadow-sm border border-orange-200">
                <Pencil className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </div>

        <div className="flex flex-row gap-4 md:gap-10 items-center mt-6 w-full print:mt-0">
          <div className="flex-1 min-w-0">
            {/* ETIQUETA DE ÁLBUM DINÁMICA */}
            <div className="flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full w-fit mb-3 print:hidden">
              <RecipeIcon name={recipe.album_icono} className="w-4 h-4" />
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider">
                {recipe.album_nombre || "Receta de Mamá"}
              </span>
            </div>

            <h1 className={cn("text-3xl sm:text-3xl md:text-5xl font-bold text-stone-800 leading-[1.1] drop-shadow-sm break-words", recipe.fuente)}>
              {recipe.titulo}
            </h1>

            {isScreenAwake && (
              <div className="flex items-center gap-1.5 text-yellow-600 animate-pulse mt-3 print:hidden">
                <Lightbulb className="w-3 h-3 fill-current" />
                <span className="text-[9px] font-sans font-bold uppercase tracking-widest">Pantalla encendida</span>
              </div>
            )}
          </div>

          {/* FOTO DE PORTADA */}
          <div className="relative shrink-0">
            <div onClick={() => recipe.foto_url && setIsModalOpen(true)} className="w-24 h-32 sm:w-36 sm:h-48 md:w-52 md:h-72 bg-stone-100 rounded-2xl overflow-hidden shadow-lg border-4 border-white cursor-pointer transition-transform relative print:w-32 print:h-44">
              {recipe.foto_url ? (
                <img src={recipe.foto_url} className="w-full h-full object-cover" alt="Plato" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 p-2 bg-stone-50">
                  <ChefHat className="w-8 h-8 mb-2 opacity-20" />
                  <span className="text-[9px] font-bold uppercase tracking-tighter">Sin foto</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white backdrop-blur-[2px]">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BLOQUE: INGREDIENTES Y PASOS */}
      <div className={cn("px-6 pt-2 space-y-10 print:hidden", recipe.fuente)}>
        <div>
          <h3 className="font-sans font-bold text-stone-400 text-xs tracking-widest uppercase mb-4 border-b border-orange-200 pb-2">Ingredientes</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-x-12">
            {recipe.ingredientes.map((ing: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-xl text-stone-700 text-ingredientes-print">
                <div className="w-2 h-2 mt-2.5 rounded-full bg-orange-400 shrink-0" />
                <span className="text-left leading-tight select-text">{ing}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-sans font-bold text-stone-400 text-xs tracking-widest uppercase mb-4 border-b border-orange-200 pb-2">Preparación</h3>
          <div className="space-y-4">
            {recipe.pasos.map((paso: string, i: number) => renderStepWithTimer(paso, i))}
          </div>
        </div>

        {/* NOTAS PRIVADAS */}
        {recipe.notas && (
          <div className="bg-yellow-50/50 p-6 rounded-3xl border border-yellow-100 relative print:hidden">
            <span className="absolute -top-3 left-6 bg-yellow-100 text-yellow-700 px-2 py-0.5 text-[10px] font-sans font-bold uppercase rounded-full">Notas de Mamá</span>
            <p className="text-stone-600 italic text-center text-lg leading-relaxed">"{recipe.notas}"</p>
          </div>
        )}
      </div>

      {/* --- VISTA DE IMPRESIÓN (SOLO SALE EN PDF) --- */}
      <div className="hidden print:block">
        <div className={cn("p-[15mm] min-h-[297mm] flex flex-col relative bg-white", recipe.fuente)}>
            {/* Cabecera Libro */}
            <div className="flex justify-between items-start gap-6 mb-6 border-b-2 border-stone-100 pb-6">
                <h2 className="text-2xl font-bold leading-tight text-stone-800 flex-1">{recipe.titulo}</h2>
                {recipe.foto_url && (
                    <div className="w-24 h-32 shrink-0 rounded-xl overflow-hidden shadow-md border-2 border-white rotate-1">
                        <img src={recipe.foto_url} className="w-full h-full object-cover" alt="" />
                    </div>
                )}
            </div>
            
            {/* Contenido Libro */}
            <div className="space-y-6 flex-1">
                <div>
                    <h3 className="text-[9px] font-bold text-orange-500 uppercase tracking-[0.2em] mb-3 border-l-4 border-orange-400 pl-3">Ingredientes</h3>
                    <ul className="grid grid-cols-2 gap-x-10 gap-y-1.5">
                        {recipe.ingredientes?.map((ing: any, i: number) => (
                            <li key={i} className="text-[11pt] text-stone-700 flex items-start gap-2 border-b border-stone-50 pb-0.5">
                                <span className="text-orange-400 mt-1.5 w-1 h-1 rounded-full bg-orange-400 shrink-0" />
                                {ing}
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h3 className="text-[9px] font-bold text-orange-500 uppercase tracking-[0.2em] mb-4 border-l-4 border-orange-400 pl-3">Modo de preparación</h3>
                    <div className="space-y-4">
                        {recipe.pasos?.map((paso: any, i: number) => (
                            <div key={i} className="flex gap-3 items-start break-inside-avoid">
                                <span className="text-orange-200 font-bold text-lg leading-none italic shrink-0">{i + 1}</span>
                                <p className="text-[12pt] leading-relaxed text-stone-700 flex-1 text-justify">{paso}</p>
                            </div>
                        ))}
                    </div>
                </div>
                {recipe.notas && (
                  <div className="mt-8 border-t border-stone-100 pt-4">
                    <p className="text-stone-500 italic text-[10pt]">Nota: "{recipe.notas}"</p>
                  </div>
                )}
            </div>
            <div className="absolute bottom-8 right-10 text-stone-300 text-[10px] italic">
                Álbum: {recipe.album_nombre || "Recetario Familiar"}
            </div>
        </div>
      </div>

      {/* MODAL: VISUALIZACIÓN DE IMAGEN MEJORADA */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center animate-in fade-in duration-200" 
          onClick={() => setIsModalOpen(false)}
        >
          {/* Botón cerrar con fondo para que se vea siempre */}
          <button className="absolute top-10 right-6 text-white/80 bg-stone-900/50 p-2 rounded-full backdrop-blur-md z-50">
            <X className="w-6 h-6" />
          </button>
          
          <img 
            src={recipe.foto_url} 
            className="w-full max-h-screen object-contain" 
            alt="Foto ampliada" 
          />
        </div>
      )}

      {/* RECORTADOR DE IMAGEN (Cuando se sube nueva foto) */}
      {tempImage && (
        <ImageCropper image={tempImage} onCropComplete={handleProcessedImage} onCancel={() => setTempImage(null)} />
      )}

      {/* RENDERIZADO DEL TIMER FLOTANTE */}
      {activeTimerMinutes !== null && (
        <CookingTimer
          initialMinutes={activeTimerMinutes}
          onClose={() => setActiveTimerMinutes(null)}
        />
      )}
    </div>
  );
}