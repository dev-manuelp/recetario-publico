'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function uploadDishPhotoAction(formData: FormData) {
  const file = formData.get('image') as File;
  const recipeId = formData.get('id') as string;
  const recipeTitle = formData.get('title') as string;

  if (!file || !recipeId) return { success: false, error: 'Faltan datos' };

  try {
    // 1. GENERAR NOMBRE BONITO (Igual que hicimos antes)
    const nombreLimpio = recipeTitle
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Sin tildes
      .replace(/[^a-zA-Z0-9 ]/g, "") // Solo letras/numeros
      .trim()
      .replace(/\s+/g, "-") // Guiones
      .toLowerCase();

    const suffix = Math.random().toString(36).substring(2, 6);
    const fileExtension = file.name.split('.').pop(); 
    const fileName = `${nombreLimpio}-${suffix}.${fileExtension}`;

    // 2. SUBIR AL STORAGE
    const { error: uploadError } = await supabase.storage
      .from('recetas')
      .upload(fileName, file);

    if (uploadError) throw new Error('Error subiendo imagen: ' + uploadError.message);

    // 3. OBTENER URL PÚBLICA
    const { data: { publicUrl } } = supabase.storage
      .from('recetas')
      .getPublicUrl(fileName);

    // 4. ACTUALIZAR LA RECETA EN LA BASE DE DATOS
    const { error: dbError } = await supabase
      .from('recetas')
      .update({ foto_url: publicUrl }) // <--- Aquí actualizamos solo la foto
      .eq('id', recipeId);

    if (dbError) throw new Error(dbError.message);

    // 5. REFRESCAR LAS PÁGINAS (Para que se vea al instante)
    revalidatePath(`/receta/${recipeId}`);
    revalidatePath('/galeria');

    return { success: true };

  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message };
  }
}