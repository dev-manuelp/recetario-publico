/**
 * BIBLIOTECA DE ICONOS CENTRALIZADA
 */
import { 
  Utensils, Cake, Fish, Beef, Salad, Pizza, 
  Sandwich, Coffee, Soup, Egg, Apple, IceCream, 
  Wine, Cookie, Flame, Croissant, ChefHat, Library, 
  Soup as RiceIcon,
  // --- NUEVOS IMPORTS ---
  TreePine,     // Navidad
  Baby,         // Niños
  PartyPopper,  // Fiestas
  BookHeart,    // Abuela (Recetario con amor)
  Drumstick,    // Pollo
  Wheat,        // Pan / Masas
  Candy,        // Dulces
  Beer,         // Cerveza / Bebida
  Cherry,       // Fruta
  Milk          // Lácteos
} from "lucide-react";

/**
 * MAPA DE COMPONENTES
 * Mapea IDs de la DB con iconos de Lucide.
 */
export const ICON_MAP: Record<string, React.ReactNode> = {
  // --- TEMÁTICOS Y NUEVOS ---
  "navidad":  <TreePine className="w-full h-full" strokeWidth={2.5} />,
  "abuela":   <BookHeart className="w-full h-full" strokeWidth={2.5} />, // EL ELEGIDO ❤️
  "niños":    <Baby className="w-full h-full" strokeWidth={2.5} />,
  "fiesta":   <PartyPopper className="w-full h-full" strokeWidth={2.5} />,
  
  // --- NUEVOS ALIMENTOS ---
  "pollo":    <Drumstick className="w-full h-full" strokeWidth={2.5} />,
  "pan":      <Wheat className="w-full h-full" strokeWidth={2.5} />,
  "dulces":   <Candy className="w-full h-full" strokeWidth={2.5} />,
  "cerveza":  <Beer className="w-full h-full" strokeWidth={2.5} />,
  "fruta":    <Cherry className="w-full h-full" strokeWidth={2.5} />,
  "leche":    <Milk className="w-full h-full" strokeWidth={2.5} />,

  // --- CLÁSICOS ---
  "utensils": <Utensils className="w-full h-full" strokeWidth={2.5} />,
  "cake":     <Cake className="w-full h-full" strokeWidth={2.5} />,
  "fish":     <Fish className="w-full h-full" strokeWidth={2.5} />,
  "beef":     <Beef className="w-full h-full" strokeWidth={2.5} />,
  "salad":    <Salad className="w-full h-full" strokeWidth={2.5} />,
  "pizza":    <Pizza className="w-full h-full" strokeWidth={2.5} />,
  "sandwich": <Sandwich className="w-full h-full" strokeWidth={2.5} />,
  "coffee":   <Coffee className="w-full h-full" strokeWidth={2.5} />,
  "soup":     <Soup className="w-full h-full" strokeWidth={2.5} />,
  "egg":      <Egg className="w-full h-full" strokeWidth={2.5} />,
  "apple":    <Apple className="w-full h-full" strokeWidth={2.5} />,
  "ice-cream": <IceCream className="w-full h-full" strokeWidth={2.5} />,
  "wine":     <Wine className="w-full h-full" strokeWidth={2.5} />,
  "cookie":   <Cookie className="w-full h-full" strokeWidth={2.5} />,
  "flame":    <Flame className="w-full h-full" strokeWidth={2.5} />,
  "croissant": <Croissant className="w-full h-full" strokeWidth={2.5} />,
  "rice":     <RiceIcon className="w-full h-full" strokeWidth={2.5} />, 
  "all":      <Library className="w-full h-full" strokeWidth={2.5} />, 
};

/**
 * LISTA PARA SELECTORES
 * Define el orden en el que salen los iconos al crear un álbum.
 */
export const ALBUM_ICONS_LIST = [
  // Favoritos y Temáticos (Primero lo nuevo)
  "abuela", "navidad", "niños", "fiesta", 
  
  // Platos principales
  "pollo", "carne", "fish", "verdura", "rice", 
  "soup", "pizza", "pasta", "pan", "egg",
  
  // Dulces y Postres
  "cake", "dulces", "ice-cream", "cookie", "fruta",
  
  // Desayuno y Bebida
  "coffee", "leche", "cerveza", "wine", "croissant"
];

/**
 * COMPONENTE REUTILIZABLE RecipeIcon
 */
export function RecipeIcon({ name, className = "w-6 h-6" }: { name: string, className?: string }) {
  // Convertimos a minúsculas para evitar errores
  const iconName = name?.toLowerCase() || 'utensils';
  
  // Mapeos de compatibilidad por si en tu base de datos hay nombres antiguos
  let finalName = iconName;
  if (iconName === 'beef') finalName = 'carne'; 
  if (iconName === 'salad') finalName = 'verdura'; 

  return (
    <div className={className}>
      {ICON_MAP[finalName] || ICON_MAP[iconName] || <ChefHat className="w-full h-full" strokeWidth={2.5} />}
    </div>
  );
}