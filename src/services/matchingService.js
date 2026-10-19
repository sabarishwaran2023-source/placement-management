import { supabase } from '../lib/supabase';

/**
 * Calculate match score between a student and a job.
 * Returns { matchScore, matchedSkills, missingSkills, eligible }
 */
export async function calculateMatchScore(studentId, jobId) {
  // Fetch job requirements
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*, job_skills(*)')
    .eq('id', jobId)
    .maybeSingle();
  if (jobError || !job) throw new Error(jobError?.message || 'Job not found.');

  // Fetch student profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('cgpa, department, graduation_year, backlogs')
    .eq('id', studentId)
    .maybeSingle();

  // Fetch student skill scores
  const { data: skillScores } = await supabase
    .from('skill_scores')
    .select('skill_name, final_score')
    .eq('student_id', studentId);

  const studentSkills = {};
  (skillScores || []).forEach(s => {
    studentSkills[s.skill_name.toLowerCase()] = s.final_score;
  });

  // Eligibility checks
  const eligibilityChecks = {
    cgpa: !job.min_cgpa || (profile?.cgpa >= job.min_cgpa),
    backlogs: profile?.backlogs <= (job.max_backlogs || 0),
    deadline: !job.deadline || new Date(job.deadline) >= new Date(),
  };
  const eligible = Object.values(eligibilityChecks).every(Boolean);

  // Skill matching
  const requiredSkills = (job.job_skills || []).map(s => ({
    name: s.skill_name.toLowerCase(),
    display: s.skill_name,
    importance: s.importance
  }));

  const matchedSkills = [];
  const missingSkills = [];
  let totalWeight = 0;
  let matchedWeight = 0;

  for (const reqSkill of requiredSkills) {
    const weight = reqSkill.importance === 'required' ? 2 : 1;
    totalWeight += weight;

    const studentScore = studentSkills[reqSkill.name] || 0;
    if (studentScore > 0) {
      matchedSkills.push({ name: reqSkill.display, score: Math.round(studentScore) });
      matchedWeight += weight * (studentScore / 100);
    } else {
      missingSkills.push(reqSkill.display);
    }
  }

  const skillMatchPercent = totalWeight > 0
    ? Math.round((matchedWeight / totalWeight) * 100)
    : 0;

  // CGPA boost (max 5%)
  const cgpaBoost = profile?.cgpa ? Math.min(5, (profile.cgpa - 6) * 1.25) : 0;
  const matchScore = Math.min(99, skillMatchPercent + cgpaBoost);

  return {
    matchScore: Math.round(matchScore),
    skillMatchPercent,
    matchedSkills,
    missingSkills,
    eligible,
    eligibilityChecks,
    jobTitle: job.title
  };
}

/**
 * Get recommended jobs for a student, sorted by match score.
 * Returns array of { job, matchScore, matchedSkills, missingSkills, eligible }
 */
const CAMPUS_JOB_DRIVES = [
  {
    id: 'job-infosys-1',
    company_name: 'Infosys',
    title: 'System Engineer',
    description: 'Design and build enterprise software solutions across web and database platforms.',
    salary: '$9,000 / yr',
    min_cgpa: 7.0,
    max_backlogs: 0,
    department: 'CSE, ECE, EEE, MECH',
    required_skills: 'Java, SQL, React, Communication',
    deadline: '2026-10-30',
    type: 'Full-Time',
    status: 'Active',
    location: 'Bangalore / Hybrid',
    skill_list: ['Java', 'SQL', 'React', 'Communication']
  },
  {
    id: 'job-amazon-1',
    company_name: 'Amazon',
    title: 'SDE Graduate',
    description: 'Build large-scale cloud applications and scalable distributed systems.',
    salary: '$24,000 / yr',
    min_cgpa: 8.0,
    max_backlogs: 0,
    department: 'CSE, ECE',
    required_skills: 'Java, Python, Data Structures, Algorithms',
    deadline: '2026-11-15',
    type: 'Full-Time',
    status: 'Active',
    location: 'Bengaluru / On-site',
    skill_list: ['Java', 'Python', 'Data Structures', 'Algorithms']
  },
  {
    id: 'job-zoho-1',
    company_name: 'Zoho',
    title: 'SDE-1 Software Developer',
    description: 'SaaS product development with heavy emphasis on Data Structures and clean code.',
    salary: '$12,000 / yr',
    min_cgpa: 7.5,
    max_backlogs: 0,
    department: 'CSE, ECE',
    required_skills: 'Java, Data Structures, SQL, JavaScript',
    deadline: '2026-10-25',
    type: 'Full-Time',
    status: 'Active',
    location: 'Chennai / Hybrid',
    skill_list: ['Java', 'Data Structures', 'SQL', 'JavaScript']
  },
  {
    id: 'job-accenture-1',
    company_name: 'Accenture',
    title: 'Application Development Associate',
    description: 'Develop dynamic web applications and cloud integrations.',
    salary: '$8,500 / yr',
    min_cgpa: 6.5,
    max_backlogs: 1,
    department: 'CSE, ECE, EEE',
    required_skills: 'JavaScript, React, SQL, Git',
    deadline: '2026-10-20',
    type: 'Full-Time',
    status: 'Active',
    location: 'Hyderabad',
    skill_list: ['JavaScript', 'React', 'SQL', 'Git']
  },
  {
    id: 'job-tcs-1',
    company_name: 'TCS',
    title: 'Ninja Software Developer',
    description: 'Entry level software development in core programming languages.',
    salary: '$7,500 / yr',
    min_cgpa: 6.5,
    max_backlogs: 1,
    department: 'CSE, ECE, EEE, MECH',
    required_skills: 'C++, Python, SQL',
    deadline: '2026-10-18',
    type: 'Full-Time',
    status: 'Active',
    location: 'Pune / On-site',
    skill_list: ['C++', 'Python', 'SQL']
  }
];

/**
 * Get recommended jobs for a student, sorted by skill match score.
 * Returns array of { job, matchScore, matchedSkills, missingSkills, eligible }
 */
export async function getRecommendedJobs(studentId, limit = 20) {
  let jobsList = [];
  try {
    const { data: jobs } = await supabase
      .from('jobs')
      .select('*, job_skills(*), companies(name, logo_url)')
      .eq('status', 'Active')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (jobs && jobs.length > 0) {
      jobsList = jobs;
    }
  } catch (err) {
    console.warn('[matchingService] Database fetch notice:', err.message);
  }

  // Fallback to campus job drives if DB is empty
  if (!jobsList.length) {
    jobsList = CAMPUS_JOB_DRIVES;
  }

  // Get student profile with fallback
  let profile = null;
  let skillScores = [];
  let resumeSkills = [];

  try {
    const { data: prof } = await supabase
      .from('profiles')
      .select('cgpa, department, graduation_year, backlogs')
      .eq('id', studentId)
      .maybeSingle();
    profile = prof;

    const { data: scores } = await supabase
      .from('skill_scores')
      .select('skill_name, final_score')
      .eq('student_id', studentId);
    skillScores = scores || [];

    const { data: rSkills } = await supabase
      .from('resume_skills')
      .select('skill_name, confirmed')
      .eq('student_id', studentId);
    resumeSkills = rSkills || [];
  } catch (err) {
    console.warn('[matchingService] Notice fetching student data:', err.message);
  }

  if (!profile) {
    try {
      const stored = localStorage.getItem('local_auth_profile');
      if (stored) profile = JSON.parse(stored);
    } catch (e) {}
  }

  // Build composite skill matrix for the student
  const studentSkillMap = {};
  
  // 1. Add resume skills with default base score
  (resumeSkills || []).forEach(s => {
    const key = s.skill_name.trim().toLowerCase();
    studentSkillMap[key] = s.confirmed ? 70 : 50;
  });

  // 2. Override with evaluated final skill scores if student took assessments
  (skillScores || []).forEach(s => {
    const key = s.skill_name.trim().toLowerCase();
    studentSkillMap[key] = s.final_score;
  });

  // Calculate Match Score for each job drive
  const results = jobsList.map(job => {
    let reqSkills = [];
    if (job.job_skills && job.job_skills.length > 0) {
      reqSkills = job.job_skills.map(s => s.skill_name);
    } else if (job.skill_list) {
      reqSkills = job.skill_list;
    } else if (job.required_skills) {
      reqSkills = job.required_skills.split(',').map(s => s.trim());
    }

    const normalizedReq = reqSkills.map(s => s.trim().toLowerCase());
    
    const matchedSkills = [];
    const missingSkills = [];
    let totalSkillSum = 0;

    normalizedReq.forEach((reqSkill, idx) => {
      const origName = reqSkills[idx] || reqSkill;
      let foundScore = 0;
      for (const [stSkill, score] of Object.entries(studentSkillMap)) {
        if (stSkill.includes(reqSkill) || reqSkill.includes(stSkill)) {
          foundScore = Math.max(foundScore, score);
        }
      }

      if (foundScore > 0) {
        matchedSkills.push(origName);
        totalSkillSum += foundScore;
      } else {
        missingSkills.push(origName);
      }
    });

    const avgSkillScore = normalizedReq.length > 0
      ? totalSkillSum / normalizedReq.length
      : 50;

    // Academic CGPA Boost (max 5%)
    const cgpaBoost = profile?.cgpa ? Math.min(5, Math.max(0, (profile.cgpa - 6) * 1.25)) : 0;
    const rawMatchScore = Math.round(avgSkillScore + cgpaBoost);
    const matchScore = Math.min(99, Math.max(30, rawMatchScore));

    const eligible =
      (!job.min_cgpa || (profile?.cgpa >= job.min_cgpa)) &&
      (profile?.backlogs <= (job.max_backlogs || 0)) &&
      (!job.deadline || new Date(job.deadline) >= new Date());

    return {
      job: {
        ...job,
        // Normalize company name from both DB and fallback shapes
        company_name: job.companies?.name || job.company_name || 'Campus Partner',
        // Ensure id is always accessible as both id and job_id
        id: job.id,
      },
      matchScore,
      matchedSkills,
      missingSkills,
      eligible
    };
  });

  // Sort by match score descending (highest skill match at top)
  return results.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Get label for a match score
 */
export function getMatchLabel(score) {
  if (score >= 85) return { label: 'Highly Recommended', color: 'emerald' };
  if (score >= 70) return { label: 'Good Match', color: 'blue' };
  if (score >= 50) return { label: 'Moderate Match', color: 'yellow' };
  return { label: 'Low Match', color: 'rose' };
}
