'use client';

/**
 * PÁGINA DE EDICIÓN DE RECETA EXISTENTE
 */
import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  getRecipeByIdAction, 
  updateRecipeAction, 
  uploadDishPhotoAction, 
  deleteRecipeAction 
} from '@/app/actions/gallery-actions';
import { Button } from "@/components/ui/button";
// AÑADIDO: CornerDownLeft para el botón de insertar
import { Loader2, ArrowLeft, Type, Camera, ImagePlus, Trash2, Plus, CornerDownLeft } from "lucide-react";
import Link from 'next/link';
import { cn } from "@/lib/utils";
import imageCompression from 'browser-image-compression';
import ImageCropper from '@/components/ui/ImageCropper';

// Las fuentes sincronizadas con la página nueva
const FONTS = [
  { id: 'great', name: 'Muy Elegante', class: 'font-great' },
  { id: 'allura', name: 'Letra Fluida', class: 'font-allura' },
  // { id: 'italianno', name: 'Fina y Alta', class: 'font-italianno' }, // Quitada
  { id: 'courgette', name: 'Gourmet', class: 'font-courgette' },      // Nueva
  { id: 'rotulador', name: 'Rotulador', class: 'font-rotulador' },
  { id: 'divertida', name: 'Divertida', class: 'font-divertida' },
  { id: 'libro', name: 'Libro de Cocina', class: 'font-libro' },
];

export default function EditRecipePage() {
  const params = useParams();
  const router = useRouter();

  // --- ESTADOS DE CARGA Y PROCESO ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // --- ESTADOS DEL FORMULARIO ---
  const [titulo, setTitulo] = useState("");
  
  const [ingredientesList, setIngredientesList] = useState<string[]>([]);
  const [pasosList, setPasosList] = useState<string[]>([]);
  
  const [notas, setNotas] = useState("");
  const [fuente, setFuente] = useState("font-sans");
  const [currentPhoto, setCurrentPhoto] = useState("");

  // --- GESTIÓN DE CAMBIOS Y MODAL ---
  const [tempCropImage, setTempCropImage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * CARGA INICIAL DE DATOS
   */
  useEffect(() => {
    async function loadData() {
      const recipeId = params.id as string;
      const res = await getRecipeByIdAction(recipeId);
      if (res.success && res.data) {
        setTitulo(res.data.titulo || "");
        
        setIngredientesList(res.data.ingredientes || []);
        setPasosList(res.data.pasos || []);
        
        setNotas(res.data.notas || "");
        // Si la receta tenía la fuente antigua, la cambiamos a la nueva por defecto o a una segura
        const fontToUse = res.data.fuente === 'font-italianno' ? 'font-courgette' : (res.data.fuente || "font-sans");
        setFuente(fontToUse);
        
        setCurrentPhoto(res.data.foto_url || res.data.imagen || "");
      }
      setLoading(false);
      setHasChanges(false);
    }
    loadData();
  }, [params.id]);

  /**
   * TRACKING DE CAMBIOS
   */
  useEffect(() => {
    if (!loading) setHasChanges(true);
  }, [titulo, ingredientesList, pasosList, notas, fuente]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges && !saving) {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges, saving]);

  const handleBackWithConfirm = (e: React.MouseEvent) => {
    if (hasChanges && !saving) {
      const confirmLeave = window.confirm("¿Seguro que quieres salir? Tienes cambios sin guardar.");
      if (!confirmLeave) e.preventDefault();
    }
  };

  /**
   * GESTIÓN DE LISTAS
   */
  // INGREDIENTES
  const handleIngredientChange = (index: number, value: string) => {
    const newList = [...ingredientesList];
    newList[index] = value;
    setIngredientesList(newList);
  };
  const addIngredient = () => setIngredientesList([...ingredientesList, ""]);
  const removeIngredient = (index: number) => {
    setIngredientesList(ingredientesList.filter((_, i) => i !== index));
  };

  // PASOS
  const handlePasoChange = (index: number, value: string) => {
    const newList = [...pasosList];
    newList[index] = value;
    setPasosList(newList);
  };
  const addPaso = () => setPasosList([...pasosList, ""]);
  
  const removePaso = (index: number) => {
    setPasosList(pasosList.filter((_, i) => i !== index));
  };

  // --- NUEVA FUNCIÓN: INSERTAR PASO INTERMEDIO ---
  const addPasoAfter = (index: number) => {
    const newList = [...pasosList];
    // Insertamos una cadena vacía justo después del índice actual
    newList.splice(index + 1, 0, ""); 
    setPasosList(newList);
  };


  /**
   * ELIMINACIÓN
   */
  async function handleDelete() {
    if (!window.confirm(`¿Estás seguro de que quieres borrar "${titulo}"?`)) return;
    if (!window.confirm("Esta acción no se puede deshacer. ¿Borrar definitivamente?")) return;

    setIsDeleting(true);
    try {
      const result = await deleteRecipeAction(Number(params.id), currentPhoto);
      if (result.success) {
        setHasChanges(false);
        router.push('/');
        setTimeout(() => router.refresh(), 100);
      } else {
        alert("Error al eliminar: " + result.error);
        setIsDeleting(false);
      }
    } catch (err) {
      alert("Error de conexión");
      setIsDeleting(false);
    }
  }

  /**
   * FOTO
   */
  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    const reader = new FileReader();
    reader.onload = () => { setTempCropImage(reader.result as string); };
    reader.readAsDataURL(e.target.files[0]);
    e.target.value = "";
  }

  async function handleCropComplete(blob: Blob) {
    setTempCropImage(null);
    setUploadingPhoto(true);
    const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true, fileType: 'image/jpeg' };
    try {
      const croppedFile = new File([blob], "edit_crop.jpg", { type: "image/jpeg" });
      const compressedFile = await imageCompression(croppedFile, options);
      const formData = new FormData();
      formData.append('image', compressedFile);
      formData.append('id', params.id as string);
      formData.append('title', titulo || "receta");
      const result = await uploadDishPhotoAction(formData);
      if (result.success) {
        setCurrentPhoto(URL.createObjectURL(compressedFile));
        router.refresh();
      } else {
        alert("Error al subir foto: " + result.error);
      }
    } catch (error) {
      alert("Error al procesar la imagen");
    } finally {
      setUploadingPhoto(false);
    }
  }

  /**
   * GUARDAR
   */
  async function handleSave() {
    if (!titulo.trim()) return alert("El título es obligatorio");
    setSaving(true);
    try {
      const result = await updateRecipeAction(Number(params.id), {
        titulo,
        ingredientes: ingredientesList.filter(l => l.trim() !== ""),
        pasos: pasosList.filter(l => l.trim() !== ""),
        notas,
        fuente
      });
      if (result.success) {
        setHasChanges(false);
        router.push(`/receta/${params.id}`);
        setTimeout(() => router.refresh(), 100);
      } else {
        alert("Error al guardar: " + (result.error || "Desconocido"));
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;

  return (
    <div className="min-h-screen bg-[#FBF7F4] pb-20 relative">

      {/* CABECERA */}
      <div className="bg-white p-4 border-b flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <Link href={`/receta/${params.id}`} onClick={handleBackWithConfirm} className="text-stone-500 p-2">
          <ArrowLeft />
        </Link>
        <h1 className="font-bold text-lg text-stone-800">Editar Receta</h1>
        <Button onClick={handleSave} disabled={saving || isDeleting} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 font-bold shadow-sm">
          {saving ? <Loader2 className="animate-spin w-4 h-4" /> : "Guardar"}
        </Button>
      </div>

      <div className="p-6 max-w-2xl mx-auto space-y-8">
        
        {/* FOTO */}
        <div className="flex justify-center mb-6">
          <div onClick={() => fileInputRef.current?.click()} className="relative w-40 h-40 rounded-full bg-stone-100 border-4 border-white shadow-xl cursor-pointer overflow-hidden group">
            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
            {uploadingPhoto ? (
              <div className="flex flex-col items-center justify-center h-full bg-black/50 text-white">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : currentPhoto ? (
              <>
                <img src={currentPhoto} className="w-full h-full object-cover" alt="Plato" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white w-8 h-8" />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-stone-400">
                <ImagePlus className="w-10 h-10 mb-2" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Foto</span>
              </div>
            )}
          </div>
        </div>

        {/* FUENTES */}
        <section>
          <label className="flex items-center gap-2 text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-4"><Type className="w-4 h-4" /> Estilo de Letra</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FONTS.map((f) => (
              <button key={f.id} onClick={() => setFuente(f.class)} className={cn("p-3 rounded-xl border-2 text-left transition-all", fuente === f.class ? "border-orange-500 bg-orange-50 text-orange-700" : "border-stone-100 bg-white text-stone-500")}>
                <span className={cn("text-lg block", f.class)}>{f.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* CAMPOS DE TEXTO */}
        <div className={cn("space-y-8 transition-all", fuente)}>
          
          {/* TÍTULO */}
          <div>
            <label className="block text-stone-400 text-[10px] font-bold uppercase mb-2 px-1 tracking-widest">Título</label>
            <input className="w-full bg-white border-none rounded-2xl p-4 shadow-sm font-bold text-stone-800 outline-none text-[16px] md:text-2xl" value={titulo} onChange={e => setTitulo(e.target.value)} />
          </div>

          {/* INGREDIENTES DINÁMICOS */}
          <div>
            <label className="block text-stone-400 text-[10px] font-bold uppercase mb-2 px-1 tracking-widest">Ingredientes</label>
            <div className="space-y-3">
              {ingredientesList.map((ing, idx) => (
                <div key={idx} className="flex gap-2 items-start group">
                  <div className="mt-4 w-1.5 h-1.5 rounded-full bg-orange-300 shrink-0" />
                  
                  <textarea 
                    rows={1}
                    className="flex-1 bg-white border-none rounded-xl p-3 shadow-sm outline-none text-stone-700 resize-none overflow-hidden min-h-[50px] text-[16px]"
                    value={ing}
                    onChange={e => handleIngredientChange(idx, e.target.value)}
                    placeholder="Escribe un ingrediente..."
                    onInput={(e) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }}
                  />
                  
                  <button onClick={() => removeIngredient(idx)} className="p-3 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            <button 
              onClick={addIngredient} 
              className="mt-4 flex items-center gap-2 text-orange-600 font-bold text-sm px-4 py-2 hover:bg-orange-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Añadir Ingrediente
            </button>
          </div>

          {/* PASOS DINÁMICOS */}
          <div>
            <label className="block text-stone-400 text-[10px] font-bold uppercase mb-2 px-1 tracking-widest">Preparación</label>
            <div className="space-y-4">
              {pasosList.map((paso, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <span className="mt-3 text-orange-200 font-bold text-xl italic w-6 text-center shrink-0">{idx + 1}</span>
                  
                  <textarea 
                    rows={2}
                    className="flex-1 bg-white border-none rounded-xl p-4 shadow-sm outline-none text-stone-700 resize-none min-h-[80px] text-[16px]"
                    value={paso}
                    onChange={e => handlePasoChange(idx, e.target.value)}
                    placeholder="Describe este paso..."
                    onInput={(e) => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }}
                  />
                  
                  {/* AQUÍ ESTÁ EL CAMBIO: COLUMNA DE BOTONES */}
                  <div className="flex flex-col gap-1 mt-1">
                    <button onClick={() => removePaso(idx)} className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Borrar paso">
                      <Trash2 className="w-5 h-5" />
                    </button>
                    
                    <button onClick={() => addPasoAfter(idx)} className="p-2 text-stone-300 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Insertar paso debajo">
                       <CornerDownLeft className="w-5 h-5" />
                    </button>
                  </div>

                </div>
              ))}
            </div>
            <button 
              onClick={addPaso} 
              className="mt-4 flex items-center gap-2 text-orange-600 font-bold text-sm px-4 py-2 hover:bg-orange-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Añadir Paso
            </button>
          </div>

          {/* NOTAS */}
          <div className="font-sans">
            <label className="block text-stone-400 text-[10px] font-bold uppercase mb-2 px-1 tracking-widest">Notas (Privadas)</label>
            <textarea className="w-full bg-white border-none rounded-2xl p-4 shadow-sm h-24 outline-none text-stone-700 italic text-[16px]" value={notas} onChange={e => setNotas(e.target.value)} />
          </div>
        </div>

        {/* ZONA DE PELIGRO */}
        <div className="pt-10 border-t border-stone-200 mt-10">
          <Button 
            onClick={handleDelete}
            disabled={isDeleting || saving}
            variant="ghost" 
            className="w-full h-14 rounded-2xl text-red-500 hover:text-red-600 hover:bg-red-50 font-bold gap-2"
          >
            {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 className="w-5 h-5" />}
            Eliminar esta receta definitivamente
          </Button>
          <p className="text-center text-stone-400 text-[10px] mt-2 uppercase tracking-tighter">
            Esta acción borrará la receta y su foto para siempre
          </p>
        </div>
      </div>

      {/* RECORTE */}
      {tempCropImage && (
        <ImageCropper image={tempCropImage} onCropComplete={handleCropComplete} onCancel={() => setTempCropImage(null)} />
      )}
    </div>
  );
}