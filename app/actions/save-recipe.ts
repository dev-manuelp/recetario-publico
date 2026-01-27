'use server';

/**
 *  RECETAS ESCANEADAS
 */
import { supabase } from '@/lib/supabase';

export async function saveRecipeAction(formData: FormData) {
  const recipeDataString = formData.get('data') as string;
  const fuenteElegida = formData.get('font') as string;
  const albumIdString = formData.get('albumId') as string;
  const albumId = albumIdString && albumIdString !== 'null' ? parseInt(albumIdString) : null;
  const dishImage = formData.get('dishImage') as File | null;

  if (!recipeDataString) return { success: false, error: 'Faltan datos' };

  const recipe = JSON.parse(recipeDataString);
  let finalPhotoUrl = null;

  try {
    // 1. PROCESAMIENTO Y SUBIDA DE IMAGEN DEL PLATO
    if (dishImage && dishImage.size > 0) {
        // Normalización del nombre del archivo (quitar tildes y caracteres raros)
        const nombreLimpio = recipe.titulo
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
          .replace(/[^a-zA-Z0-9 ]/g, "") 
          .trim()
          .replace(/\s+/g, "-") 
          .toLowerCase();

        const suffix = Math.random().toString(36).substring(2, 6);
        const fileExtension = dishImage.name.split('.').pop(); 
        const fileName = `${nombreLimpio}-${suffix}.${fileExtension}`;

        // Subida al Storage de Supabase
        const { error: uploadError } = await supabase.storage
          .from('recetas')
          .upload(fileName, dishImage);

        if (uploadError) throw new Error('Error subiendo imagen: ' + uploadError.message);

        // Obtención del enlace público para la DB
        const { data: { publicUrl } } = supabase.storage
          .from('recetas')
          .getPublicUrl(fileName);
          
        finalPhotoUrl = publicUrl;
    }

    // 2. INSERCIÓN DEL REGISTRO EN LA TABLA RECETAS
    const datosParaGuardar: any = {
        titulo: recipe.titulo,
        ingredientes: recipe.ingredientes,
        pasos: recipe.pasos,
        notas: recipe.notas,
        foto_url: finalPhotoUrl, 
        fuente: fuenteElegida || 'font-mama',
        album_id: albumId
    };

    const { error: dbError } = await supabase
      .from('recetas')
      .insert(datosParaGuardar);

    if (dbError) throw new Error('Error guardando en base de datos: ' + dbError.message);

    return { success: true };

  } catch (error: any) {
    console.error("Error en saveRecipeAction:", error);
    return { success: false, error: error.message };
  }
}