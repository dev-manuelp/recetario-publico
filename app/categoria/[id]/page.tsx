'use client';

/**
 * VISTA DE ÁLBUM ESPECÍFICO - MAQUETACIÓN E IMPRESIÓN
 */
import { useEffect, useState, use } from 'react';
import { getRecipesByAlbumIdAction, getAlbumsAction } from '@/app/actions/gallery-actions';
import { 
  Loader2, ArrowLeft, Printer, ChefHat 
} from "lucide-react";
import { cn } from "@/lib/utils";

import { RecipeIcon } from '@/lib/icons';

interface Recipe { 
  id: number; 
  titulo: string; 
  foto_url: string | null; 
  fuente: string; 
  ingredientes?: string[]; 
  pasos?: string[]; 
}

export default function CategoryPrintPage({ params }: { params: Promise<{ id: string }> }) {
  // --- RESOLUCIÓN DE PARÁMETROS DINÁMICOS ---
  const resolvedParams = use(params);
  
  // --- ESTADOS DE DATOS ---
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [album, setAlbum] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // --- CONFIGURACIÓN VISUAL ---
  const [overrideFont, setOverrideFont] = useState<string | null>(null);

  /**
   * CARGA DE RECETAS FILTRADAS POR ÁLBUM
   */
  useEffect(() => {
    async function loadData() {
      const albumId = parseInt(resolvedParams.id);
      if (!isNaN(albumId)) {
        const [recipesRes, albumsRes] = await Promise.all([
          getRecipesByAlbumIdAction(albumId),
          getAlbumsAction()
        ]);

        if (recipesRes.success) setRecipes(recipesRes.data);
        if (albumsRes.success) {
          const currentAlbum = albumsRes.data.find((a: any) => a.id === albumId);
          setAlbum(currentAlbum);
        }
      }
      setLoading(false);
    }
    loadData();
  }, [resolvedParams.id]);

  const fontOptions = [
    { id: null, label: 'Original' },
    { id: 'font-libro', label: 'Libro' },
    { id: 'font-rotulador', label: 'Rotulador' },
    { id: 'font-divertida', label: 'Divertida' },
    { id: 'font-great', label: 'Great' },
    { id: 'font-allura', label: 'Allura' },
    { id: 'font-courgette', label: 'Courgette' },
  ];

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-orange-500 w-10 h-10" />
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
      
      {/* PANEL DE CONTROL: ACCIONES DE INTERFAZ (OCULTO AL IMPRIMIR) */}
      <div className="fixed top-0 inset-x-0 bg-white/95 backdrop-blur-md border-b z-50 p-4 print:hidden shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <button onClick={() => window.history.back()} className="flex items-center gap-2 text-stone-600 font-bold hover:text-orange-600 transition-colors">
              <ArrowLeft className="w-5 h-5" /> Volver
            </button>
            <button onClick={() => window.print()} className="bg-orange-600 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all">
              <Printer className="w-5 h-5" /> Imprimir Álbum
            </button>
          </div>
          
          {/* SELECTOR DE FUENTE GLOBAL PARA LA IMPRESIÓN */}
          <div className="flex flex-wrap gap-2 justify-center border-t pt-3">
            {fontOptions.map((f) => (
              <button
                key={f.label}
                onClick={() => setOverrideFont(f.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                  overrideFont === f.id ? "bg-orange-600 border-orange-600 text-white shadow-md" : "bg-white border-stone-200 text-stone-500 hover:border-orange-300"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* BLOQUE: MAQUETACIÓN PARA IMPRESIÓN (A4) */}
      <div className="pt-32 print:pt-0">
        
        {/* PORTADA ESPECÍFICA DEL ÁLBUM */}
        <div className="h-[297mm] flex flex-col items-center justify-center text-center border-[12px] border-double border-stone-100 m-8 page-break-after-always">
          <div className="text-orange-500 mb-8 opacity-40">
            <RecipeIcon name={album?.icono} className="w-24 h-24" />
          </div>
          <h1 className="text-6xl font-bold text-stone-800 mb-4 uppercase tracking-tighter">
            {album?.nombre || 'Recetario'}
          </h1>
          <div className="w-20 h-1 bg-orange-400 mb-6 mx-auto"></div>
          <p className="text-2xl text-stone-400 italic font-serif">Las mejores recetas de Mamá</p>
          <p className="mt-10 text-stone-300 font-bold tracking-[0.3em] uppercase text-sm">
            {recipes.length} Recetas Guardadas
          </p>
        </div>

        {/* LISTADO DINÁMICO DE PÁGINAS DE RECETA */}
        <div className="max-w-[210mm] mx-auto">
          {recipes.sort((a,b) => a.titulo.localeCompare(b.titulo)).map((recipe) => (
            <div key={recipe.id} className={cn("page-break-before-always p-[15mm] min-h-[297mm] flex flex-col", overrideFont || recipe.fuente)}>
              <div className="flex justify-between items-start gap-6 mb-8 border-b-2 border-stone-100 pb-6">
                <h2 className="text-2xl font-bold flex-1 leading-tight text-stone-800">
                  {recipe.titulo}
                </h2>
                {recipe.foto_url && (
                  <img src={recipe.foto_url} className="w-24 h-32 object-cover rounded-2xl shadow-md border-4 border-white shrink-0 rotate-1" alt="" />
                )}
              </div>
              
              <div className="space-y-10 flex-1">
                {/* BLOQUE: INGREDIENTES */}
                <div className="w-full">
                  <h3 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-4 border-l-4 border-orange-400 pl-3">Ingredientes</h3>
                  <ul className="grid grid-cols-2 gap-x-10 gap-y-2">
                    {recipe.ingredientes?.map((ing, i) => (
                      <li key={i} className="text-[11pt] text-stone-700 flex items-start gap-2 border-b border-stone-50 pb-0.5">
                        <span className="text-orange-400 mt-2 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* BLOQUE: PREPARACIÓN */}
                <div className="w-full">
                  <h3 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-6 border-l-4 border-orange-400 pl-3">Modo de Preparación</h3>
                  <div className="space-y-6">
                    {recipe.pasos?.map((paso, i) => (
                      <div key={i} className="flex gap-4 items-start break-inside-avoid">
                        <span className="text-orange-200 font-bold text-2xl leading-none tabular-nums">{i + 1}</span>
                        <p className="text-[12pt] leading-relaxed text-stone-700 flex-1">{paso}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* PIE DE PÁGINA: IDENTIFICADOR DE ORIGEN */}
              <div className="text-right text-stone-300 text-[10px] italic mt-4 print:block hidden">
                Álbum: {album?.nombre}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ESTILOS DE IMPRESIÓN GLOBALES */}
      <style jsx global>{`
        @media print {
          .page-break-before-always { page-break-before: page; }
          .page-break-after-always { page-break-after: page; }
          body { background: white !important; -webkit-print-color-adjust: exact; }
          @page { margin: 0; size: A4; }
        }
      `}</style>
    </div>
  );
}