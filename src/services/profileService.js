import { supabase } from '../lib/supabase';

export async function getProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) return data;

    if (!data && userId) {
      const { data: userAuth } = await supabase.auth.getUser();
      const email = userAuth?.user?.email || '';
      const name = userAuth?.user?.user_metadata?.name || email.split('@')[0] || 'Student';
      const role = userAuth?.user?.user_metadata?.role || 'student';

      const { data: created, error: createErr } = await supabase
        .from('profiles')
        .upsert({ id: userId, email, name, role }, { onConflict: 'id' })
        .select()
        .maybeSingle();
      if (!createErr && created) return created;
    }
  } catch (err) {
    console.warn('[profileService] Supabase getProfile notice:', err.message);
  }

  // Fallback to local profile cache
  try {
    const stored = localStorage.getItem('local_auth_profile');
    if (stored) return JSON.parse(stored);
  } catch (e) {}

  return null;
}

/** Update a profile */
export async function updateProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() }, { onConflict: 'id' })
      .select()
      .maybeSingle();
    if (!error && data) return data;
  } catch (err) {
    console.warn('[profileService] Supabase updateProfile notice:', err.message);
  }

  try {
    const stored = localStorage.getItem('local_auth_profile');
    const prev = stored ? JSON.parse(stored) : {};
    const updated = { ...prev, ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem('local_auth_profile', JSON.stringify(updated));
    return updated;
  } catch (e) {}

  return updates;
}

/** Upload profile photo to Supabase Storage → update profile_photo_url */
export async function uploadProfilePhoto(userId, file) {
  const ext = file.name.split('.').pop();
  const path = `profile-photos/${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('profile-images')
    .upload(path, file, { upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const { data: urlData } = supabase.storage.from('profile-images').getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  await updateProfile(userId, { profile_photo_url: publicUrl });
  return publicUrl;
}

/** Get all student profiles (admin use) */
export async function getAllStudents() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

/** Get all profiles with a specific role */
export async function getProfilesByRole(role) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', role)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}
