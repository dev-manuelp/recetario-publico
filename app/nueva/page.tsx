'use client';

/**
 * PÁGINA DE CREACIÓN DE RECETAS - ESCANEO, GALERÍA Y MANUAL
 */
import { useState, useEffect, useRef } from 'react';
import { scanRecipeAction, type RecipeData } from '@/app/actions/scan-recipe';
import { saveRecipeAction } from '@/app/actions/save-recipe';
import { getAlbumsAction, createAlbumAction } from '@/app/actions/album-actions';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Camera, Save, Loader2, Trash2, ImagePlus, RotateCcw, Palette, Plus,
  ChefHat, ArrowLeft, PenTool, Image as ImageIcon, CornerDownLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';
import ImageCropper from '@/components/ui/ImageCropper';
import { RecipeIcon, ALBUM_ICONS_LIST } from '@/lib/icons';

const FONTS = [
  { id: 'great', name: 'Muy Elegante', class: 'font-great' },
  { id: 'allura', name: 'Letra Fluida', class: 'font-allura' },
  { id: 'courgette', name: 'Gourmet', class: 'font-courgette' },
  { id: 'rotulador', name: 'Rotulador', class: 'font-rotulador' },
  { id: 'divertida', name: 'Divertida', class: 'font-divertida' },
  { id: 'libro', name: 'Libro de Cocina', class: 'font-libro' },
];

export default function NewRecipePage() {
  // --- ESTADOS PRINCIPALES ---
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [selectedFont, setSelectedFont] = useState(FONTS[3]); // Default: Rotulador

  // --- GESTIÓN DE IMÁGENES (ESCANEO Y PLATO) ---
  const [recipePages, setRecipePages] = useState<File[]>([]);
  const [previewPages, setPreviewPages] = useState<string[]>([]);
  const [dishPhoto, setDishPhoto] = useState<File | null>(null);
  const [dishPhotoPreview, setDishPhotoPreview] = useState<string | null>(null);
  const [tempCropImage, setTempCropImage] = useState<string | null>(null);

  // Refs para los inputs ocultos
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const dishPhotoInputRef = useRef<HTMLInputElement>(null);

  // --- GESTIÓN DE ÁLBUMES ---
  const [albums, setAlbums] = useState<any[]>([]);
  const [showAlbumSelector, setShowAlbumSelector] = useState(false);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumIcon, setNewAlbumIcon] = useState(ALBUM_ICONS_LIST[0]);
  const [creatingAlbumLoading, setCreatingAlbumLoading] = useState(false);

  const [isLoadingDrawerOpen, setIsLoadingDrawerOpen] = useState(false);
  const [showFontSelector, setShowFontSelector] = useState(false);
  const router = useRouter();

  useEffect(() => { refreshAlbums(); }, []);

  async function refreshAlbums() {
    const res = await getAlbumsAction();
    if (res.data) setAlbums(res.data);
  }

  // --- NUEVA FUNCIONALIDAD: MODO MANUAL ---
  const startManualMode = () => {
    // Creamos una receta vacía directamente
    setRecipe({
      titulo: "",
      ingredientes: [""],
      pasos: [""],
      notas: "",
    });

    setSelectedFont(FONTS.find(f => f.id === 'libro') || FONTS[0]);
  };

  // --- GESTIÓN DE PÁGINAS ESCANEADAS ---
  async function handleAddPage(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // --- CONFIGURACIÓN SEGURA PARA 5-6 PÁGINAS ---
    const options = { 
      maxSizeMB: 0.3,          // Bajamos a 0.3MB. (5 fotos x 0.4 = 2MB aprox, que es un peso razonable para enviar a la IA sin perder calidad de texto)
      maxWidthOrHeight: 1280,  //estándar HD. La IA lee perfecto y pesa la mitad que 1920.
      useWebWorker: true, 
      fileType: 'image/jpeg',
      initialQuality: 0.6      // Calidad visual media (suficiente para texto)
    };
    // ---------------------------------------------

    try {
      const compressed = await imageCompression(file, options);
      setRecipePages(prev => [...prev, compressed]);
      setPreviewPages(prev => [...prev, URL.createObjectURL(compressed)]);
    } catch (error) {
      console.error("Error comprimiendo página", error);
    }
    e.target.value = "";
  }

  async function startScanning() {
    if (recipePages.length === 0) return;
    setLoading(true);
    setIsLoadingDrawerOpen(true);

    try {
      const formData = new FormData();
      recipePages.forEach((file) => { formData.append('images', file); });
      const data = await scanRecipeAction(formData);

      if (data && !data.error) {
        setRecipe(data);
        setShowFontSelector(true);
      } else {
        alert("No pudimos leer las recetas.");
      }
    } catch (err) {
      alert("Error de conexión.");
    } finally {
      setLoading(false);
      setIsLoadingDrawerOpen(false);
    }
  }

  const removePage = (index: number) => {
    setRecipePages(prev => prev.filter((_, i) => i !== index));
    setPreviewPages(prev => prev.filter((_, i) => i !== index));
  };

  // --- LOGICA DE LISTAS DINÁMICAS (AÑADIR/BORRAR) ---
  const addIngredient = () => {
    if (!recipe) return;
    setRecipe({ ...recipe, ingredientes: [...recipe.ingredientes, ""] });
  };

  const removeIngredient = (index: number) => {
    if (!recipe) return;
    const newIng = recipe.ingredientes.filter((_, i) => i !== index);
    setRecipe({ ...recipe, ingredientes: newIng });
  };

  const addStep = () => {
    if (!recipe) return;
    setRecipe({ ...recipe, pasos: [...recipe.pasos, ""] });
  };

  const removeStep = (index: number) => {
    if (!recipe) return;
    const newPasos = recipe.pasos.filter((_, i) => i !== index);
    setRecipe({ ...recipe, pasos: newPasos });
  };

  // Función para insertar un paso intermedio
  const addStepAfter = (index: number) => {
    if (!recipe) return;
    const newPasos = [...recipe.pasos];
    newPasos.splice(index + 1, 0, "");
    setRecipe({ ...recipe, pasos: newPasos });
  };

  // --- FOTO DEL PLATO ---
  const handleDishPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setTempCropImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const handleCropComplete = async (blob: Blob) => {
    setTempCropImage(null);
    const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true, fileType: 'image/jpeg' };

    try {
      const fileToCompress = new File([blob], "dish.jpg", { type: "image/jpeg" });
      const compressed = await imageCompression(fileToCompress, options);
      setDishPhoto(compressed);
      setDishPhotoPreview(URL.createObjectURL(compressed));
    } catch (error) {
      console.error("Error al procesar recorte:", error);
    }
  };

  const removeDishPhoto = () => {
    setDishPhoto(null);
    setDishPhotoPreview(null);
  };

  // --- GUARDADO ---
  const handlePreSave = () => {
    setShowAlbumSelector(true);
    setIsCreatingAlbum(false);
  };

  const handleQuickCreateAlbum = async () => {
    if (!newAlbumName.trim()) return;
    setCreatingAlbumLoading(true);
    const res = await createAlbumAction(newAlbumName, newAlbumIcon);
    if (res.success) {
      const updatedAlbumsRes = await getAlbumsAction();
      let newAlbumId = null;
      if (updatedAlbumsRes.data) {
        setAlbums(updatedAlbumsRes.data);
        const created = updatedAlbumsRes.data.find((a: any) => a.nombre === newAlbumName);
        if (created) newAlbumId = created.id;
      }
      await handleFinalSave(newAlbumId);
    } else {
      alert("Error creando álbum");
      setCreatingAlbumLoading(false);
    }
  };

  const handleFinalSave = async (albumId: number | null) => {
    if (!recipe) return;
    setSaving(true);
    setShowAlbumSelector(false);

    // Filtramos las líneas vacías antes de guardar
    const cleanRecipe = {
      ...recipe,
      ingredientes: recipe.ingredientes.filter(i => i.trim() !== ""),
      pasos: recipe.pasos.filter(p => p.trim() !== "")
    };

    const formData = new FormData();
    formData.append('data', JSON.stringify(cleanRecipe));
    formData.append('font', selectedFont.class);
    formData.append('albumId', albumId ? albumId.toString() : 'null');

    if (dishPhoto) { formData.append('dishImage', dishPhoto); }

    const result = await saveRecipeAction(formData);
    if (result.success) { router.push('/'); }
    else { alert("Error: " + result.error); setSaving(false); }
  };

  return (
    // CAMBIO AQUI: Contenedor exterior que maneja SOLO el fondo y altura total
    <div className="min-h-screen w-full bg-[#FBF7F4]">

      {/* Contenedor interior: Centrado y con límites de anchura (ahora más ancho para iPad Pro) */}
      <div className="p-4 w-full mx-auto max-w-md md:max-w-4xl lg:max-w-6xl xl:max-w-[1600px] pb-40 relative">

        {/* INPUTS OCULTOS */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          ref={cameraInputRef}
          onChange={handleAddPage}
        />
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={galleryInputRef}
          onChange={handleAddPage}
        />

        {/* BLOQUE INICIAL: SELECCIÓN DE MÉTODO */}
        {!recipe && !loading && (
          <div className="text-center py-6 relative animate-in fade-in duration-500">

            <div className="absolute top-0 left-0">
              <Link href="/">
                <Button variant="ghost" className="h-10 w-10 rounded-full p-0 bg-white border border-stone-100">
                  <ArrowLeft className="w-5 h-5 text-stone-600" />
                </Button>
              </Link>
            </div>

            <div className="mt-12 mb-8">
              <h1 className="text-3xl font-rotulador text-stone-800 mb-2">Nueva Receta</h1>
              <p className="text-stone-500 text-sm">¿Cómo quieres añadirla hoy?</p>
            </div>

            {/* MENÚ DE OPCIONES */}
            {recipePages.length === 0 ? (
              <div className="grid grid-cols-1 gap-4 max-w-xs mx-auto">
                {/* OPCIÓN 1: CÁMARA */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="group relative flex items-center gap-4 p-4 bg-white rounded-2xl border-2 border-orange-100 shadow-sm hover:border-orange-400 hover:shadow-md transition-all active:scale-95 text-left"
                >
                  <div className="bg-orange-100 p-3 rounded-full group-hover:bg-orange-200 transition-colors">
                    <Camera className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-800 text-lg">Hacer Foto</h3>
                    <p className="text-stone-400 text-xs">Escanear papel al instante</p>
                  </div>
                </button>

                {/* OPCIÓN 2: GALERÍA */}
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="group relative flex items-center gap-4 p-4 bg-white rounded-2xl border-2 border-stone-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all active:scale-95 text-left"
                >
                  <div className="bg-blue-50 p-3 rounded-full group-hover:bg-blue-100 transition-colors">
                    <ImageIcon className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-800 text-lg">Galería</h3>
                    <p className="text-stone-400 text-xs">Subir captura o foto guardada</p>
                  </div>
                </button>

                {/* OPCIÓN 3: MANUAL */}
                <div className="flex items-center gap-4 my-2">
                  <div className="h-px bg-stone-200 flex-1"></div>
                  <span className="text-stone-400 text-xs font-bold uppercase">O bien</span>
                  <div className="h-px bg-stone-200 flex-1"></div>
                </div>

                <button
                  onClick={startManualMode}
                  className="group relative flex items-center gap-4 p-4 bg-white rounded-2xl border-2 border-stone-100 shadow-sm hover:border-stone-400 hover:shadow-md transition-all active:scale-95 text-left"
                >
                  <div className="bg-stone-100 p-3 rounded-full group-hover:bg-stone-200 transition-colors">
                    <PenTool className="w-6 h-6 text-stone-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-800 text-lg">Escribir</h3>
                    <p className="text-stone-400 text-xs">Añadir manualmente sin foto</p>
                  </div>
                </button>
              </div>
            ) : (
              /* VISTA PRE-ANÁLISIS */
              <div>
                <div className="flex gap-4 overflow-x-auto p-4 mb-6 justify-center no-scrollbar">
                  {previewPages.map((url, idx) => (
                    <div key={idx} className="relative w-24 h-32 flex-shrink-0 border-2 border-orange-200 rounded-lg overflow-hidden shadow-sm group">
                      <img src={url} className="w-full h-full object-cover" alt={`Página ${idx + 1}`} />
                      <div className="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center">
                        <button onClick={() => removePage(idx)} className="bg-red-500 text-white rounded-full p-1"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <span className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1 rounded">Pág {idx + 1}</span>
                    </div>
                  ))}

                  <div
                    onClick={() => cameraInputRef.current?.click()}
                    className="relative w-24 h-32 flex-shrink-0 border-2 border-dashed border-stone-300 rounded-lg flex flex-col items-center justify-center text-stone-400 hover:bg-stone-50 cursor-pointer active:scale-95 transition-transform"
                  >
                    <Plus className="w-8 h-8 mb-1" />
                    <span className="text-xs font-bold uppercase tracking-tighter">Más fotos</span>
                  </div>
                </div>

                <Button onClick={startScanning} className="h-14 px-8 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-lg shadow-xl hover:scale-105 transition-transform w-full max-w-xs">
                  <span className="mr-2">✨</span> Analizar Receta
                </Button>

                <button onClick={() => { setRecipePages([]); setPreviewPages([]); }} className="block mx-auto mt-4 text-stone-400 text-sm hover:text-red-500 underline">
                  Cancelar y volver
                </button>
              </div>
            )}
          </div>
        )}

        {/* OVERLAY DE CARGA */}
        <Drawer open={isLoadingDrawerOpen} onOpenChange={setIsLoadingDrawerOpen}>
          <DrawerContent className="bg-[#FBF7F4] border-t-orange-200 outline-none">
            <DrawerHeader>
              <DrawerTitle className="text-center font-rotulador text-3xl text-orange-800">Leyendo la receta...</DrawerTitle>
            </DrawerHeader>
            <div className="p-8 flex flex-col items-center justify-center">
              <Loader2 className="w-16 h-16 text-orange-500 animate-spin mb-6" />
              <p className="text-stone-500 text-sm text-center">Transcribiendo la receta...</p>
            </div>
          </DrawerContent>
        </Drawer>

        {/* BLOQUE DE EDICIÓN POST-TRANSCRIPCIÓN */}
        {recipe && !loading && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-end mb-2">
              <Button variant="outline" size="sm" onClick={() => setShowFontSelector(!showFontSelector)} className="text-stone-600 border-stone-300 rounded-full">
                <Palette className="w-4 h-4 mr-2" /> {showFontSelector ? "Listo" : "Cambiar letra"}
              </Button>
            </div>

            {showFontSelector && (
              <div className="mb-6 bg-white p-4 rounded-xl shadow-inner border border-stone-200 grid grid-cols-2 md:grid-cols-3 gap-3">
                {FONTS.map((font) => (
                  <button key={font.id} onClick={() => setSelectedFont(font)} className={cn("p-3 rounded-lg border text-xl text-center transition-all", font.class, selectedFont.id === font.id ? "border-orange-500 bg-orange-50 scale-105 shadow-sm" : "border-stone-100")}>
                    {font.name}
                  </button>
                ))}
              </div>
            )}

            <Card className="border-2 border-stone-200 bg-white shadow-xl mb-24 rounded-[2rem] overflow-hidden">
              <CardContent className={cn("p-6 md:p-10 text-xl leading-relaxed", selectedFont.class)}>

                {/* FOTO PLATO */}
                <div className="mb-8 flex justify-center">
                  <input type="file" accept="image/*" ref={dishPhotoInputRef} onChange={handleDishPhotoSelect} className="hidden" />
                  {dishPhotoPreview ? (
                    <div className="relative w-40 h-40 rounded-full shadow-md group border-4 border-orange-100">
                      <img src={dishPhotoPreview} alt="Plato" className="w-full h-full object-cover rounded-full" />
                      <button onClick={removeDishPhoto} className="absolute top-0 right-0 bg-red-500 text-white p-2 rounded-full shadow-lg active:scale-90"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <button onClick={() => dishPhotoInputRef.current?.click()} className="bg-orange-50 p-6 rounded-full border-2 border-dashed border-orange-200 hover:bg-orange-100 transition-colors mb-2"><ImagePlus className="w-10 h-10 text-orange-400" /></button>
                      <span className="text-[10px] text-stone-400 font-sans font-bold uppercase tracking-widest">Foto del plato terminado</span>
                    </div>
                  )}
                </div>

                {/* TÍTULO */}
                <div className="mb-6 border-b-2 border-orange-100 pb-2">
                  <Input
                    value={recipe.titulo || ''}
                    onChange={(e) => setRecipe({ ...recipe, titulo: e.target.value })}
                    placeholder="Título de la receta..."
                    className={cn(
                      "text-center border-none shadow-none h-auto bg-transparent focus-visible:ring-0",
                      "text-[16px] md:text-4xl font-bold text-orange-800 select-text",
                      selectedFont.class
                    )}
                  />
                </div>

                {/* INGREDIENTES */}
                <div className="mb-6 p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                  <h3 className="font-bold text-stone-400 text-[10px] tracking-widest mb-3 font-sans uppercase">Ingredientes</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {recipe.ingredientes.map((ing, i) => (
                      <div key={i} className="flex gap-2 items-center group">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-300 shrink-0" />
                        <Input
                          value={ing || ''}
                          onChange={(e) => {
                            const newIng = [...recipe.ingredientes];
                            newIng[i] = e.target.value;
                            setRecipe({ ...recipe, ingredientes: newIng });
                          }}
                          className={cn(
                            "bg-transparent border-0 border-b border-stone-100 focus:border-orange-300 rounded-none px-0 h-auto flex-1",
                            "text-[16px] select-text",
                            selectedFont.class
                          )}
                        />
                        <button onClick={() => removeIngredient(i)} className="p-2 text-stone-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addIngredient}
                    className="mt-4 flex items-center gap-2 text-orange-600 font-bold text-sm px-4 py-2 hover:bg-orange-100 rounded-lg transition-colors font-sans w-full justify-center"
                  >
                    <Plus className="w-4 h-4" /> Añadir Ingrediente
                  </button>
                </div>

                {/* PASOS */}
                <div className="mb-4">
                  <h3 className="font-bold text-stone-400 text-[10px] tracking-widest mb-3 font-sans uppercase">Preparación</h3>
                  <div className="space-y-4">
                    {recipe.pasos.map((paso, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <span className="font-bold text-orange-200 font-sans text-3xl tabular-nums pt-1">{i + 1}</span>
                        <Textarea
                          value={paso || ''}
                          onChange={(e) => {
                            const newPasos = [...recipe.pasos];
                            newPasos[i] = e.target.value;
                            setRecipe({ ...recipe, pasos: newPasos });
                          }}
                          className={cn(
                            "min-h-[80px] bg-transparent border-stone-100 resize-none rounded-xl p-3 flex-1",
                            "text-[16px] select-text",
                            selectedFont.class
                          )}
                        />
                        <div className="flex flex-col gap-1 mt-2">
                          <button onClick={() => removeStep(i)} className="p-1 text-stone-300 hover:text-red-500 transition-colors" title="Borrar este paso">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => addStepAfter(i)} className="p-1 text-stone-300 hover:text-green-600 transition-colors" title="Insertar paso debajo">
                            <CornerDownLeft className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={addStep} className="mt-4 flex items-center gap-2 text-orange-600 font-bold text-sm px-4 py-2 hover:bg-orange-50 rounded-lg transition-colors font-sans w-full justify-center">
                    <Plus className="w-4 h-4" /> Añadir Paso
                  </button>
                </div>

                {/* NOTAS */}
                <div className="mt-8 p-5 bg-yellow-50 rounded-2xl border-2 border-yellow-100 border-dashed">
                  <Textarea value={recipe.notas || ''} onChange={(e) => setRecipe({ ...recipe, notas: e.target.value })} placeholder="Notas adicionales de mamá..." className={cn("bg-transparent border-none text-center resize-none text-stone-600 italic", selectedFont.class)} />
                </div>
              </CardContent>
            </Card>

            {/* BARRA DE ACCIONES FIJA */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-stone-200 z-50 flex gap-4">
              <button onClick={() => { setRecipe(null); setRecipePages([]); setPreviewPages([]); }} className="flex-1 h-14 rounded-2xl border border-stone-200 font-bold bg-white text-stone-600 active:scale-95 transition-all">Cancelar</button>
              <Button onClick={handlePreSave} disabled={saving} className="flex-[2] h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white shadow-xl text-lg font-bold active:scale-95 transition-all">
                {saving ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />} Guardar Receta
              </Button>
            </div>
          </div>
        )}

        {/* SELECTOR DE ÁLBUM DESTINO */}
        {showAlbumSelector && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl">
              {!isCreatingAlbum ? (
                <>
                  <h3 className="text-xl font-bold text-stone-800 mb-6 text-center">¿Dónde la guardamos?</h3>
                  <div className="grid grid-cols-2 gap-3 mb-6 max-h-[40vh] overflow-y-auto no-scrollbar">
                    <button onClick={() => handleFinalSave(null)} className="flex flex-col items-center justify-center p-5 bg-stone-50 rounded-3xl border-2 border-transparent active:scale-95 transition-all">
                      <RecipeIcon name="all" className="w-10 h-10 mb-2 text-stone-400" />
                      <span className="font-bold text-stone-700 text-[10px] uppercase tracking-wider">General</span>
                    </button>
                    {albums.map(album => (
                      <button key={album.id} onClick={() => handleFinalSave(album.id)} className="flex flex-col items-center justify-center p-5 bg-white rounded-3xl border-2 border-stone-50 shadow-sm hover:border-orange-400 transition-all active:scale-95">
                        <RecipeIcon name={album.icono} className="w-10 h-10 mb-2 text-orange-600" />
                        <span className="font-bold text-stone-700 text-[10px] truncate w-full text-center uppercase tracking-wider">
                          {album.nombre}
                        </span>
                      </button>
                    ))}
                  </div>

                  <Button onClick={() => setIsCreatingAlbum(true)} className="w-full h-12 rounded-xl bg-orange-100 text-orange-600 hover:bg-orange-200 mb-2 font-bold gap-2">
                    <Plus className="w-4 h-4" /> Nuevo Álbum
                  </Button>
                  <button className="w-full text-stone-400 font-bold h-12" onClick={() => setShowAlbumSelector(false)}>Cerrar</button>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-stone-800 mb-6 text-center font-rotulador">Nuevo Álbum</h3>
                  <div className="flex gap-4 overflow-x-auto pb-6 mb-2 px-1 w-full no-scrollbar snap-x snap-mandatory">
                    {ALBUM_ICONS_LIST.map(iconKey => (
                      <button
                        key={iconKey}
                        onClick={() => setNewAlbumIcon(iconKey)}
                        className={cn(
                          "p-3 rounded-2xl transition-all border-2 shrink-0 flex items-center justify-center min-w-[70px] h-[70px] snap-start",
                          newAlbumIcon === iconKey
                            ? "bg-orange-100 border-orange-400 text-orange-600 scale-110 shadow-md"
                            : "border-stone-50 hover:bg-stone-50 text-stone-400"
                        )}
                      >
                        <RecipeIcon name={iconKey} className="w-8 h-8" />
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200 mb-6">
                    <RecipeIcon name={newAlbumIcon} className="w-8 h-8 text-orange-600" />
                    <Input value={newAlbumName} onChange={e => setNewAlbumName(e.target.value)} placeholder="Nombre..." className="bg-transparent border-none text-lg font-bold focus-visible:ring-0" autoFocus />
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 h-12 rounded-xl border border-stone-200 font-bold text-stone-500" onClick={() => setIsCreatingAlbum(false)}>Atrás</button>
                    <Button onClick={handleQuickCreateAlbum} disabled={creatingAlbumLoading} className="flex-1 h-12 rounded-xl bg-orange-600 text-white font-bold">
                      {creatingAlbumLoading ? <Loader2 className="animate-spin" /> : "Crear"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* COMPONENTE DE RECORTE (MODAL) */}
        {tempCropImage && (
          <ImageCropper
            image={tempCropImage}
            onCropComplete={handleCropComplete}
            onCancel={() => setTempCropImage(null)}
          />
        )}

      </div>
    </div>
  );
}