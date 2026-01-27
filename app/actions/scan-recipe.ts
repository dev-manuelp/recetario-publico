'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface RecipeData {
  titulo: string;
  ingredientes: string[];
  pasos: string[];
  notas?: string;
  error?: string;
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function scanRecipeAction(formData: FormData): Promise<RecipeData | null> {
  console.log("--- INICIO ESCANEO (MODELO FLASH-LATEST) ---");

  try {
    let files = formData.getAll('images') as File[];
    
    // Fallback por si viene en singular
    if (!files || files.length === 0) {
        const single = formData.get('image') as File;
        if (single) files = [single];
    }

    if (!files || files.length === 0) {
      return { titulo: '', ingredientes: [], pasos: [], error: 'No llegó ninguna imagen.' };
    }

    // Conversión de imágenes
    const googleAiImages = await Promise.all(files.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');
      return {
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      };
    }));

    // --- MODELO  ---
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-flash-latest', 
      generationConfig: { responseMimeType: "application/json" }
    });

    // PROMPT MEJORADO 
    
    const prompt = `
      Actúa como un experto cocinero digitalizando recetas manuscritas.
      Analiza las imágenes adjuntas.
      
      TU MISIÓN:
      - Asume que SIEMPRE es una receta, aunque la letra sea difícil o parezcan apuntes.
      - Extrae el texto a toda costa. Si dudas, infiere por el contexto (ej: "harin" es "harina").
      
      Devuelve SOLO un JSON con este formato:
      {
        "titulo": "Título de la receta",
        "ingredientes": ["Lista de ingredientes limpia", "sin guiones"],
        "pasos": ["Lista de pasos limpia", "sin números"],
        "notas": "Texto extra manuscrito"
      }
    `;

    const result = await model.generateContent([
      prompt,
      ...googleAiImages 
    ]);

    const response = await result.response;
    const text = response.text();

    try {
      const cleanJson = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (parsed.error) return { titulo: '', ingredientes: [], pasos: [], error: parsed.error };
      
      // Rellenar vacíos
      if (!parsed.ingredientes) parsed.ingredientes = [];
      if (!parsed.pasos) parsed.pasos = [];
      if (!parsed.titulo) parsed.titulo = "Receta sin título";

      return parsed;

    } catch (parseError) {
      console.error('Error parseando JSON:', text);
      return { titulo: '', ingredientes: [], pasos: [], error: 'La IA leyó la imagen pero falló el formato. Intenta con mejor luz.' };
    }

  } catch (error: any) {
    console.error('ERROR SERVIDOR:', error);
    const msg = error.message?.toLowerCase() || "";
    
    // Si sigue fallando la API Key, te lo dirá aquí claro
    if (msg.includes("api key")) return { titulo: "", ingredientes: [], pasos: [], error: "Error: Revisa la API Key en Vercel." };
    
    return {
      titulo: '',
      ingredientes: [],
      pasos: [],
      error: 'Error técnico: ' + (error.message || 'Desconocido'),
    };
  }
}