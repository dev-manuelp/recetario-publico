'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

/**
 * 1. CREAR ÁLBUM
 */
export async function createAlbumAction(nombre: string, icono: string) {
  try {
    const { error } = await supabase.from('albumes').insert({ nombre, icono });
    if (error) throw new Error(error.message);
    revalidatePath('/'); 
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 2. OBTENER ÁLBUMES
 */
export async function getAlbumsAction() {
  try {
    const { data, error } = await supabase.from('albumes').select('*').order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. BORRAR ÁLBUM Y SUS RECETAS (Limpieza total de Storage y DB)
export async function deleteAlbumAction(id: number) {
  try {
    // 3.1. Obtener fotos de las recetas que se van a borrar
    const { data: recetas } = await supabase
      .from('recetas')
      .select('foto_url')
      .eq('album_id', id);

    // 3.2. Limpiar Storage
    if (recetas) {
      const files = recetas.map(r => r.foto_url?.split('/').pop()).filter(Boolean) as string[];
      if (files.length > 0) {
        await supabase.storage.from('recetas').remove(files);
      }
    }

    // 3.3. Borrar recetas y luego el álbum
    await supabase.from('recetas').delete().eq('album_id', id);
    const { error } = await supabase.from('albumes').delete().eq('id', id);
    
    if (error) throw new Error(error.message);
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}



/**
 * 4. ACTUALIZAR ÁLBUM (Nombre e Icono)
 */
export async function updateAlbumAction(id: number, nombre: string, icono: string) {
  try {
    const { error } = await supabase
      .from('albumes')
      .update({ nombre, icono })
      .eq('id', id);

    if (error) throw new Error(error.message);
    
    revalidatePath('/'); // Para que se actualice la pantalla principal al instante
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}