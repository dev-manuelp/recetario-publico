'use server'

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase'; 

/**
 * SECCIÓN: RECETAS
 */

// Listado global ordenado por fecha descendente
export async function getRecipesAction() {
  try {
    const { data, error } = await supabase
      .from('recetas') // Corregido: antes decía 'recipes'
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    return { success: false, data: [], error: error.message };
  }
}

// Obtención de una receta individual por ID
export async function getRecipeByIdAction(id: string) {
  try {
    const { data, error } = await supabase
      .from('recetas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Persistencia de cambios en título, contenido y fuente
export async function updateRecipeAction(id: number, data: any) {
  try {
    const { error } = await supabase
      .from('recetas')
      .update({
        titulo: data.titulo,
        ingredientes: data.ingredientes,
        pasos: data.pasos,
        notas: data.notas,
        fuente: data.fuente,
      })
      .eq('id', id);

    if (error) throw error;
    revalidatePath(`/receta/${id}`);
    revalidatePath('/'); 
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Eliminación de receta de la base de datos
export async function deleteRecipeAction(id: number, foto_url?: string) {
  try {
    // 1. Si la receta tiene foto, la borramos del Storage primero
    if (foto_url) {
      const fileName = foto_url.split('/').pop(); // Extrae el nombre del archivo de la URL
      if (fileName) {
        await supabase.storage
          .from('recetas')
          .remove([fileName]);
      }
    }

    // 2. Borramos el registro de la base de datos
    const { error } = await supabase.from('recetas').delete().eq('id', id);
    
    if (error) throw error;
    
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Error al eliminar receta e imagen:', error);
    return { success: false, error: error.message };
  }
}

/**
 * SECCIÓN: ÁLBUMES (Consumidas por HomePage)
 */

// Obtener listado completo de álbumes
export async function getAlbumsAction() {
  try {
    const { data, error } = await supabase
      .from('albumes')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    return { success: false, data: [], error: error.message };
  }
}

// Eliminar un álbum específico y todas las fotos de sus recetas
export async function deleteAlbumAction(id: number) {
  try {
    // 1. Buscamos todas las recetas de este álbum para obtener sus fotos
    const { data: recetas } = await supabase
      .from('recetas')
      .select('foto_url')
      .eq('album_id', id);

    // 2. Si hay recetas con fotos, borramos los archivos del Storage
    if (recetas && recetas.length > 0) {
      const fotosABorrar = recetas
        .map(r => r.foto_url?.split('/').pop())
        .filter(Boolean) as string[];

      if (fotosABorrar.length > 0) {
        await supabase.storage.from('recetas').remove(fotosABorrar);
      }
    }

    // 3. Borramos el álbum (la base de datos borrará las recetas en cascada si está configurada así, 
    // o las borramos nosotros si no)
    const { error } = await supabase.from('albumes').delete().eq('id', id);
    
    if (error) throw error;
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * SECCIÓN: PROCESAMIENTO DE IMÁGENES
 */

// Sube foto al bucket 'recetas' y vincula la URL con la receta
export async function uploadDishPhotoAction(formData: FormData) {
  const imageFile = formData.get('image') as File;
  const recipeId = formData.get('id') as string;

  if (!imageFile || !recipeId) {
    return { success: false, error: "Faltan datos" };
  }

  try {
    // 1. Crear nombre único para el archivo (ej: receta-123-164000.jpg)
    const fileName = `receta-${recipeId}-${Date.now()}.jpg`;

    // 2. Subir a Supabase Storage (Bucket 'recetas')
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('recetas') // <--- IMPORTANTE: Asegúrate de que tu bucket se llame 'recetas'
      .upload(fileName, imageFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Error subiendo storage:", uploadError);
      return { success: false, error: "Error al subir la imagen a la nube" };
    }

    // 3. Obtener la URL pública para guardarla en la base de datos
    const { data: publicUrlData } = supabase
      .storage
      .from('recetas')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    // 4. Guardar esa URL en la tabla 'recetas'
    const { error: dbError } = await supabase
      .from('recetas')
      .update({ foto_url: publicUrl }) 
      .eq('id', recipeId);

    if (dbError) {
      console.error("Error base de datos:", dbError);
      return { success: false, error: "La foto subió, pero falló al guardar en la receta" };
    }

    // 5. Limpiar caché para refrescar vistas
    revalidatePath(`/receta/${recipeId}`);
    revalidatePath(`/receta/${recipeId}/editar`);
    
    return { success: true, url: publicUrl };

  } catch (error) {
    return { success: false, error: "Error inesperado en el servidor" };
  }
}

/**
 * SECCIÓN: IMPRESIÓN
 */

// Obtener recetas filtradas por álbum específico
export async function getRecipesByAlbumIdAction(albumId: number) {
  try {
    const { data, error } = await supabase
      .from('recetas')
      .select('*')
      .eq('album_id', albumId)
      .order('titulo', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    return { success: false, data: [], error: error.message };
  }
}

// Mover receta a otro álbum
export async function moveRecipeAction(recipeId: number, newAlbumId: number) {
  try {
    const { error } = await supabase
      .from('recetas')
      .update({ album_id: newAlbumId }) // Cambiamos el ID del álbum
      .eq('id', recipeId);

    if (error) throw error;

    revalidatePath('/'); // Actualiza la pantalla 
    return { success: true };
  } catch (error: any) {
    console.error('Error al mover receta:', error);
    return { success: false, error: error.message };
  }
}