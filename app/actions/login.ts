'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const password = formData.get('password') as string;
  const correctPassword = process.env.FAMILY_PASSWORD;

  // Si la contraseña coincide
  if (password === correctPassword) {
    // 1. Obtenemos el gestor de cookies (esperando con await)
    const cookieStore = await cookies();
    
    // 2. Creamos la cookie (el pase VIP)
    cookieStore.set('family_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365, // dura 1 año (365 días)
      path: '/',
    });
    
    // 3. Redirigimos a la portada
    redirect('/');
  } else {
    // Si falla, devolvemos error
    return { error: 'Contraseña incorrecta' };
  }
}