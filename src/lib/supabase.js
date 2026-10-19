import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

let _isOffline = null;

export const markSupabaseOffline = () => {
  _isOffline = true;
  try {
    sessionStorage.setItem('supabase_status', 'offline');
  } catch (e) {}
};

export const isSupabaseConfigured = () =>
  Boolean(
    supabaseUrl &&
    !supabaseUrl.includes('your-project') &&
    supabaseAnonKey &&
    !supabaseAnonKey.includes('example')
  );

export const isSupabaseAvailable = () => {
  try {
    if (sessionStorage.getItem('supabase_status') === 'offline') return false;
  } catch (e) {}
  if (_isOffline === true) return false;
  return isSupabaseConfigured();
};