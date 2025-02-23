import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    storage: localStorage,
    storageKey: 'supabase.auth.token'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'billing-tracker'
    }
  }
});

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  if (!error) return 'An unknown error occurred';

  console.error('Supabase Error:', {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
    status: error.status,
    statusText: error.statusText
  });
  
  if (error.code === 'PGRST301') {
    return 'Database connection error. Please try again.';
  }
  if (error.message?.includes('Failed to fetch')) {
    return 'Network error. Please check your internet connection.';
  }
  if (error.code === 'auth/invalid-email') {
    return 'Invalid email address.';
  }
  if (error.code === 'auth/email-already-in-use') {
    return 'Email is already in use.';
  }
  if (error.code === 'auth/weak-password') {
    return 'Password is too weak.';
  }
  if (error.code === 'session_not_found') {
    return 'Your session has expired. Please sign in again.';
  }
  return error.message || 'An unexpected error occurred';
};