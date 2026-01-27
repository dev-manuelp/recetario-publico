import { NextRequest, NextResponse } from 'next/server';

export const config = {
  // EXPLICACIÓN DEL MATCHER (Filtro):
  // Protegemos todas las rutas de la app ( /((?!...).*) )
  // PERO excluimos (dejamos pasar sin clave) a:
  // - /api (para que funcionen los server actions de login)
  // - /_next/static y /_next/image (archivos internos de carga rápida e imágenes)
  // - /favicon.ico (el icono de la pestaña)
  // - /login (IMPORTANTE: dejar entrar a la página donde se pone la clave)
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login|manifest.webmanifest|.*\\.png$).*)'
  ],
};

export function middleware(req: NextRequest) {
  // 1. Buscamos el "Pase VIP" (la cookie) en el navegador del usuario
  const cookie = req.cookies.get('family_session');
  
  // 2. Comprobamos si el pase es válido
  if (cookie?.value === 'authenticated') {
    // Si tiene la cookie correcta, le dejamos pasar a donde iba
    return NextResponse.next();
  }

  // 3. Si NO tiene cookie (o es falsa), lo mandamos a la página de Login
  // Guardamos la URL a la que quería ir por si queremos redirigirle allí después (opcional)
  const loginUrl = new URL('/login', req.url);
  return NextResponse.redirect(loginUrl);
}