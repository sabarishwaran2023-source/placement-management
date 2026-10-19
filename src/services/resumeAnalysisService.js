import { supabase } from '../lib/supabase';

// Comprehensive skill keyword list for client-side fallback extraction
const SKILL_KEYWORDS = {
  languages: ['java','python','c++','c#','javascript','typescript','go','rust','kotlin','swift','php','ruby','scala','r','matlab','perl','bash','shell','dart','lua'],
  frameworks: ['react','angular','vue','next.js','nuxt','spring','spring boot','django','flask','fastapi','express','node.js','rails','laravel','asp.net','hibernate','flutter','react native'],
  databases: ['mysql','postgresql','mongodb','redis','sqlite','oracle','sql server','cassandra','dynamodb','elasticsearch','firebase','supabase','mariadb','neo4j'],
  cloud: ['aws','azure','gcp','google cloud','docker','kubernetes','terraform','ansible','jenkins','ci/cd','github actions','linux','nginx','apache'],
  tools: ['git','github','gitlab','bitbucket','jira','confluence','figma','postman','swagger','vs code','intellij','eclipse','maven','gradle','npm','yarn','webpack','vite'],
  skills: ['machine learning','deep learning','nlp','data science','data analysis','computer vision','pandas','numpy','scikit-learn','tensorflow','pytorch','keras','sql','nosql','rest api','graphql','microservices','agile','scrum','devops'],
  soft: ['communication','leadership','teamwork','problem solving','analytical','project management']
};

/**
 * Extract skills from resume text using keyword matching.
 * Returns array of { skill_name, category }
 */
export function extractSkillsFromText(text) {
  const lowerText = text.toLowerCase();
  const found = [];
  const seen = new Set();

  for (const [category, skills] of Object.entries(SKILL_KEYWORDS)) {
    for (const skill of skills) {
      // Match whole word or phrase
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lowerText) && !seen.has(skill.toLowerCase())) {
        seen.add(skill.toLowerCase());
        found.push({
          skill_name: skill.charAt(0).toUpperCase() + skill.slice(1),
          category
        });
      }
    }
  }

  return found;
}

/**
 * Extract education data from resume text.
 */
export function extractEducationFromText(text) {
  const cgpaMatch = text.match(/(?:cgpa|gpa|percentage)[:\s]+(\d+\.?\d*)/i);
  const yearMatch = text.match(/20(2[0-9]|3[0-5])/);
  const deptMatch = text.match(/\b(cse|ece|eee|mech|civil|it|aids|aiml|computer science|electronics|mechanical)\b/i);

  return {
    cgpa: cgpaMatch ? parseFloat(cgpaMatch[1]) : null,
    graduation_year: yearMatch ? parseInt('20' + yearMatch[1]) : null,
    department: deptMatch ? deptMatch[1].toUpperCase() : null
  };
}

/**
 * Save extracted skills to the resume_skills table (with local fallback).
 */
export async function saveResumeSkills(resumeId, studentId, skills) {
  const localSkills = skills.map((s, idx) => ({
    id: `skill-${Date.now()}-${idx}`,
    resume_id: resumeId,
    student_id: studentId,
    skill_name: s.skill_name,
    category: s.category || 'other',
    confirmed: false
  }));

  try {
    await supabase.from('resume_skills').delete().eq('resume_id', resumeId);
    if (!skills.length) {
      localStorage.setItem(`local_skills_${studentId}`, JSON.stringify([]));
      return [];
    }

    const rows = skills.map(s => ({
      resume_id: resumeId,
      student_id: studentId,
      skill_name: s.skill_name,
      category: s.category || 'other',
      confirmed: false
    }));

    const { data, error } = await supabase.from('resume_skills').insert(rows).select();
    if (!error && data) {
      localStorage.setItem(`local_skills_${studentId}`, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('[resumeAnalysisService] Supabase offline, saving skills locally:', err.message);
  }

  // Local storage fallback
  localStorage.setItem(`local_skills_${studentId}`, JSON.stringify(localSkills));
  return localSkills;
}

/**
 * Get all resume skills for a student.
 */
export async function getResumeSkills(studentId) {
  try {
    const { data, error } = await supabase
      .from('resume_skills')
      .select('*')
      .eq('student_id', studentId)
      .order('confirmed', { ascending: false });
    if (!error && data && data.length > 0) return data;
  } catch (err) {}

  try {
    const stored = localStorage.getItem(`local_skills_${studentId}`);
    if (stored) return JSON.parse(stored);
  } catch (e) {}

  return [];
}

/**
 * Confirm or deny a specific resume skill.
 */
export async function confirmSkill(skillId, confirmed) {
  try {
    const { data, error } = await supabase
      .from('resume_skills')
      .update({ confirmed })
      .eq('id', skillId)
      .select()
      .single();
    if (!error && data) return data;
  } catch (err) {}

  // Local storage fallback
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('local_skills_')) {
      try {
        const skills = JSON.parse(localStorage.getItem(key));
        if (Array.isArray(skills)) {
          const idx = skills.findIndex(s => s.id === skillId);
          if (idx !== -1) {
            skills[idx].confirmed = confirmed;
            localStorage.setItem(key, JSON.stringify(skills));
            return skills[idx];
          }
        }
      } catch (e) {}
    }
  }

  return { id: skillId, confirmed };
}

/**
 * Confirm all detected skills at once.
 */
export async function confirmAllSkills(studentId) {
  try {
    await supabase.from('resume_skills').update({ confirmed: true }).eq('student_id', studentId);
  } catch (err) {}

  try {
    const stored = localStorage.getItem(`local_skills_${studentId}`);
    if (stored) {
      const skills = JSON.parse(stored);
      if (Array.isArray(skills)) {
        const updated = skills.map(s => ({ ...s, confirmed: true }));
        localStorage.setItem(`local_skills_${studentId}`, JSON.stringify(updated));
      }
    }
  } catch (e) {}
}

/**
 * Add a custom skill manually.
 */
export async function addCustomSkill(resumeId, studentId, skillName, category = 'other') {
  const newSkill = {
    id: `skill-${Date.now()}`,
    resume_id: resumeId,
    student_id: studentId,
    skill_name: skillName,
    category,
    confirmed: true
  };

  try {
    const { data, error } = await supabase
      .from('resume_skills')
      .insert({ resume_id: resumeId, student_id: studentId, skill_name: skillName, category, confirmed: true })
      .select()
      .single();
    if (!error && data) return data;
  } catch (err) {}

  try {
    const stored = localStorage.getItem(`local_skills_${studentId}`);
    const skills = stored ? JSON.parse(stored) : [];
    skills.push(newSkill);
    localStorage.setItem(`local_skills_${studentId}`, JSON.stringify(skills));
  } catch (e) {}

  return newSkill;
}

/**
 * Delete a skill from resume_skills.
 */
export async function removeResumeSkill(skillId) {
  try {
    await supabase.from('resume_skills').delete().eq('id', skillId);
  } catch (err) {}

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('local_skills_')) {
      try {
        const skills = JSON.parse(localStorage.getItem(key));
        if (Array.isArray(skills)) {
          const filtered = skills.filter(s => s.id !== skillId);
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      } catch (e) {}
    }
  }
}

/**
 * Process resume: extract text (client-side) → extract skills → save to DB / local cache.
 */
export async function processResumeText(resumeId, studentId, rawText) {
  try {
    await supabase.from('resumes').update({ raw_text: rawText, status: 'analyzed' }).eq('id', resumeId);
  } catch (err) {}

  // Extract skills
  const extractedSkills = extractSkillsFromText(rawText);

  // Extract education
  const education = extractEducationFromText(rawText);

  // Save skills locally and/or to DB
  const savedSkills = await saveResumeSkills(resumeId, studentId, extractedSkills);

  // Update profile with education if found
  if (education.cgpa || education.graduation_year || education.department) {
    const profileUpdates = {};
    if (education.cgpa) profileUpdates.cgpa = education.cgpa;
    if (education.graduation_year) profileUpdates.graduation_year = education.graduation_year;
    if (education.department) profileUpdates.department = education.department;
    try {
      await supabase.from('profiles').update(profileUpdates).eq('id', studentId);
    } catch (err) {}
  }

  // Update local resume with raw text
  try {
    const stored = localStorage.getItem(`local_resume_${studentId}`);
    if (stored) {
      const resObj = JSON.parse(stored);
      resObj.raw_text = rawText;
      resObj.status = 'analyzed';
      localStorage.setItem(`local_resume_${studentId}`, JSON.stringify(resObj));
    }
  } catch (e) {}

  return { skills: savedSkills, education, rawSkillCount: extractedSkills.length };
}
