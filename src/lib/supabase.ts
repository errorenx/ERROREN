import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization for Supabase Client
let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseConfig = () => {
  const metaEnv = (import.meta as any).env || {};
  const url =
    metaEnv.VITE_SUPABASE_URL ||
    (typeof window !== 'undefined' ? localStorage.getItem('erroren_supabase_url') || '' : '');
  const anonKey =
    metaEnv.VITE_SUPABASE_ANON_KEY ||
    (typeof window !== 'undefined' ? localStorage.getItem('erroren_supabase_key') || '' : '');

  return { url, anonKey, isConfigured: Boolean(url && anonKey) };
};

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseConfig().isConfigured;
};

export const getSupabase = (): SupabaseClient | null => {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, anonKey);
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
};

export const saveSupabaseConfig = (url: string, anonKey: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('erroren_supabase_url', url.trim());
    localStorage.setItem('erroren_supabase_key', anonKey.trim());
  }
  supabaseInstance = null; // reset instance to pick up new credentials
};
