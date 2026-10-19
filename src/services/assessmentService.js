import { supabase, isSupabaseAvailable, markSupabaseOffline } from '../lib/supabase';

const QUESTIONS_PER_SKILL = 5;

// Comprehensive question bank for common technical skills
const DEFAULT_FALLBACK_QUESTIONS = [
  // Java
  { id: 'q-fall-1',  skill_tag: 'Java',            question_text: 'Which keyword is used to prevent a class from being subclassed in Java?',            option_a: 'static',   option_b: 'abstract', option_c: 'final',      option_d: 'private',    correct_option: 'C', difficulty: 'easy' },
  { id: 'q-fall-7',  skill_tag: 'Java',             question_text: 'What is the output of System.out.println(10 / 3) in Java?',                          option_a: '3.33',     option_b: '3',        option_c: '4',          option_d: 'Error',      correct_option: 'B', difficulty: 'easy' },
  { id: 'q-fall-14', skill_tag: 'Java',             question_text: 'Which collection class allows duplicate elements and maintains insertion order?',     option_a: 'HashSet',  option_b: 'TreeSet',  option_c: 'ArrayList',  option_d: 'LinkedHashSet', correct_option: 'C', difficulty: 'medium' },
  { id: 'q-fall-21', skill_tag: 'Java',             question_text: 'Which interface in Java is implemented to make an object thread-executable?',          option_a: 'Comparable', option_b: 'Runnable', option_c: 'Serializable', option_d: 'Cloneable', correct_option: 'B', difficulty: 'easy' },

  // Python
  { id: 'q-fall-2',  skill_tag: 'Python',           question_text: 'Which of the following is a mutable data type in Python?',                           option_a: 'tuple',    option_b: 'string',   option_c: 'list',       option_d: 'int',        correct_option: 'C', difficulty: 'easy' },
  { id: 'q-fall-8',  skill_tag: 'Python',           question_text: 'Which keyword is used to define a generator function in Python?',                     option_a: 'return',   option_b: 'yield',    option_c: 'async',      option_d: 'generate',   correct_option: 'B', difficulty: 'easy' },
  { id: 'q-fall-15', skill_tag: 'Python',           question_text: 'What does the __init__ method do in a Python class?',                                 option_a: 'Destroys object', option_b: 'Initializes new object instance', option_c: 'Copies object', option_d: 'Imports module', correct_option: 'B', difficulty: 'easy' },
  { id: 'q-fall-22', skill_tag: 'Python',           question_text: 'What is the time complexity of dictionary key lookup in Python on average?',           option_a: 'O(n)',     option_b: 'O(log n)', option_c: 'O(1)',       option_d: 'O(n²)',      correct_option: 'C', difficulty: 'easy' },

  // SQL & Databases
  { id: 'q-fall-3',  skill_tag: 'SQL',              question_text: 'Which SQL statement is used to retrieve data from a database?',                       option_a: 'INSERT',   option_b: 'SELECT',   option_c: 'UPDATE',     option_d: 'DELETE',     correct_option: 'B', difficulty: 'easy' },
  { id: 'q-fall-9',  skill_tag: 'SQL',              question_text: 'Which SQL keyword removes duplicate rows from results?',                               option_a: 'UNIQUE',   option_b: 'DISTINCT', option_c: 'GROUP BY',   option_d: 'HAVING',     correct_option: 'B', difficulty: 'easy' },
  { id: 'q-fall-16', skill_tag: 'SQL',              question_text: 'What does a LEFT JOIN return?',                                                        option_a: 'Only matching rows', option_b: 'All rows from right table', option_c: 'All rows from left table with matching right rows', option_d: 'All rows from both tables', correct_option: 'C', difficulty: 'medium' },
  { id: 'q-fall-23', skill_tag: 'SQL',              question_text: 'Which clause is used to filter groups created by GROUP BY in SQL?',                   option_a: 'WHERE',    option_b: 'HAVING',   option_c: 'ORDER BY',   option_d: 'LIMIT',      correct_option: 'B', difficulty: 'medium' },

  // React & Frontend
  { id: 'q-fall-4',  skill_tag: 'React',            question_text: 'Which hook is used to manage state in a functional component?',                       option_a: 'useEffect',option_b: 'useRef',   option_c: 'useState',   option_d: 'useContext', correct_option: 'C', difficulty: 'easy' },
  { id: 'q-fall-10', skill_tag: 'React',            question_text: 'What is the Virtual DOM in React?',                                                   option_a: 'A copy of the real DOM', option_b: 'A lightweight JS representation of the real DOM', option_c: 'Server rendering', option_d: 'State database', correct_option: 'B', difficulty: 'easy' },
  { id: 'q-fall-17', skill_tag: 'React',            question_text: 'What does useEffect hook do in React?',                                               option_a: 'Manages state', option_b: 'Handles side effects after rendering', option_c: 'Creates context', option_d: 'Memoizes values', correct_option: 'B', difficulty: 'medium' },
  { id: 'q-fall-24', skill_tag: 'React',            question_text: 'Which prop is required when rendering dynamic lists in React for reconciliation?',     option_a: 'id',       option_b: 'key',      option_c: 'index',      option_d: 'ref',        correct_option: 'B', difficulty: 'easy' },

  // JavaScript & TypeScript
  { id: 'q-fall-6',  skill_tag: 'JavaScript',       question_text: 'What is the output of typeof null in JavaScript?',                                    option_a: '"null"',   option_b: '"undefined"', option_c: '"object"', option_d: '"NaN"',    correct_option: 'C', difficulty: 'easy' },
  { id: 'q-fall-11', skill_tag: 'JavaScript',       question_text: 'Which method is used to add a new element at the end of an array in JavaScript?',    option_a: 'push()',   option_b: 'pop()',    option_c: 'shift()',    option_d: 'unshift()',  correct_option: 'A', difficulty: 'easy' },
  { id: 'q-fall-18', skill_tag: 'JavaScript',       question_text: 'What is a Promise in JavaScript used for?',                                           option_a: 'Loops',    option_b: 'Synchronous code', option_c: 'Handling asynchronous operations', option_d: 'Defining classes', correct_option: 'C', difficulty: 'medium' },
  { id: 'q-fall-25', skill_tag: 'JavaScript',       question_text: 'Which keyword creates a block-scoped variable that cannot be reassigned?',            option_a: 'var',      option_b: 'let',      option_c: 'const',      option_d: 'static',     correct_option: 'C', difficulty: 'easy' },

  // Data Structures & Algorithms
  { id: 'q-fall-5',  skill_tag: 'Data Structures',  question_text: 'Which data structure operates on LIFO (Last In, First Out) principle?',              option_a: 'Queue',    option_b: 'Stack',    option_c: 'Linked List',option_d: 'Array',      correct_option: 'B', difficulty: 'easy' },
  { id: 'q-fall-13', skill_tag: 'Data Structures',  question_text: 'What is the time complexity of binary search on a sorted array?',                     option_a: 'O(n)',     option_b: 'O(n²)',    option_c: 'O(log n)',   option_d: 'O(1)',       correct_option: 'C', difficulty: 'medium' },
  { id: 'q-fall-20', skill_tag: 'Data Structures',  question_text: 'Which tree traversal visits the root first, then left, then right?',                 option_a: 'Inorder',  option_b: 'Postorder', option_c: 'Levelorder', option_d: 'Preorder',   correct_option: 'D', difficulty: 'medium' },
  { id: 'q-fall-26', skill_tag: 'Data Structures',  question_text: 'What is the worst-case time complexity of QuickSort?',                                option_a: 'O(n log n)', option_b: 'O(n)',   option_c: 'O(n²)',      option_d: 'O(log n)',   correct_option: 'C', difficulty: 'medium' },

  // C++ & Systems
  { id: 'q-fall-12', skill_tag: 'C++',              question_text: 'Which operator is used for dynamic memory allocation in C++?',                        option_a: 'malloc',   option_b: 'new',      option_c: 'alloc',      option_d: 'create',     correct_option: 'B', difficulty: 'easy' },
  { id: 'q-fall-19', skill_tag: 'C++',              question_text: 'What is a destructor in C++?',                                                        option_a: 'Creates objects', option_b: 'Cleans up resources when object goes out of scope', option_c: 'Static method', option_d: 'Pure virtual func', correct_option: 'B', difficulty: 'medium' },

  // Git & DevOps & Tools
  { id: 'q-fall-27', skill_tag: 'Git',              question_text: 'Which Git command is used to combine changes from one branch into another?',          option_a: 'git push', option_b: 'git merge',option_c: 'git fetch',  option_d: 'git clone',  correct_option: 'B', difficulty: 'easy' },
  { id: 'q-fall-28', skill_tag: 'Node.js',          question_text: 'Which core module in Node.js is used to handle file system operations?',             option_a: 'http',     option_b: 'fs',       option_c: 'path',       option_d: 'os',         correct_option: 'B', difficulty: 'easy' }
];

/**
 * Generate a personalized assessment based on the student's confirmed resume skills.
 * Generates instantly in memory if cloud database is offline.
 */
export async function generateAssessment(studentId, providedSkills = []) {
  // 1. Collect skills from all available local & provided sources (instant)
  let skillNames = [];

  // A. From providedSkills argument
  if (Array.isArray(providedSkills) && providedSkills.length > 0) {
    skillNames = providedSkills.map(s => typeof s === 'string' ? s : s?.skill_name).filter(Boolean);
  }

  // B. From local storage skills
  if (!skillNames.length) {
    try {
      const stored = localStorage.getItem(`local_skills_${studentId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          skillNames = parsed.map(s => s.skill_name).filter(Boolean);
        }
      }
    } catch (e) {}
  }

  // C. From student profile
  if (!skillNames.length) {
    try {
      const storedProfile = localStorage.getItem('local_auth_profile');
      if (storedProfile) {
        const p = JSON.parse(storedProfile);
        if (p?.skills && Array.isArray(p.skills) && p.skills.length > 0) {
          skillNames = p.skills;
        }
      }
    } catch (e) {}
  }

  // D. Fallback default skills so user is never blocked
  if (!skillNames.length) {
    skillNames = ['Java', 'Python', 'SQL', 'Data Structures', 'React', 'JavaScript'];
  }

  // 2. Fast local path if Supabase is offline
  if (!isSupabaseAvailable()) {
    return {
      id: `assess-${Date.now()}`,
      student_id: studentId,
      status: 'in_progress',
      total_questions: 10,
      skills: skillNames,
      created_at: new Date().toISOString()
    };
  }

  // 3. Online path with strict timeout protection
  try {
    const { data: existing } = await supabase
      .from('assessments')
      .select('*')
      .eq('student_id', studentId)
      .in('status', ['pending', 'in_progress'])
      .limit(1)
      .maybeSingle();

    if (existing) return existing;

    const { data: assessment, error } = await supabase
      .from('assessments')
      .insert({ student_id: studentId, status: 'in_progress', total_questions: 10 })
      .select()
      .single();

    if (!error && assessment) return assessment;
  } catch (err) {
    markSupabaseOffline();
  }

  // Fallback instant assessment
  return {
    id: `assess-${Date.now()}`,
    student_id: studentId,
    status: 'in_progress',
    total_questions: 10,
    skills: skillNames,
    created_at: new Date().toISOString()
  };
}

/**
 * Fetch the full assessment with all questions.
 * Returns in milliseconds by matching student skills against the question bank.
 */
export async function getAssessmentWithQuestions(assessmentId, studentSkills = []) {
  // If offline or local assessment ID, filter in-memory instantly (0ms)
  const isLocal = String(assessmentId).startsWith('assess-') || !isSupabaseAvailable();

  if (!isLocal) {
    try {
      const { data, error } = await supabase
        .from('assessment_questions')
        .select(`
          id,
          order_index,
          questions (
            id, skill_tag, question_text,
            option_a, option_b, option_c, option_d,
            correct_option, difficulty
          )
        `)
        .eq('assessment_id', assessmentId)
        .order('order_index');

      if (!error && data?.length) {
        const valid = data.filter(item => item.questions !== null);
        if (valid.length > 0) return valid;
      }
    } catch (err) {
      markSupabaseOffline();
    }
  }

  // Fast in-memory skill matching
  const normalizedSkills = (studentSkills || [])
    .map(s => typeof s === 'string' ? s.trim().toLowerCase() : s?.skill_name?.trim().toLowerCase())
    .filter(Boolean);

  let matchedQuestions = [];

  if (normalizedSkills.length > 0) {
    // 1. Find questions specifically tagged with student's skills
    matchedQuestions = DEFAULT_FALLBACK_QUESTIONS.filter(q => {
      const tag = (q.skill_tag || '').toLowerCase();
      return normalizedSkills.some(skill => tag.includes(skill) || skill.includes(tag));
    });
  }

  // 2. If fewer than 10 questions matched, pad with general core placement questions
  if (matchedQuestions.length < 10) {
    const matchedIds = new Set(matchedQuestions.map(q => q.id));
    for (const q of DEFAULT_FALLBACK_QUESTIONS) {
      if (!matchedIds.has(q.id)) {
        matchedQuestions.push(q);
        matchedIds.add(q.id);
      }
      if (matchedQuestions.length >= 10) break;
    }
  }

  // Limit to 10 questions for a snappy, optimal test experience
  const finalQuestions = matchedQuestions.slice(0, 10);

  // Normalize shape: { id, order_index, questions: {...} }
  return finalQuestions.map((q, idx) => ({
    id: `aq-fall-${idx}`,
    order_index: idx,
    questions: {
      id: q.id,
      skill_tag: q.skill_tag,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
      difficulty: q.difficulty
    }
  }));
}

/**
 * Start an assessment (update status to in_progress).
 */
export async function startAssessment(assessmentId) {
  if (String(assessmentId).startsWith('assess-') || !isSupabaseAvailable()) {
    return { id: assessmentId, status: 'in_progress', started_at: new Date().toISOString() };
  }
  try {
    const { data, error } = await supabase
      .from('assessments')
      .update({ status: 'in_progress', started_at: new Date().toISOString() })
      .eq('id', assessmentId)
      .select()
      .maybeSingle();
    if (error) {
      markSupabaseOffline();
      return { id: assessmentId, status: 'in_progress' };
    }
    return data;
  } catch (e) {
    markSupabaseOffline();
    return { id: assessmentId, status: 'in_progress' };
  }
}

/**
 * Submit a single answer (fast instant response).
 */
export async function submitAnswer(assessmentId, assessmentQuestionId, studentId, selectedOption, correctOption) {
  const isCorrect = selectedOption === correctOption;
  const isFallback = String(assessmentQuestionId).startsWith('aq-fall-') || String(assessmentId).startsWith('assess-') || !isSupabaseAvailable();

  if (!isFallback) {
    try {
      await supabase
        .from('student_answers')
        .upsert({
          assessment_id: assessmentId,
          assessment_question_id: assessmentQuestionId,
          student_id: studentId,
          selected_option: selectedOption,
          is_correct: isCorrect
        }, { onConflict: 'assessment_question_id,student_id' });
    } catch (err) {
      markSupabaseOffline();
    }
  }

  return { is_correct: isCorrect };
}

/**
 * Finish an assessment — compute final score instantly.
 */
export async function finishAssessment(assessmentId, studentId, computedData = null) {
  const correct = computedData?.correct_answers ?? 0;
  const total = computedData?.total_questions || 10;
  const scorePercent = computedData?.score_percent ?? (total > 0 ? Math.round((correct / total) * 100) : 0);

  const isFallback = String(assessmentId).startsWith('assess-') || !isSupabaseAvailable();
  if (!isFallback) {
    try {
      const { data } = await supabase
        .from('assessments')
        .update({
          status: 'completed',
          correct_answers: correct,
          total_questions: total,
          score_percent: scorePercent,
          completed_at: new Date().toISOString()
        })
        .eq('id', assessmentId)
        .select()
        .maybeSingle();
      if (data) return data;
    } catch (err) {
      markSupabaseOffline();
    }
  }

  return {
    id: assessmentId,
    status: 'completed',
    total_questions: total,
    correct_answers: correct,
    score_percent: scorePercent
  };
}

/**
 * Get the latest completed assessment for a student.
 */
export async function getLatestAssessment(studentId) {
  if (!isSupabaseAvailable()) return null;
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return data;
  } catch (err) {
    return null;
  }
}

/**
 * Get skill-wise performance for a completed assessment.
 */
export async function getSkillWiseResults(assessmentId) {
  if (!isSupabaseAvailable()) return [];
  try {
    const { data, error } = await supabase
      .from('student_answers')
      .select(`
        is_correct,
        assessment_questions (
          questions ( skill_tag )
        )
      `)
      .eq('assessment_id', assessmentId);

    if (!error && data?.length) {
      const skillMap = {};
      for (const ans of data) {
        const tag = ans.assessment_questions?.questions?.skill_tag || 'General';
        if (!skillMap[tag]) skillMap[tag] = { total: 0, correct: 0 };
        skillMap[tag].total++;
        if (ans.is_correct) skillMap[tag].correct++;
      }

      return Object.entries(skillMap).map(([skill_tag, v]) => ({
        skill_tag,
        total: v.total,
        correct: v.correct,
        percent: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0
      }));
    }
  } catch (err) {
    console.warn('[assessmentService] getSkillWiseResults notice:', err.message);
  }

  return [];
}
