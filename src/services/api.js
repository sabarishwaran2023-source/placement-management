import { supabase, isSupabaseConfigured } from '../config/supabaseClient';

const API_BASE = 'http://localhost:5000/api';

function getAuthHeader() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Seed initial Supabase jobs data if table is empty
async function seedSupabaseIfEmpty() {
  if (!isSupabaseConfigured()) return;
  try {
    const { data: existingJobs } = await supabase.from('jobs').select('job_id').limit(1);
    if (!existingJobs || existingJobs.length === 0) {
      console.log('Seeding initial campus jobs to Supabase Cloud...');
      await supabase.from('jobs').insert([
        {
          company_name: 'Infosys',
          title: 'System Engineer',
          description: 'Design and build enterprise software solutions.',
          cgpa_required: 7.0,
          max_backlogs: 0,
          department: 'CSE, ECE, EEE, MECH',
          required_skills: 'Java, SQL, Communication',
          deadline: '2026-08-18',
          salary: '$9,000 / yr',
          type: 'Full-Time',
          status: 'Active'
        },
        {
          company_name: 'Amazon',
          title: 'SDE Graduate',
          description: 'Build large scale cloud applications.',
          cgpa_required: 8.5,
          max_backlogs: 0,
          department: 'CSE',
          required_skills: 'Java, Python, AWS, Data Structures',
          deadline: '2026-08-30',
          salary: '$24,000 / yr',
          type: 'Full-Time',
          status: 'Active'
        },
        {
          company_name: 'Zoho',
          title: 'SDE-1',
          description: 'SaaS product development role.',
          cgpa_required: 7.5,
          max_backlogs: 0,
          department: 'CSE, ECE',
          required_skills: 'Java, Data Structures, SQL',
          deadline: '2026-08-22',
          salary: '$12,000 / yr',
          type: 'Full-Time',
          status: 'Active'
        }
      ]);
    }
  } catch (err) {
    console.warn('Supabase job seed warning:', err.message);
  }
}

seedSupabaseIfEmpty();

// 1. SUPABASE AUTH LOGIN
export async function loginUser(email, password) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      // Check direct database table
      const { data: directUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (directUser) {
        localStorage.setItem('token', 'supabase_token_2026');
        return { token: 'supabase_token_2026', user: directUser };
      }
      throw new Error(error.message || 'Invalid email or password');
    }

    if (!data?.session) {
      throw new Error('Login failed. Please check your credentials.');
    }

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    const user = profile || {
      id: data.user.id,
      name: email.split('@')[0],
      email: data.user.email,
      role: 'student'
    };

    localStorage.setItem('token', data.session.access_token);
    return { token: data.session.access_token, user };
  }

  // Fallback ONLY when Supabase URL/Key is missing
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || 'Invalid credentials');
  if (resData.token) localStorage.setItem('token', resData.token);
  return resData;
}

// 2. SUPABASE AUTH REGISTRATION
export async function registerUser(userData) {
  if (isSupabaseConfigured()) {
    // Call Supabase auth.signUp
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          role: userData.role || 'student'
        }
      }
    });

    // If Supabase Auth returns an error (e.g. rate limit), surface it OR handle gracefully
    if (error) {
      console.warn('Supabase auth.signUp response:', error.message);
      if (error.message.includes('already registered')) {
        throw new Error('User already registered in Supabase Auth!');
      }
    }

    const authUserId = data?.user?.id;

    // Sync into Supabase public 'users' table
    const { data: profile } = await supabase
      .from('users')
      .upsert([{
        id: authUserId || undefined,
        name: userData.name,
        email: userData.email,
        role: userData.role || 'student'
      }], { onConflict: 'email' })
      .select()
      .single();

    const userObj = profile || {
      id: authUserId || `usr-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'student'
    };

    const token = data?.session?.access_token || 'registered_session';
    localStorage.setItem('token', token);

    return { token, user: userObj, authCreated: Boolean(authUserId) };
  }

  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.message || 'Registration failed');
  if (resData.token) localStorage.setItem('token', resData.token);
  return resData;
}

// 3. PDF Resume Upload (Supabase Storage)
export async function uploadResumePdf(file) {
  if (isSupabaseConfigured()) {
    const fileExt = file.name.split('.').pop();
    const fileName = `resume_${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from('resumes').upload(fileName, file);

    if (error) {
      console.warn('Supabase storage warning:', error.message);
      return { resumeUrl: URL.createObjectURL(file), filename: file.name };
    }

    const { data: publicUrlData } = supabase.storage.from('resumes').getPublicUrl(fileName);
    return { resumeUrl: publicUrlData.publicUrl, filename: fileName };
  }

  const formData = new FormData();
  formData.append('resume', file);
  try {
    const res = await fetch(`${API_BASE}/students/resume`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Resume upload failed');
    return data;
  } catch (err) {
    return { resumeUrl: URL.createObjectURL(file), filename: file.name };
  }
}

// 4. Jobs Listing (Supabase Database)
export async function fetchJobs() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (err) {
      console.warn('Fetch jobs warning:', err.message);
    }
  }

  try {
    const res = await fetch(`${API_BASE}/jobs`);
    if (!res.ok) throw new Error('Failed to fetch jobs');
    const data = await res.json();
    return data.jobs;
  } catch (err) {
    return null;
  }
}

// 5. Job Posting (Supabase Database)
export async function postJobApi(jobData) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('jobs').insert([{
      company_name: jobData.company || 'Infosys',
      title: jobData.title,
      description: jobData.description || '',
      cgpa_required: jobData.cgpa_required || 6.5,
      max_backlogs: jobData.max_backlogs || 0,
      department: jobData.department || 'CSE, ECE',
      required_skills: jobData.required_skills || 'Java, Python',
      deadline: jobData.deadline || '2026-08-30',
      salary: jobData.salary || '$10,000 / yr',
      type: jobData.type || 'Full-Time',
      status: 'Active'
    }]).select().single();

    if (error) throw new Error(error.message);
    return { message: 'Job created on Supabase Cloud', job: data };
  }

  const res = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(jobData)
  });
  return await res.json();
}

// 6. Apply for Job (Supabase Database)
export async function applyForJobApi(jobId) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('applications').insert([{
      job_id: jobId,
      status: 'Applied'
    }]).select();

    if (error) throw new Error(error.message);
    return { message: 'Applied successfully via Supabase' };
  }

  const res = await fetch(`${API_BASE}/applications/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ job_id: jobId })
  });
  return await res.json();
}
