import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Recetario Legacy',
    short_name: 'Recetario',
    description: 'Las recetas de mamá, digitalizadas.',
    start_url: '/',
    scope: '/',            // Mantiene al usuario dentro de la app
    display: 'standalone', // Quita las barras del navegador
    background_color: '#FBF7F4',
    theme_color: '#EA580C',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        
      },
    ],
  };
}