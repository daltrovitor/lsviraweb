import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// O cliente do Supabase será instanciado se houver credenciais configuradas via .env
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null;

export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Mantido para compatibilidade, mas credenciais devem ser configuradas via .env
export const clearSupabaseCredentials = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_anon_key');
    window.location.reload();
  }
};

// Legacy: mantido para não quebrar imports existentes
export const updateSupabaseCredentials = (url: string, key: string) => {
  console.warn('Configuração via UI foi removida. Use variáveis de ambiente (.env) para configurar o Supabase.');
};
