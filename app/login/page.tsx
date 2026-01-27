'use client';

import { useState } from 'react';
import { loginAction } from '@/app/actions/login';
import { ChefHat, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError('');
    
    // Llamamos a la Server Action
    const result = await loginAction(formData);
    
    // Si la acción devuelve algo, es que hubo error (si no, habría redirigido)
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF7F4] flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-[2rem] shadow-xl w-full max-w-sm border-2 border-orange-100 text-center">
        
        <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <ChefHat className="w-10 h-10 text-orange-600" />
        </div>

        <h1 className="text-3xl font-rotulador text-stone-800 mb-2">Familia</h1>
        <p className="text-stone-500 mb-8 text-sm">Introduce la clave secreta para entrar a las recetas.</p>

        <form action={handleSubmit} className="space-y-4">
          <input 
            name="password" 
            type="password" 
            placeholder="Contraseña..." 
            className="w-full p-4 rounded-xl border-2 border-stone-100 bg-stone-50 text-center text-lg focus:border-orange-400 focus:outline-none transition-colors"
            required
          />
          
          {error && (
            <div className="text-red-500 text-sm font-bold bg-red-50 p-2 rounded-lg animate-in fade-in">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-14 bg-orange-600 text-white rounded-xl font-bold text-lg hover:bg-orange-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Entrar <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}