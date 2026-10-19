import { supabase } from '../lib/supabase';

/**
 * Upload a PDF resume to Supabase Storage and create a resumes record.
 * With seamless local storage fallback if Supabase is offline.
 * Returns the resume row.
 */
export async function uploadResume(userId, file) {
  const ext = file.name.split('.').pop();
  const storagePath = `resumes/${userId}/${Date.now()}_${file.name}`;
  let publicUrl = URL.createObjectURL(file);

  const fallbackResume = {
    id: `resume-${Date.now()}`,
    student_id: userId,
    storage_path: storagePath,
    public_url: publicUrl,
    filename: file.name,
    file_size_kb: Math.round(file.size / 1024),
    status: 'pending',
    uploaded_at: new Date().toISOString()
  };

  // Try Supabase Storage and Database first
  try {
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(storagePath, file, { upsert: true, contentType: 'application/pdf' });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(storagePath);
      if (urlData?.publicUrl) {
        publicUrl = urlData.publicUrl;
        fallbackResume.public_url = publicUrl;
      }
    }

    const { data: existingResume } = await supabase
      .from('resumes')
      .select('id')
      .eq('student_id', userId)
      .maybeSingle();

    if (existingResume) {
      const res = await supabase
        .from('resumes')
        .update({
          storage_path: storagePath,
          public_url: publicUrl,
          filename: file.name,
          file_size_kb: Math.round(file.size / 1024),
          status: 'pending',
          uploaded_at: new Date().toISOString()
        })
        .eq('id', existingResume.id)
        .select()
        .maybeSingle();

      if (!res.error && res.data) {
        localStorage.setItem(`local_resume_${userId}`, JSON.stringify(res.data));
        return res.data;
      }
    } else {
      const res = await supabase
        .from('resumes')
        .insert({
          student_id: userId,
          storage_path: storagePath,
          public_url: publicUrl,
          filename: file.name,
          file_size_kb: Math.round(file.size / 1024),
          status: 'pending'
        })
        .select()
        .maybeSingle();

      if (!res.error && res.data) {
        localStorage.setItem(`local_resume_${userId}`, JSON.stringify(res.data));
        return res.data;
      }
    }
  } catch (err) {
    console.warn('[resumeService] Supabase offline, using local storage fallback:', err.message);
  }

  // Local fallback: store in localStorage cache
  localStorage.setItem(`local_resume_${userId}`, JSON.stringify(fallbackResume));
  return fallbackResume;
}

/**
 * Get the most recent resume for a student.
 */
export async function getResume(userId) {
  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('student_id', userId)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error && data) return data;
  } catch (err) {}

  try {
    const stored = localStorage.getItem(`local_resume_${userId}`);
    if (stored) return JSON.parse(stored);
  } catch (e) {}

  return null;
}

/**
 * Delete a resume from Storage and database.
 */
export async function deleteResume(resumeId, storagePath, userId = null) {
  if (storagePath) {
    try {
      await supabase.storage.from('resumes').remove([storagePath]);
    } catch (storageErr) {
      console.warn('[deleteResume] Storage remove notice:', storageErr.message);
    }
  }

  try {
    await supabase.from('resume_skills').delete().eq('resume_id', resumeId);
    await supabase.from('resumes').delete().eq('id', resumeId);
  } catch (e) {}

  // Clean local caches
  if (userId) {
    localStorage.removeItem(`local_resume_${userId}`);
    localStorage.removeItem(`local_skills_${userId}`);
  } else {
    // Scan localStorage for matching resume
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('local_resume_')) {
        const val = localStorage.getItem(key);
        if (val && val.includes(resumeId)) {
          localStorage.removeItem(key);
        }
      }
    }
  }
}

/**
 * Update resume status (pending | processing | analyzed | failed)
 */
export async function updateResumeStatus(resumeId, status, rawText = null) {
  const updates = { status };
  if (rawText) updates.raw_text = rawText;

  try {
    const { data, error } = await supabase
      .from('resumes')
      .update(updates)
      .eq('id', resumeId)
      .select()
      .single();
    if (!error && data) return data;
  } catch (e) {}

  // Update local storage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('local_resume_')) {
      try {
        const item = JSON.parse(localStorage.getItem(key));
        if (item && item.id === resumeId) {
          const updated = { ...item, ...updates };
          localStorage.setItem(key, JSON.stringify(updated));
          return updated;
        }
      } catch (err) {}
    }
  }

  return { id: resumeId, ...updates };
}
