import { supabase } from '../lib/supabase';

/** Apply for a job (with local cache fallback) */
export async function applyForJob(studentId, jobId, matchScore = null, jobObj = null, coverNote = '') {
  let dbResult = null;
  try {
    const { data, error } = await supabase
      .from('applications')
      .insert({
        student_id: studentId,
        job_id: jobId,
        match_score: matchScore,
        cover_note: coverNote,
        status: 'Under Review'
      })
      .select()
      .maybeSingle();

    if (!error && data) dbResult = data;
  } catch (err) {
    console.warn('[applicationService] DB insert notice:', err.message);
  }

  // Create standardized application object if DB call fails or offline
  const newApp = dbResult || {
    id: `app-${Date.now()}`,
    student_id: studentId,
    job_id: jobId,
    match_score: matchScore || 75,
    cover_note: coverNote,
    status: 'Under Review',
    applied_at: new Date().toISOString(),
    jobs: {
      id: jobId,
      title: jobObj?.title || 'Software Engineer',
      salary: jobObj?.salary || '$10,000 / yr',
      companies: {
        name: jobObj?.company_name || jobObj?.company || 'Campus Partner'
      }
    }
  };

  // Save to local storage cache so application persists across reloads
  try {
    const cacheKey = `local_apps_${studentId}`;
    const existingCache = JSON.parse(localStorage.getItem(cacheKey) || '[]');
    const filtered = existingCache.filter(a => a.job_id !== jobId);
    localStorage.setItem(cacheKey, JSON.stringify([newApp, ...filtered]));
  } catch (e) {
    // Ignore storage quota warnings
  }

  return newApp;
}

/** Get all applications for a student */
export async function getStudentApplications(studentId) {
  let dbApps = [];
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        jobs (
          id, title, location, salary, job_type, deadline,
          companies ( name, logo_url )
        )
      `)
      .eq('student_id', studentId)
      .order('applied_at', { ascending: false });

    if (!error && data) dbApps = data;
  } catch (err) {
    console.warn('[applicationService] DB fetch notice:', err.message);
  }

  // Combine with local storage cached applications
  let cachedApps = [];
  try {
    const cacheKey = `local_apps_${studentId}`;
    cachedApps = JSON.parse(localStorage.getItem(cacheKey) || '[]');
  } catch (e) {}

  const mergedMap = new Map();
  // DB apps take precedence over cache
  [...cachedApps, ...dbApps].forEach(app => {
    const key = app.job_id || app.id;
    if (!mergedMap.has(key)) {
      mergedMap.set(key, app);
    } else if (dbApps.find(d => d.job_id === key)) {
      // Prefer DB version if available
      mergedMap.set(key, app);
    }
  });

  return Array.from(mergedMap.values());
}

/**
 * Get applications for a job (company view).
 * Uses separate queries to avoid invalid nested join syntax.
 */
export async function getJobApplications(jobId) {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        profiles ( id, name, email, department, cgpa, profile_photo_url, skills, graduation_year, backlogs )
      `)
      .eq('job_id', jobId)
      .order('match_score', { ascending: false });

    if (error) {
      console.warn('[applicationService] getJobApplications error:', error.message);
      return [];
    }

    // Separately enrich with skill scores for each applicant
    const apps = data || [];
    const enriched = await Promise.all(apps.map(async (app) => {
      let skillScores = [];
      if (app.profiles?.id) {
        const { data: scores } = await supabase
          .from('skill_scores')
          .select('skill_name, final_score')
          .eq('student_id', app.profiles.id)
          .order('final_score', { ascending: false })
          .limit(8);
        skillScores = scores || [];
      }
      return { ...app, skillScores };
    }));

    return enriched;
  } catch (err) {
    console.warn('[applicationService] getJobApplications catch:', err.message);
    return [];
  }
}

/** Update application status (HR company portal & student sync) */
export async function updateApplicationStatus(applicationId, status) {
  let dbResult = null;
  try {
    const { data } = await supabase
      .from('applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', applicationId)
      .select()
      .maybeSingle();

    if (data) dbResult = data;
  } catch (err) {
    console.warn('[applicationService] DB status update notice:', err.message);
  }

  // Update in local storage cache so status updates reflect across student and HR portals
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('local_apps_')) {
        const apps = JSON.parse(localStorage.getItem(key) || '[]');
        let modified = false;
        const updatedApps = apps.map(app => {
          if (app.id === applicationId || app.job_id === applicationId) {
            modified = true;
            return { ...app, status, updated_at: new Date().toISOString() };
          }
          return app;
        });

        if (modified) {
          localStorage.setItem(key, JSON.stringify(updatedApps));
        }
      }
    }
  } catch (e) {
    console.warn('Local storage status update warning:', e);
  }

  return dbResult || { id: applicationId, status };
}

/** Withdraw an application (student) */
export async function withdrawApplication(applicationId, studentId) {
  let dbResult = null;
  try {
    const { data, error } = await supabase
      .from('applications')
      .update({ status: 'Withdrawn', updated_at: new Date().toISOString() })
      .eq('id', applicationId)
      .eq('student_id', studentId)
      .select()
      .maybeSingle();
    if (!error && data) dbResult = data;
  } catch (err) {
    console.warn('[applicationService] withdrawApplication error:', err.message);
  }

  // Also update cache
  try {
    const cacheKey = `local_apps_${studentId}`;
    const apps = JSON.parse(localStorage.getItem(cacheKey) || '[]');
    const updated = apps.map(a => a.id === applicationId ? { ...a, status: 'Withdrawn' } : a);
    localStorage.setItem(cacheKey, JSON.stringify(updated));
  } catch (e) {}

  return dbResult || { id: applicationId, status: 'Withdrawn' };
}

/** Check if student has already applied */
export async function hasApplied(studentId, jobId) {
  try {
    const { data } = await supabase
      .from('applications')
      .select('id, status')
      .eq('student_id', studentId)
      .eq('job_id', jobId)
      .maybeSingle();
    return data;
  } catch (err) {
    // Also check local cache
    try {
      const cacheKey = `local_apps_${studentId}`;
      const apps = JSON.parse(localStorage.getItem(cacheKey) || '[]');
      return apps.find(a => a.job_id === jobId) || null;
    } catch (e) {
      return null;
    }
  }
}
