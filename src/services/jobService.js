import { supabase, isSupabaseAvailable, markSupabaseOffline } from '../lib/supabase';

const DEFAULT_COMPANY_JOBS = [
  {
    id: 'job-seed-1',
    company_id: 'comp-seed',
    title: 'Senior Software Engineer (Full Stack)',
    description: 'Lead web application development using React, Node.js, and relational databases. Mentor junior developers and design scalable microservices architecture.',
    location: 'Bangalore / Hybrid',
    salary: '14 - 18 LPA',
    job_type: 'Full-Time',
    min_cgpa: 7.5,
    max_backlogs: 0,
    deadline: '2026-10-31',
    status: 'Active',
    created_at: new Date().toISOString(),
    job_skills: [
      { id: 'js-1', skill_name: 'React' },
      { id: 'js-2', skill_name: 'Node.js' },
      { id: 'js-3', skill_name: 'SQL' },
      { id: 'js-4', skill_name: 'Java' }
    ],
    companies: {
      name: 'Apex Technologies',
      logo_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&h=120&fit=crop'
    }
  },
  {
    id: 'job-seed-2',
    company_id: 'comp-seed',
    title: 'Cloud & DevOps Associate',
    description: 'Maintain CI/CD pipelines, container orchestration with Docker/Kubernetes, and cloud deployment on AWS infrastructure.',
    location: 'Hyderabad / On-site',
    salary: '9 - 13 LPA',
    job_type: 'Full-Time',
    min_cgpa: 7.0,
    max_backlogs: 0,
    deadline: '2026-11-15',
    status: 'Active',
    created_at: new Date().toISOString(),
    job_skills: [
      { id: 'js-5', skill_name: 'Python' },
      { id: 'js-6', skill_name: 'Docker' },
      { id: 'js-7', skill_name: 'Linux' },
      { id: 'js-8', skill_name: 'Git' }
    ],
    companies: {
      name: 'Apex Technologies',
      logo_url: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=120&h=120&fit=crop'
    }
  }
];

/** Get all active jobs with company info and skills */
export async function getJobs(filters = {}) {
  if (isSupabaseAvailable()) {
    try {
      let query = supabase
        .from('jobs')
        .select('*, job_skills(*), companies(name, logo_url, industry)')
        .order('created_at', { ascending: false });

      if (filters.status) query = query.eq('status', filters.status);
      else query = query.eq('status', 'Active');

      if (filters.search) query = query.ilike('title', `%${filters.search}%`);
      if (filters.min_cgpa) query = query.lte('min_cgpa', filters.min_cgpa);

      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    } catch (err) {
      markSupabaseOffline();
    }
  }

  // Local fallback: read cached jobs
  try {
    const cached = localStorage.getItem('local_all_jobs');
    const userPosted = cached ? JSON.parse(cached) : [];
    const all = [...userPosted, ...DEFAULT_COMPANY_JOBS];
    return all;
  } catch (e) {
    return DEFAULT_COMPANY_JOBS;
  }
}

/** Get a single job with full details */
export async function getJob(jobId) {
  if (isSupabaseAvailable()) {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, job_skills(*), companies(name, logo_url, industry, location, website)')
        .eq('id', jobId)
        .single();
      if (!error && data) return data;
    } catch (err) {
      markSupabaseOffline();
    }
  }

  const all = await getJobs();
  return all.find(j => String(j.id) === String(jobId)) || all[0];
}

/** Create a job and its required skills */
export async function createJob(companyId, jobData, skillNames = []) {
  const newJobObj = {
    id: `job-${Date.now()}`,
    company_id: companyId || 'comp-default',
    title: jobData.title,
    description: jobData.description || '',
    location: jobData.location || 'Bangalore / Hybrid',
    salary: jobData.salary || '8.5 - 12 LPA',
    job_type: jobData.job_type || 'Full-Time',
    min_cgpa: jobData.min_cgpa || 6.5,
    max_backlogs: jobData.max_backlogs || 0,
    deadline: jobData.deadline || '2026-09-30',
    status: 'Active',
    created_at: new Date().toISOString(),
    job_skills: (skillNames || []).map((s, idx) => ({ id: `js-${Date.now()}-${idx}`, skill_name: s })),
    companies: {
      name: jobData.company_name || 'Apex Partner Recruiter',
      logo_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&h=120&fit=crop'
    }
  };

  // 1. Try Supabase if available
  if (isSupabaseAvailable()) {
    try {
      const { data: job, error } = await supabase
        .from('jobs')
        .insert({ company_id: companyId, ...jobData })
        .select()
        .single();

      if (!error && job) {
        if (skillNames.length) {
          const skillRows = skillNames.map(s => ({
            job_id: job.id,
            skill_name: s.trim(),
            importance: 'required'
          }));
          await supabase.from('job_skills').insert(skillRows);
        }
        newJobObj.id = job.id;
      }
    } catch (err) {
      markSupabaseOffline();
    }
  }

  // 2. Also try posting to local Express backend if running
  try {
    await fetch('http://localhost:5000/api/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({
        company_id: 1,
        title: jobData.title,
        description: jobData.description,
        cgpa_required: jobData.min_cgpa,
        max_backlogs: jobData.max_backlogs,
        department: 'CSE, ECE, IT',
        required_skills: skillNames.join(', '),
        deadline: jobData.deadline,
        salary: jobData.salary,
        type: jobData.job_type
      })
    });
  } catch (backendErr) {
    // Non-critical local Express fetch notice
  }

  // 3. Persist locally to company jobs cache
  try {
    const compKey = `local_company_jobs_${companyId}`;
    const existingCompJobs = JSON.parse(localStorage.getItem(compKey) || '[]');
    localStorage.setItem(compKey, JSON.stringify([newJobObj, ...existingCompJobs]));

    const existingAllJobs = JSON.parse(localStorage.getItem('local_all_jobs') || '[]');
    localStorage.setItem('local_all_jobs', JSON.stringify([newJobObj, ...existingAllJobs]));
  } catch (storageErr) {
    console.warn('Local storage job caching warning:', storageErr);
  }

  return newJobObj;
}

/** Update a job */
export async function updateJob(jobId, updates) {
  if (isSupabaseAvailable()) {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', jobId)
        .select()
        .maybeSingle();
      if (!error && data) return data;
    } catch (err) {
      markSupabaseOffline();
    }
  }
  return { id: jobId, ...updates };
}

/** Delete a job */
export async function deleteJob(jobId) {
  if (isSupabaseAvailable()) {
    try {
      await supabase.from('jobs').delete().eq('id', jobId);
    } catch (err) {
      markSupabaseOffline();
    }
  }

  // Remove from localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('local_company_jobs_') || key === 'local_all_jobs')) {
      try {
        const jobs = JSON.parse(localStorage.getItem(key));
        if (Array.isArray(jobs)) {
          const filtered = jobs.filter(j => String(j.id) !== String(jobId));
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      } catch (e) {}
    }
  }
}

/** Get or create company profile for a user */
export async function getOrCreateCompany(profileId, name) {
  const localCompany = {
    id: String(profileId || 'comp-default'),
    profile_id: profileId,
    name: name || 'Partner Company',
    location: 'Bangalore / Hybrid',
    industry: 'Software & Technology'
  };

  if (isSupabaseAvailable()) {
    try {
      let { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (!error && company) return company;

      if (!company) {
        const { data: created, error: insertError } = await supabase
          .from('companies')
          .insert({ profile_id: profileId, name })
          .select()
          .maybeSingle();
        if (!insertError && created) return created;
      }
    } catch (err) {
      markSupabaseOffline();
    }
  }

  // Fallback to local storage
  try {
    const stored = localStorage.getItem(`local_company_${profileId}`);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(`local_company_${profileId}`, JSON.stringify(localCompany));
  } catch (e) {}

  return localCompany;
}

/** Get all jobs for a company */
export async function getCompanyJobs(companyId) {
  if (isSupabaseAvailable()) {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, job_skills(*)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (err) {
      markSupabaseOffline();
    }
  }

  // Local fallback: read company specific jobs or defaults
  try {
    const stored = localStorage.getItem(`local_company_jobs_${companyId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  return DEFAULT_COMPANY_JOBS;
}

/** Get applicants for a job */
export async function getJobApplicants(jobId) {
  if (isSupabaseAvailable()) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*, profiles(name, email, department, cgpa, profile_photo_url)')
        .eq('job_id', jobId)
        .order('match_score', { ascending: false });
      if (!error && data) return data;
    } catch (err) {
      markSupabaseOffline();
    }
  }

  // Local fallback: look for applications in local storage
  const localApplicants = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('local_apps_')) {
        const apps = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(apps)) {
          const matching = apps.filter(a => String(a.job_id) === String(jobId));
          localApplicants.push(...matching);
        }
      }
    }
  } catch (e) {}

  return localApplicants;
}
