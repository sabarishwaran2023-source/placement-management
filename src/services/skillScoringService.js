import { supabase } from '../lib/supabase';

// Weighting formula
const WEIGHTS = {
  resume: 0.20,   // Resume evidence
  mcq: 0.35,      // MCQ assessment score
  coding: 0.45    // Coding assessment score
};

/**
 * Compute skill score for one skill.
 * resumeScore: 0-100 (100 if skill is in confirmed resume skills)
 * mcqScore: 0-100 from topic-wise MCQ performance
 * codingScore: 0-100 from coding submission
 */
function computeWeightedScore(resumeScore, mcqScore, codingScore) {
  return (
    resumeScore * WEIGHTS.resume +
    mcqScore * WEIGHTS.mcq +
    codingScore * WEIGHTS.coding
  );
}

/**
 * Compute and save skill scores for a student.
 * Fetches MCQ results, coding results, and resume skills, then upserts skill_scores.
 * @param {string} studentId - UUID of the student
 * @param {Array|null} mcqSkillBreakdown - Optional precomputed MCQ breakdown [{skill_tag, total, correct, percent}]
 */
export async function computeAllSkillScores(studentId, mcqSkillBreakdown = null) {
  // 1. Get confirmed & extracted resume skills
  let resumeSkillNames = new Set();
  try {
    const { data: resumeSkills } = await supabase
      .from('resume_skills')
      .select('skill_name')
      .eq('student_id', studentId);
    if (resumeSkills && resumeSkills.length > 0) {
      resumeSkillNames = new Set(resumeSkills.map(s => s.skill_name.toLowerCase()));
    }
  } catch (err) {}

  if (!resumeSkillNames.size) {
    try {
      const stored = localStorage.getItem(`local_skills_${studentId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          resumeSkillNames = new Set(parsed.map(s => s.skill_name.toLowerCase()));
        }
      }
    } catch (e) {}
  }

  // 2. Get MCQ skill-wise performance
  const mcqBySkill = {};

  if (mcqSkillBreakdown && mcqSkillBreakdown.length > 0) {
    mcqSkillBreakdown.forEach(item => {
      const key = (item.skill_tag || 'General').toLowerCase();
      mcqBySkill[key] = {
        total: item.total,
        correct: item.correct,
        percent: item.percent !== undefined ? item.percent : Math.round((item.correct / item.total) * 100)
      };
    });
  } else {
    try {
      const { data: assessment } = await supabase
        .from('assessments')
        .select('id')
        .eq('student_id', studentId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (assessment) {
        const { data: answers } = await supabase
          .from('student_answers')
          .select(`
            is_correct,
            assessment_questions (
              questions ( skill_tag )
            )
          `)
          .eq('assessment_id', assessment.id);

        if (answers && answers.length > 0) {
          for (const ans of answers) {
            const tag = ans.assessment_questions?.questions?.skill_tag;
            if (!tag) continue;
            const key = tag.toLowerCase();
            if (!mcqBySkill[key]) mcqBySkill[key] = { total: 0, correct: 0, percent: 0 };
            mcqBySkill[key].total++;
            if (ans.is_correct) mcqBySkill[key].correct++;
            mcqBySkill[key].percent = Math.round((mcqBySkill[key].correct / mcqBySkill[key].total) * 100);
          }
        }
      }
    } catch (err) {
      console.warn('[skillScoringService] DB assessment fetch notice:', err.message);
    }
  }

  // 3. Get coding submission scores per skill
  const codingBySkill = {};
  try {
    const { data: codingSubmissions } = await supabase
      .from('coding_submissions')
      .select(`
        score_percent,
        coding_questions ( skill_tag )
      `)
      .eq('student_id', studentId);

    if (codingSubmissions) {
      for (const sub of codingSubmissions) {
        const tag = sub.coding_questions?.skill_tag?.toLowerCase();
        if (!tag) continue;
        if (!codingBySkill[tag]) codingBySkill[tag] = { total: 0, sum: 0 };
        codingBySkill[tag].total++;
        codingBySkill[tag].sum += sub.score_percent || 0;
      }
    }
  } catch (err) {
    console.warn('[skillScoringService] DB coding fetch notice:', err.message);
  }

  // 4. Build score rows for all skills
  const allSkills = new Set([
    ...resumeSkillNames,
    ...Object.keys(mcqBySkill),
    ...Object.keys(codingBySkill)
  ]);

  const scoreRows = [];
  for (const skill of allSkills) {
    const resumeScore = resumeSkillNames.has(skill) ? 100 : 0;
    const mcqData = mcqBySkill[skill];
    const mcqScore = mcqData ? mcqData.percent : 0;
    const codingData = codingBySkill[skill];
    const codingScore = codingData && codingData.total > 0 ? Math.round(codingData.sum / codingData.total) : 0;

    const finalScore = computeWeightedScore(resumeScore, mcqScore, codingScore);

    scoreRows.push({
      student_id: studentId,
      skill_name: skill.charAt(0).toUpperCase() + skill.slice(1),
      resume_score: resumeScore,
      mcq_score: mcqScore,
      coding_score: codingScore,
      final_score: Math.round(finalScore * 100) / 100,
      computed_at: new Date().toISOString()
    });
  }

  // 5. Upsert all scores to Supabase DB and local cache
  if (scoreRows.length) {
    try {
      await supabase
        .from('skill_scores')
        .upsert(scoreRows, { onConflict: 'student_id,skill_name' });
    } catch (err) {
      console.warn('[skillScoringService] DB upsert notice:', err.message);
    }

    try {
      localStorage.setItem(`local_scores_${studentId}`, JSON.stringify(scoreRows));
    } catch (e) {}
  }

  return scoreRows;
}

/**
 * Get all skill scores for a student.
 */
export async function getSkillScores(studentId) {
  try {
    const { data, error } = await supabase
      .from('skill_scores')
      .select('*')
      .eq('student_id', studentId)
      .order('final_score', { ascending: false });
    if (!error && data && data.length > 0) return data;
  } catch (err) {}

  try {
    const stored = localStorage.getItem(`local_scores_${studentId}`);
    if (stored) return JSON.parse(stored);
  } catch (e) {}

  return [];
}

/**
 * Get overall skill strength (average of all final_scores).
 */
export async function getOverallStrength(studentId) {
  const scores = await getSkillScores(studentId);
  if (!scores.length) return 0;
  const avg = scores.reduce((s, r) => s + r.final_score, 0) / scores.length;
  return Math.round(avg);
}
