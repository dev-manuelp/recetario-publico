'use client';

/**
 * GENERADOR DE LIBRO DE COCINA - IMPRESIÓN COMPLETA
 */
import { useEffect, useState } from 'react';
import { getRecipesAction, getAlbumsAction } from '@/app/actions/gallery-actions';
import { 
  Loader2, ArrowLeft, Printer, Check 
} from "lucide-react";
import { cn } from "@/lib/utils";

import { RecipeIcon } from '@/lib/icons';

interface Album { id: number; nombre: string; icono: string; }
interface Recipe { 
  id: number; 
  titulo: string; 
  foto_url: string | null; 
  fuente: string; 
  album_id: number | null; 
  ingredientes?: string[]; 
  pasos?: string[]; 
}

export default function PrintAllPage() {
  // --- ESTADOS DE DATOS ---
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  // --- CONFIGURACIÓN DINÁMICA DE IMPRESIÓN ---
  const [overrideFont, setOverrideFont] = useState<string | null>(null);
  const [selectedAlbumIds, setSelectedAlbumIds] = useState<number[]>([]);

  /**
   * CARGA PARALELA DE RECETAS Y ÁLBUMES
   */
  useEffect(() => {
    async function loadData() {
      try {
        const [recipesRes, albumsRes] = await Promise.all([
          getRecipesAction(),
          getAlbumsAction()
        ]);
        if (recipesRes.data) setRecipes(recipesRes.data);
        if (albumsRes.data) {
            setAlbums(albumsRes.data);
            setSelectedAlbumIds(albumsRes.data.map((a: Album) => a.id));
        }
      } catch (error) {
        console.error("Error en la carga de datos:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const fontOptions = [
    { id: null, label: 'Original' },
    { id: 'font-libro', label: 'Libro' },
    { id: 'font-rotulador', label: 'Rotulador' },
    { id: 'font-divertida', label: 'Divertida' },
    { id: 'font-great', label: 'Great' },
    { id: 'font-allura', label: 'Allura' },
    { id: 'font-courgette', label: 'Courgette' },
  ];

  /**
   * FILTRADO DE CONTENIDO POR ÁLBUM
   */
  const toggleAlbum = (id: number) => {
    setSelectedAlbumIds(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-orange-500 w-10 h-10" />
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
      
      {/* BLOQUE: INTERFAZ DE CONFIGURACIÓN (Oculta al imprimir) */}
      <div className="fixed top-0 inset-x-0 bg-white/95 backdrop-blur-md border-b z-50 p-4 print:hidden shadow-md">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => window.history.back()} className="flex items-center gap-2 text-stone-600 font-bold active:scale-95 transition-all">
              <ArrowLeft className="w-5 h-5" /> Volver
            </button>
            <button onClick={() => window.print()} className="bg-orange-600 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg hover:bg-orange-700 transition-colors">
              <Printer className="w-5 h-5" /> Imprimir Libro
            </button>
          </div>
          
          {/* SELECCIÓN DE CONTENIDO */}
          <div className="flex flex-wrap gap-2 justify-center border-t pt-3">
            <span className="text-[10px] font-bold text-stone-400 uppercase flex items-center mr-2 tracking-widest">Álbumes:</span>
            {albums.map((album) => (
              <button
                key={album.id}
                onClick={() => toggleAlbum(album.id)}
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold transition-all border flex items-center gap-1.5",
                  selectedAlbumIds.includes(album.id) 
                    ? "bg-stone-800 border-stone-800 text-white" 
                    : "bg-white border-stone-200 text-stone-400"
                )}
              >
                {selectedAlbumIds.includes(album.id) && <Check className="w-3 h-3" />}
                <RecipeIcon name={album.icono} className="w-3 h-3" />
                {album.nombre}
              </button>
            ))}
          </div>

          {/* CONTROL DE ESTILO GLOBAL */}
          <div className="flex flex-wrap gap-2 justify-center border-t pt-3">
            <span className="text-[10px] font-bold text-stone-400 uppercase flex items-center mr-2 tracking-widest">Letra del Libro:</span>
            {fontOptions.map((f) => (
              <button
                key={f.label}
                onClick={() => setOverrideFont(f.id)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all border",
                  overrideFont === f.id 
                    ? "bg-orange-600 border-orange-600 text-white shadow-md" 
                    : "bg-white border-stone-200 text-stone-500 hover:border-orange-300"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* BLOQUE: MAQUETACIÓN PARA IMPRESIÓN (A4) */}
      <div className="pt-48 print:pt-0">
        
        {/* PORTADA DEL LIBRO */}
        <div className="h-[297mm] flex flex-col items-center justify-center text-center p-12 page-break-after-always">
          <div className="border-[12px] border-double border-stone-200 p-16 w-full max-w-2xl">
              <span className="text-orange-500 font-bold tracking-[0.4em] uppercase mb-4 block text-xs">Colección Familiar</span>
              <h1 className="text-5xl font-bold text-stone-800 mb-6 tracking-tighter uppercase leading-none font-sans">El Libro de Mamá</h1>
              <div className="w-20 h-1 bg-orange-400 mx-auto mb-8"></div>
              <p className="text-xl text-stone-400 italic font-serif">Nuestras mejores recetas</p>
          </div>
        </div>

        {/* RENDERIZADO DINÁMICO POR CATEGORÍAS */}
        <div className="max-w-[210mm] mx-auto">
          {albums
            .filter(a => selectedAlbumIds.includes(a.id))
            .map((album) => {
                const albumRecipes = recipes.filter(r => r.album_id === album.id);
                if (albumRecipes.length === 0) return null;

                return (
                <div key={album.id}>
                    {/* SEPARADOR DE ÁLBUM */}
                    <div className="h-[297mm] flex flex-col items-center justify-center text-center page-break-before-always">
                        <div className="text-orange-500 mb-8 opacity-40">
                          <RecipeIcon name={album.icono} className="w-20 h-20" />
                        </div>
                        <h2 className="text-4xl font-bold text-stone-800 uppercase tracking-widest">{album.nombre}</h2>
                        <div className="w-16 h-1 bg-orange-200 mt-8 mb-4 mx-auto"></div>
                        <p className="text-stone-400 italic text-base">{albumRecipes.length} recetas</p>
                    </div>

                    {/* PÁGINAS DE RECETA INDIVIDUALES */}
                    {albumRecipes.sort((a,b) => a.titulo.localeCompare(b.titulo)).map((recipe) => (
                    <div key={recipe.id} className={cn("page-break-before-always p-[15mm] min-h-[297mm] flex flex-col relative", overrideFont || recipe.fuente)}>
                        <div className="flex justify-between items-start gap-6 mb-6 border-b-2 border-stone-100 pb-6">
                            <h2 className="text-2xl font-bold leading-tight text-stone-800 flex-1">{recipe.titulo}</h2>
                            {recipe.foto_url && (
                                <div className="w-24 h-32 shrink-0 rounded-xl overflow-hidden shadow-md border-2 border-white rotate-1">
                                    <img src={recipe.foto_url} className="w-full h-full object-cover" alt="" />
                                </div>
                            )}
                        </div>
                        
                        {/* CONTENIDO TÉCNICO DE LA RECETA */}
                        <div className="space-y-6 flex-1">
                            <div>
                                <h3 className="text-[9px] font-bold text-orange-500 uppercase tracking-[0.2em] mb-3 border-l-4 border-orange-400 pl-3">Ingredientes</h3>
                                <ul className="grid grid-cols-2 gap-x-10 gap-y-1.5">
                                    {recipe.ingredientes?.map((ing, i) => (
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
                                    {recipe.pasos?.map((paso, i) => (
                                        <div key={i} className="flex gap-3 items-start break-inside-avoid">
                                            <span className="text-orange-200 font-bold text-lg leading-none italic shrink-0">{i + 1}</span>
                                            <p className="text-[12pt] leading-relaxed text-stone-700 flex-1">{paso}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        {/* IDENTIFICADOR DE PÁGINA (Solo para impresión) */}
                        <div className="absolute bottom-8 right-10 text-stone-300 text-[10px] print:block hidden italic">
                            Álbum: {album.nombre}
                        </div>
                    </div>
                    ))}
                </div>
                );
          })}
        </div>
      </div>

      {/* ESTILOS GLOBALES: CONTROL DE SALTO DE PÁGINA Y MARGENES */}
      <style jsx global>{`
        @media print {
          .page-break-before-always { page-break-before: page; }
          .page-break-after-always { page-break-after: page; }
          body { background: white !important; -webkit-print-color-adjust: exact; }
          @page { 
            margin: 0; 
            size: A4;
          }
        }
      `}</style>
    </div>
  );
}