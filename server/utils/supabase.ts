import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
<<<<<<< HEAD
const serviceKey = process.env.SUPABASE_SERVICE_KEY || '';

export const supabase = url && anonKey 
  ? createClient(url, anonKey, {
=======
const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = url && (serviceKey || anonKey)
  ? createClient(url, serviceKey || anonKey, {
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777
      auth: {
        persistSession: false // Não precisa persistir no servidor Node.js local
      }
    })
  : null;

export const supabaseAdmin = url && (serviceKey || anonKey)
  ? createClient(url, serviceKey || anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

if (supabase) {
  console.log('Backend: Conectado ao Supabase com sucesso.');
} else {
  console.warn('Backend: Supabase não está configurado. O agendador persistente não estará ativo.');
}

if (supabaseAdmin) {
  console.log('Backend: Admin Supabase inicializado.');
}
