'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { updateAlbumAction } from '@/app/actions/album-actions';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Loader2, X } from "lucide-react";
import { RecipeIcon, ALBUM_ICONS_LIST } from '@/lib/icons';
import { cn } from "@/lib/utils";

interface EditAlbumDialogProps {
  album: {
    id: number;
    nombre: string;
    icono: string;
  };
  // ESTA ES LA NOVEDAD: Una función para avisar al padre
  onAlbumUpdated: (id: number, newName: string, newIcon: string) => void;
}

export default function EditAlbumDialog({ album, onAlbumUpdated }: EditAlbumDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [name, setName] = useState(album.nombre);
  const [selectedIcon, setSelectedIcon] = useState(album.icono);
  
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const killEvent = (e: any) => {
    if (e && e.stopPropagation) {
        e.stopPropagation();
        e.nativeEvent?.stopImmediatePropagation();
    }
  };

  async function handleSave() {
    if (!name.trim()) return;
    setLoading(true);
    
    const res = await updateAlbumAction(album.id, name, selectedIcon);
    
    if (res.success) {
      // AQUÍ AVISAMOS A LA PÁGINA PRINCIPAL PARA QUE CAMBIE EL ICONO AL INSTANTE
      onAlbumUpdated(album.id, name, selectedIcon);
      
      setIsOpen(false);
      router.refresh();
    } else {
      alert("Error al actualizar el álbum");
    }
    setLoading(false);
  }

  // EL CONTENIDO DEL MODAL
  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 touch-none"
      onClick={(e) => { killEvent(e); setIsOpen(false); }}
      onTouchStart={(e) => { killEvent(e); }}
    >
      <div 
        className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-stone-100"
        onClick={killEvent}
        onMouseDown={killEvent}
        onTouchStart={killEvent}
      >
        <button 
          type="button"
          onClick={(e) => { killEvent(e); setIsOpen(false); }} 
          className="absolute top-4 right-4 text-stone-400 hover:text-red-500 bg-stone-100 rounded-full p-2 active:scale-90 transition-transform"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-center font-rotulador text-3xl text-orange-800 mb-6 mt-2">
          Editar Álbum
        </h2>

        <div className="space-y-6">
          <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-100 focus-within:border-orange-300 transition-colors">
            <div className="bg-white p-2 rounded-xl shadow-sm">
               <RecipeIcon name={selectedIcon} className="w-8 h-8 text-orange-600 shrink-0" />
            </div>
            <Input 
               value={name} 
               onChange={(e) => setName(e.target.value)} 
               onClick={killEvent}
               onTouchStart={killEvent}
               className="bg-transparent border-none text-lg font-bold focus-visible:ring-0 text-stone-700 p-0 h-auto" 
               placeholder="Nombre del álbum"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 block text-center">
              Elige un icono
            </label>
            <div 
              className="flex gap-3 overflow-x-auto pb-4 pt-2 px-2 no-scrollbar snap-x touch-pan-x"
              onMouseDown={killEvent} 
              onClick={killEvent}
            >
              {ALBUM_ICONS_LIST.map((iconKey) => (
                <button
                  key={iconKey}
                  type="button"
                  onClick={(e) => { killEvent(e); setSelectedIcon(iconKey); }}
                  className={cn(
                    "p-3 rounded-2xl transition-all border-2 shrink-0 flex items-center justify-center w-16 h-16 snap-start",
                    selectedIcon === iconKey
                      ? "bg-orange-100 border-orange-400 text-orange-600 scale-110 shadow-md"
                      : "border-stone-50 hover:bg-stone-50 text-stone-300 hover:text-stone-500"
                  )}
                >
                  <RecipeIcon name={iconKey} className="w-8 h-8 pointer-events-none" />
                </button>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xl shadow-lg active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Guardar Cambios"}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        onClick={(e) => { killEvent(e); setIsOpen(true); }}
        onMouseDown={killEvent}
        onTouchStart={killEvent}
        className="inline-flex relative z-30" 
      >
        <button 
          type="button"
          className="p-1.5 text-stone-300 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors ml-1 active:scale-125 cursor-pointer"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
}