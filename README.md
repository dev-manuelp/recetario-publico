# 🍲 Cocina de Mamá - Recetario Digital con IA

Una aplicación web progresiva (PWA) diseñada para digitalizar, organizar y preservar las recetas familiares manuscritas.

> **Nota de Diseño:** Esta aplicación sigue una filosofía **Mobile-First** estricta. Ha sido diseñada y optimizada específicamente para la experiencia de usuario en iPhone y iPad (Safari/iOS), priorizando gestos táctiles y layouts verticales sobre el uso en escritorio.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-blue) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green) ![Gemini AI](https://img.shields.io/badge/AI-Gemini_Flash-orange)

## ✨ Características Destacadas

### 🤖 Inteligencia Artificial & Digitalización
- **Escaneo con IA (Gemini Vision):** Sube fotos de recetas antiguas manuscritas. La IA transcribe, corrige ortografía, estructura ingredientes/pasos e infiere títulos, incluso con caligrafía difícil.
- **Compresión Inteligente:** Optimización automática de imágenes antes de subir al servidor para ahorrar datos y almacenamiento.

### 📱 Experiencia de Usuario (UX) Tipo Nativa
- **Interacciones iOS:** Implementación de gestos como **"Long Press" (pulsación larga)** para opciones de borrado y scrolls horizontales con inercia nativa ("snap").
- **Edición Flexible:** Posibilidad de insertar pasos intermedios en cualquier orden, recortar fotos de platos (Crop) y reorganizar ingredientes.
- **Tipografía Dinámica:** Elección de fuentes manuscritas (tipo 'Rotulador', 'Gourmet', 'Libro') personalizable por receta.

### 👨‍🍳 Modo Cocinado (Cooking Mode)
- **💡 Pantalla Siempre Encendida:** Integración con la **Screen Wake Lock API** (botón bombilla) para evitar que el móvil se bloquee mientras tienes las manos en la masa.
- **✅ Tracking de Progreso:** Toca los pasos para marcarlos, haciendo que destaque del resto y no perderte en la receta.
- **⏱️ Temporizador Inteligente:** Detección automática de tiempos de cocción. Si la receta dice "hornee 20 min", aparece un cronómetro integrado listo para usar.

### 📤 Compartir e Imprimir
- **Web Share API:** Comparte recetas directamente por WhatsApp, AirDrop o Gmail como texto plano formateado.
- **Generación PDF:** Motor de renderizado propio para exportar recetas individuales o **imprimir el álbum completo** como un libro físico, respetando la tipografía elegida.

### 🔒 Privacidad y Organización
- **Álbumes Personalizados:** Organización por categorías con iconos temáticos.
- **Modo Familiar:** Acceso restringido mediante autenticación simplificada (Cookies/Middleware) para uso privado.

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js 14 (App Router), React Server Components.
- **Estilos:** Tailwind CSS, Lucide React, Shadcn/UI (modificado).
- **Backend:** Supabase (PostgreSQL + Storage + Auth).
- **IA:** Google Generative AI SDK (Gemini flash latest).
- **APIs Web:** Screen Wake Lock API, Web Share API, Touch Events.
- **Librerías:** `browser-image-compression`, `react-easy-crop`, `jspdf`.

## 🚀 Cómo probarlo en local

**1. Clonar repositorio:**
```bash
git clone https://github.com/dev-manuelp/recetario-mama.git
```

**2. Instalar dependencias:**
```bash
npm install
```

**3. Configuración de variables de entorno:**
Crea un archivo `.env.local` en la raíz del proyecto y añade tus credenciales(puedes copiar el ejemplo).
```bash
cp .env.example .env.local
```

**4. Iniciar el servidor**
```bash
npm run dev
```

---
Hecho por **[Manuel Peña](https://www.linkedin.com/in/manuelp-dev)** - **[www.manuelp.com](https://www.manuelp.com)** (2026).
*Integrando Cloud & AI para soluciones reales.*
