export const maxDuration = 60;

import type { Metadata, Viewport } from "next";
import { 
  Inter, 
  Playfair_Display, 
  Pacifico, 
  Indie_Flower, 
  Great_Vibes, 
  Allura,
  Courgette
} from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const pacifico = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-pacifico" });
const indie = Indie_Flower({ weight: "400", subsets: ["latin"], variable: "--font-indie" });
const greatVibes = Great_Vibes({ weight: "400", subsets: ["latin"], variable: "--font-great" });
const allura = Allura({ weight: "400", subsets: ["latin"], variable: "--font-allura" });
const courgette = Courgette({ weight: "400", subsets: ["latin"], variable: "--font-courgette" });

export const metadata: Metadata = {
  title: "Recetario Legacy",
  description: "Las recetas de mamá, para siempre.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png?v=2",
    apple: "/apple-touch-icon.png?v=2", 
  },
  // ESTA SECCIÓN IPAD 
  appleWebApp: {
    capable: true, //  Activa el modo pantalla completa
    statusBarStyle: "default", 
    title: "Recetario",
  },
  // Añadimos formatDetection para evitar que convierta números en teléfonos
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Esto es clave para que no salte la pantalla en iOS
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={cn(
        /* CAMBIO AQUÍ: 
           1. 'select-none': Evita que al tocar rápido se seleccionen iconos o textos azules por error.
           2. 'touch-pan-y': Mejora la fluidez del scroll en pantallas táctiles de Apple.
        */
        "min-h-screen bg-background font-sans antialiased select-none touch-pan-y",
        inter.variable,
        playfair.variable,
        pacifico.variable,
        indie.variable,
        greatVibes.variable,
        allura.variable,
        courgette.variable
      )}>
        {children}
      </body>
    </html>
  );
}