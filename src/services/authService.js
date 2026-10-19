/**
 * authService.js
 * Low-level Supabase auth helpers.
 * Prefer using AuthContext (useAuth) for UI components.
 */
import { supabase } from '../lib/supabase';

/**
 * Register a new user and create their profile row.
 * role: 'student' | 'company' | 'admin'
 */
export async function registerUser({ email, password, name, role = 'student', extraData = {} }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role } }
  });
  if (error) throw new Error(error.message);

  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      email,
      name,
      role,
      ...extraData
    }, { onConflict: 'id' });
    if (profileError) console.warn('[authService] profile create error:', profileError.message);
  }

  return { user: data.user, session: data.session };
}

/**
 * Sign in with email + password.
 */
export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return { user: data.user, session: data.session };
}

/**
 * Sign out the current user.
 */
export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

/**
 * Send password reset email.
 */
export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });
  if (error) throw new Error(error.message);
}

/**
 * Get the current active session.
 */
export async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get the current user's profile from `profiles` table.
 */
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
}
