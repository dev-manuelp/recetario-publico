'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Printer, Loader2, ChefHat, X, Plus, FolderPlus,
  ArrowLeft, Trash2, CheckCircle2, Search
} from "lucide-react";
import Link from 'next/link';

// Acciones de servidor para persistencia
import {
  getRecipesAction,
  deleteRecipeAction,
  getAlbumsAction,
  deleteAlbumAction
} from '@/app/actions/gallery-actions';
import { createAlbumAction } from '@/app/actions/album-actions';

// Componentes y utilidades
import { RecipeIcon, ALBUM_ICONS_LIST } from '@/lib/icons';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import EditAlbumDialog from '@/components/EditAlbumDialog';

interface Album { id: number; nombre: string; icono: string; }
interface Recipe { id: number; titulo: string; foto_url: string | null; fuente: string; album_id: number | null; ingredientes?: string[]; }

export default function HomePage() {
  // --- ESTADOS DE DATOS ---
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DE ELIMINACIÓN ---
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [recipesInAlbumCount, setRecipesInAlbumCount] = useState(0);

  // --- ESTADOS DE UI Y FEEDBACK ---
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  // --- ESTADOS DE CREACIÓN DE ÁLBUM ---
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumIcon, setNewAlbumIcon] = useState(ALBUM_ICONS_LIST[0]);
  const [creatingAlbum, setCreatingAlbum] = useState(false);

  const router = useRouter();

  // Carga inicial de datos (Recipes y Albums)
  useEffect(() => { loadData(); }, []);

  /**
   * Lógica de filtrado de recetas por álbum y buscador global
   */
  useEffect(() => {
    let result = [...allRecipes];
    if (selectedAlbumId !== 'ALL') {
      result = result.filter(r => r.album_id === selectedAlbumId);
      result.sort((a, b) => a.titulo.localeCompare(b.titulo));
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r =>
        r.titulo.toLowerCase().includes(term) ||
        r.ingredientes?.some((ing: string) => ing.toLowerCase().includes(term))
      );
    } else {
      if (selectedAlbumId === 'ALL') {
        result = result.slice(0, 5); // Limita recientes en Home
      }
    }
    setFilteredRecipes(result);
  }, [selectedAlbumId, allRecipes, searchTerm]);

  /**
   * Fetching de datos desde Server Actions
   */
  async function loadData() {
    const [recipesRes, albumsRes] = await Promise.all([getRecipesAction(), getAlbumsAction()]);

    if (recipesRes.data) setAllRecipes(recipesRes.data);

    // Ordenar los álbumes alfabéticamente (A-Z)
    if (albumsRes.data) {
      const sortedAlbums = albumsRes.data.sort((a: any, b: any) =>
        a.nombre.localeCompare(b.nombre)
      );
      setAlbums(sortedAlbums);
    }

    setLoading(false);
  }

  /**
   * Trigger de feedback visual y háptico (vibración)
   */
  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccessAlert(true);
    if (navigator.vibrate) navigator.vibrate([50, 50]);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  // Función para actualizar visualmente el álbum al instante
  const handleAlbumUpdate = (id: number, nombre: string, icono: string) => {
    setAlbums(prevAlbums =>
      prevAlbums.map(album =>
        album.id === id ? { ...album, nombre, icono } : album
      )
    );
  };
  /**
   * Ejecución de borrado definitivo de receta
   */
  async function confirmDeleteRecipe() {
    if (!recipeToDelete) return;
    setIsDeleting(true);
    const result = await deleteRecipeAction(recipeToDelete.id, recipeToDelete.foto_url || '');
    if (result.success) {
      setAllRecipes(allRecipes.filter(r => r.id !== recipeToDelete.id));
      setRecipeToDelete(null);
      triggerSuccess("Receta borrada correctamente");
    }
    setIsDeleting(false);
  }

  /**
   * Ejecución de borrado de álbum y sus recetas vinculadas
   */
  async function confirmDeleteAlbum() {
    if (!albumToDelete) return;
    setIsDeleting(true);
    const result = await deleteAlbumAction(albumToDelete.id);
    if (result.success) {
      if (selectedAlbumId === albumToDelete.id) setSelectedAlbumId('ALL');
      setAllRecipes(allRecipes.filter(r => r.album_id !== albumToDelete.id));
      setAlbums(albums.filter(a => a.id !== albumToDelete.id));
      setAlbumToDelete(null);
      triggerSuccess("Álbum y recetas eliminados");
    }
    setIsDeleting(false);
  }

  /**
   * Creación de nuevo contenedor (Álbum)
   */
  async function handleCreateAlbum() {
    if (!newAlbumName.trim()) return;
    setCreatingAlbum(true);
    const res = await createAlbumAction(newAlbumName, newAlbumIcon);
    if (res.success) {
      await loadData();
      setShowCreateAlbum(false);
      setNewAlbumName("");
    }
    setCreatingAlbum(false);
  }

  /**
   * Pre-confirmación de borrado de álbum (Cálculo de recetas afectadas)
   */
  const handleRequestDeleteAlbum = (album: Album) => {
    const count = allRecipes.filter(r => r.album_id === album.id).length;
    setRecipesInAlbumCount(count);
    setAlbumToDelete(album);
  };

  /**
   * Lógica de pulsación larga para activar Modo Edición
   */
  const handleTouchStart = () => {
    if (longPressTimer) clearTimeout(longPressTimer);
    const timer = setTimeout(() => {
      setIsEditMode(true);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 800);
    setLongPressTimer(timer);
  };

  const handleTouchMove = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7F4] px-4 pt-1 pb-28 max-w-5xl mx-auto" onClick={() => setIsEditMode(false)}>

      {/* Alerta flotante de operación exitosa */}
      {showSuccessAlert && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top duration-300">
          <div className="bg-stone-800 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-stone-600">
            <div className="bg-green-500 rounded-full p-1"><CheckCircle2 className="w-4 h-4 text-white" /></div>
            <span className="font-bold text-sm">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Modal de confirmación de borrado (Receta o Álbum) */}
      {(recipeToDelete || albumToDelete) && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-100 p-4 rounded-full mb-4 animate-pulse"><Trash2 className="w-8 h-8 text-red-600" /></div>
              <h3 className="text-xl font-bold text-stone-800 mb-2">{recipeToDelete ? "¿Borrar Receta?" : "¿Eliminar Álbum?"}</h3>
              <div className="mb-6">
                {recipeToDelete ? (
                  <p className="text-stone-500 text-sm">Vas a borrar <strong>"{recipeToDelete.titulo}"</strong> para siempre.</p>
                ) : (
                  <>
                    <p className="text-stone-600 mb-2">Vas a eliminar el álbum <strong>"{albumToDelete?.nombre}"</strong>.</p>
                    {recipesInAlbumCount > 0 && (
                      <div className="bg-orange-50 p-3 rounded-xl border border-orange-200 text-sm text-orange-800">
                        ⚠️ Atención: Se borrarán también sus <strong>{recipesInAlbumCount} recetas</strong>.
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="flex gap-3 w-full">
                <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => { setRecipeToDelete(null); setAlbumToDelete(null); }}>Cancelar</Button>
                <Button className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold" onClick={recipeToDelete ? confirmDeleteRecipe : confirmDeleteAlbum} disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="animate-spin" /> : "Confirmar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal creación de álbum y selector de icono centralizado */}
      {showCreateAlbum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-stone-800 mb-4 text-center tracking-tight">Nuevo Álbum</h3>

            <div className="flex gap-4 overflow-x-auto pb-6 pt-2 mb-4 px-2 w-full no-scrollbar justify-start snap-x snap-mandatory">
              {ALBUM_ICONS_LIST.map(iconKey => (
                <button
                  key={iconKey}
                  onClick={() => setNewAlbumIcon(iconKey)}
                  className={cn(
                    "p-3 rounded-2xl transition-all border-2 shrink-0 flex items-center justify-center min-w-[75px] h-[75px] snap-start",
                    newAlbumIcon === iconKey
                      ? "bg-orange-100 border-orange-400 text-orange-600 scale-110 shadow-md"
                      : "bg-white border-stone-100 text-stone-400 hover:bg-stone-50"
                  )}
                >
                  <RecipeIcon name={iconKey} className="w-8 h-8" />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200 mb-6">
              <RecipeIcon name={newAlbumIcon} className="w-8 h-8 text-orange-600" />
              <Input value={newAlbumName} onChange={e => setNewAlbumName(e.target.value)} placeholder="Nombre del álbum..." className="bg-transparent border-none text-lg font-bold focus-visible:ring-0" autoFocus />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setShowCreateAlbum(false)}>Cancelar</Button>
              <Button className="flex-1 h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold" onClick={handleCreateAlbum} disabled={creatingAlbum}>{creatingAlbum ? <Loader2 className="animate-spin" /> : "Crear"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Cabecera visual de la App */}
      <div className="flex items-center justify-center gap-4 mb-6 mt-4 px-2">
        <div className="bg-orange-100 p-4 rounded-full shadow-sm shrink-0"><ChefHat className="w-10 h-10 text-orange-600" /></div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-stone-800 font-rotulador leading-none">Cocina de mamá</h1>
          <p className="text-stone-500 text-sm mt-1">Recetario Familiar</p>
        </div>
      </div>

      {/* Input de búsqueda global */}
      <div className="max-w-md mx-auto mb-6 px-2 relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-orange-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar arroz, postre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={cn(
            "w-full pl-12 pr-10 py-4 rounded-2xl border-2 border-stone-100 bg-white shadow-sm",
            "focus:border-orange-300 focus:ring-4 focus:ring-orange-100 outline-none transition-all",
            "text-stone-700 font-bold text-[16px] select-text touch-manipulation"
          )}
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-4 flex items-center text-stone-400 hover:text-stone-600 active:scale-90 transition-transform">
            <X className="h-5 w-5 bg-stone-100 rounded-full p-0.5" />
          </button>
        )}
      </div>

      {/* Sección de navegación por Álbumes */}
      <div className="mb-2 max-w-4xl mx-auto px-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-stone-800 text-2xl font-sans">Mis Álbumes</h2>
          <div className="flex gap-2">
            <Link href="/imprimir-todo">
              <Button variant="ghost" size="sm" className="text-stone-500 bg-stone-100 hover:bg-stone-200 rounded-full px-4 border border-stone-200 shadow-sm transition-all text-xs h-9">
                <Printer className="w-4 h-4 mr-2" /> Libro Total
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-full px-4 h-9 text-xs font-bold" onClick={() => setShowCreateAlbum(true)}>
              <FolderPlus className="w-4 h-4 mr-2" /> Nuevo
            </Button>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-4 pt-1 -mx-2 px-2 no-scrollbar snap-x snap-mandatory">
          {/* Categoría general 'Todo' */}
          <div
            onClick={() => setSelectedAlbumId('ALL')}
            className={cn(
              "rounded-2xl p-3 shadow-md flex flex-col justify-between h-28 min-w-[110px] cursor-pointer border-2 transition-all relative snap-start shrink-0",
              selectedAlbumId === 'ALL' ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-600 border-stone-100"
            )}
          >
            <RecipeIcon name="all" className={cn("w-8 h-8", selectedAlbumId === 'ALL' ? "text-orange-400" : "text-stone-400")} />
            <span className="font-bold text-xs uppercase tracking-wider">Todo</span>
            <span className={cn("absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full", selectedAlbumId === 'ALL' ? "bg-stone-700 text-stone-300" : "bg-stone-100 text-stone-400")}>{allRecipes.length}</span>
          </div>

          {/* Listado dinámico de álbumes personalizados */}
          {albums.map(album => {
            const count = allRecipes.filter(r => r.album_id === album.id).length;
            return (
              <div
                key={album.id}
                onMouseDown={handleTouchStart}
                onMouseUp={handleTouchEnd}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={(e) => { e.stopPropagation(); if (!isEditMode) setSelectedAlbumId(album.id); }}
                className={cn(
                  "rounded-2xl p-3 shadow-sm flex flex-col justify-between h-28 min-w-[110px] relative border-2 select-none transition-all snap-start shrink-0",
                  selectedAlbumId === album.id ? "bg-orange-50 border-orange-500 shadow-orange-100" : "bg-white border-stone-100",
                  isEditMode ? "animate-[wiggle_0.3s_ease-in-out_infinite] cursor-pointer" : "active:scale-95"
                )}
              >
                <RecipeIcon name={album.icono} className="w-8 h-8 text-orange-600" />

                {/* --- AQUI ESTA EL CAMBIO: Título + Botón Editar --- */}
                <div className="flex items-center justify-center w-full relative z-10 gap-1">
                  <span className="font-bold text-stone-700 truncate text-xs uppercase tracking-wider max-w-[80px]">
                    {album.nombre}
                  </span>
                  {!isEditMode && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <EditAlbumDialog
                        album={album}
                        onAlbumUpdated={handleAlbumUpdate} 
                      />
                    </div>
                  )}
                </div>

                <span className={cn("absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-colors", selectedAlbumId === album.id ? "bg-orange-200 text-orange-800" : "bg-stone-100 text-stone-400")}>{count}</span>
                {isEditMode && <button onClick={(e) => { e.stopPropagation(); handleRequestDeleteAlbum(album); }} className="absolute -top-2 -right-2 z-20 bg-stone-700 text-white p-1.5 rounded-full shadow-lg border-2 border-white"><X className="w-3 h-3" /></button>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Listado de Recetas según filtro */}
      <div className="max-w-5xl mx-auto px-2">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-bold text-stone-800 text-2xl font-sans text-left">
            {selectedAlbumId === 'ALL' ? (searchTerm ? "Resultados" : "Recetas Recientes") : albums.find(a => a.id === selectedAlbumId)?.nombre}
          </h2>
          {selectedAlbumId !== 'ALL' && (
            <Link href={`/categoria/${selectedAlbumId}`}>
              <Button variant="outline" size="sm" className="bg-white border-stone-200 text-stone-600 hover:bg-stone-50 rounded-full shadow-sm px-4">
                <Printer className="w-4 h-4 mr-2 text-orange-500" />
                Imprimir Libro
              </Button>
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
          {filteredRecipes.map((recipe) => (
            <div key={recipe.id} className={cn("relative transition-all select-none w-full", isEditMode ? "animate-[wiggle_0.3s_ease-in-out_infinite] cursor-pointer" : "active:scale-95")} onMouseDown={handleTouchStart} onMouseUp={handleTouchEnd} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onClick={(e) => { e.stopPropagation(); if (!isEditMode) router.push(`/receta/${recipe.id}`); }}>
              <Card className="overflow-hidden border-0 shadow-md rounded-2xl aspect-[3/4] relative bg-white h-full hover:shadow-xl transition-shadow">
                {recipe.foto_url ? (
                  <>
                    <img src={recipe.foto_url} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105" alt={recipe.titulo} />
                    <div className="absolute bottom-0 inset-x-0 h-2/3 bg-gradient-to-t from-black/80 to-transparent" />
                    <p className={cn("absolute bottom-3 left-3 right-3 text-white text-base font-bold leading-tight line-clamp-2", recipe.fuente)}>{recipe.titulo}</p>
                  </>
                ) : (
                  <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-3 text-center border-2 border-orange-50 bg-orange-50/30">
                    <ChefHat className="w-8 h-8 text-orange-400 mb-2 opacity-50" />
                    <p className={cn("text-stone-700 text-sm font-bold leading-tight line-clamp-3", recipe.fuente)}>{recipe.titulo}</p>
                  </div>
                )}
              </Card>
              {isEditMode && <button onClick={(e) => { e.stopPropagation(); setRecipeToDelete(recipe); }} className="absolute -top-3 -right-3 z-20 bg-red-500 text-white p-2 rounded-full border-2 border-white shadow-lg"><X className="w-4 h-4" /></button>}
            </div>
          ))}
        </div>
      </div>

      {/* Botón flotante para acceso rápido a escaneo de nueva receta */}
      <div className="fixed bottom-8 right-6 z-40">
        <Link href="/nueva">
          <Button className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-orange-600 shadow-2xl border-4 border-[#FBF7F4] hover:scale-110 active:scale-95 transition-transform flex items-center justify-center">
            <Plus className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </Button>
        </Link>
      </div>
    </div>
  );
}