import { supabase } from '../lib/supabase';

/** Schedule an interview for an application */
export async function scheduleInterview(applicationId, details) {
  // Update application status
  await supabase.from('applications')
    .update({ status: 'Interview Scheduled', updated_at: new Date().toISOString() })
    .eq('id', applicationId);

  const { data, error } = await supabase
    .from('interviews')
    .insert({ application_id: applicationId, ...details })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Get all interviews for a student.
 * Supabase PostgREST does not support filtering on nested foreign table columns
 * directly (e.g. .eq('applications.student_id', id)). We do a two-step query:
 * 1. Fetch all application IDs for this student.
 * 2. Fetch interviews whose application_id is in that set.
 */
export async function getStudentInterviews(studentId) {
  try {
    // Step 1: get application IDs for this student
    const { data: apps, error: appsError } = await supabase
      .from('applications')
      .select('id, status, job_id')
      .eq('student_id', studentId);

    if (appsError || !apps || apps.length === 0) return [];

    const appIds = apps.map(a => a.id);

    // Step 2: fetch interviews for those application IDs
    const { data, error } = await supabase
      .from('interviews')
      .select(`
        *,
        applications (
          id, status,
          jobs ( title, location, companies ( name, logo_url ) )
        )
      `)
      .in('application_id', appIds)
      .order('interview_date', { ascending: true });

    if (error) return [];
    return data || [];
  } catch (err) {
    console.warn('[interviewService] getStudentInterviews error:', err.message);
    return [];
  }
}

/** Get all interviews for a company's jobs */
export async function getCompanyInterviews(companyId) {
  try {
    // First get job IDs for this company
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('company_id', companyId);

    if (!jobs || jobs.length === 0) return [];
    const jobIds = jobs.map(j => j.id);

    // Then get application IDs for those jobs
    const { data: apps } = await supabase
      .from('applications')
      .select('id')
      .in('job_id', jobIds);

    if (!apps || apps.length === 0) return [];
    const appIds = apps.map(a => a.id);

    const { data, error } = await supabase
      .from('interviews')
      .select(`
        *,
        applications (
          *,
          profiles ( name, email, department, cgpa ),
          jobs ( title )
        )
      `)
      .in('application_id', appIds)
      .order('interview_date', { ascending: true });

    if (error) return [];
    return data || [];
  } catch (err) {
    console.warn('[interviewService] getCompanyInterviews error:', err.message);
    return [];
  }
}

/** Update interview result */
export async function updateInterviewResult(interviewId, result) {
  const { data, error } = await supabase
    .from('interviews')
    .update({ result })
    .eq('id', interviewId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
