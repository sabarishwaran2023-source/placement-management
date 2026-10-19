-- ============================================================
-- CAMPUS PLACEMENT PLATFORM — INITIAL DATABASE SCHEMA (FIXED)
-- Run this in Supabase SQL Editor → New Query → Run All
-- Safe to run multiple times — drops and recreates everything
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- STEP 1: DROP ALL TABLES (clean slate)
-- ────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.placements           CASCADE;
DROP TABLE IF EXISTS public.notifications        CASCADE;
DROP TABLE IF EXISTS public.interviews           CASCADE;
DROP TABLE IF EXISTS public.applications         CASCADE;
DROP TABLE IF EXISTS public.skill_scores         CASCADE;
DROP TABLE IF EXISTS public.coding_submissions   CASCADE;
DROP TABLE IF EXISTS public.coding_questions     CASCADE;
DROP TABLE IF EXISTS public.student_answers      CASCADE;
DROP TABLE IF EXISTS public.assessment_questions CASCADE;
DROP TABLE IF EXISTS public.assessments          CASCADE;
DROP TABLE IF EXISTS public.questions            CASCADE;
DROP TABLE IF EXISTS public.resume_skills        CASCADE;
DROP TABLE IF EXISTS public.resumes              CASCADE;
DROP TABLE IF EXISTS public.job_skills           CASCADE;
DROP TABLE IF EXISTS public.jobs                 CASCADE;
DROP TABLE IF EXISTS public.companies            CASCADE;
DROP TABLE IF EXISTS public.profiles             CASCADE;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role()     CASCADE;

-- ────────────────────────────────────────────────────────────
-- STEP 2: CREATE TABLES
-- ────────────────────────────────────────────────────────────

-- 1. PROFILES
CREATE TABLE public.profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role              TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'company', 'admin')),
  name              TEXT,
  email             TEXT UNIQUE,
  phone             TEXT,
  department        TEXT,
  degree            TEXT DEFAULT 'B.Tech',
  cgpa              NUMERIC(3,2) CHECK (cgpa >= 0 AND cgpa <= 10),
  graduation_year   INT,
  register_number   TEXT,
  backlogs          INT DEFAULT 0,
  profile_photo_url TEXT,
  linkedin_url      TEXT,
  github_url        TEXT,
  skills            TEXT[],
  bio               TEXT,
  company_name      TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COMPANIES
CREATE TABLE public.companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  website     TEXT,
  industry    TEXT,
  location    TEXT,
  description TEXT,
  hr_contact  TEXT,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. JOBS
CREATE TABLE public.jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  location        TEXT,
  salary          TEXT,
  job_type        TEXT DEFAULT 'Full-Time' CHECK (job_type IN ('Full-Time','Part-Time','Internship','Contract')),
  department      TEXT,
  min_cgpa        NUMERIC(3,2) DEFAULT 6.0,
  graduation_year INT,
  max_backlogs    INT DEFAULT 0,
  deadline        DATE,
  status          TEXT DEFAULT 'Active' CHECK (status IN ('Active','Closed','Draft')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. JOB SKILLS
CREATE TABLE public.job_skills (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  skill_name  TEXT NOT NULL,
  importance  TEXT DEFAULT 'required' CHECK (importance IN ('required','preferred'))
);

-- 5. RESUMES
CREATE TABLE public.resumes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path    TEXT NOT NULL,
  public_url      TEXT,
  filename        TEXT,
  file_size_kb    INT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','analyzed','failed')),
  raw_text        TEXT,
  uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RESUME SKILLS
CREATE TABLE public.resume_skills (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id   UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_name  TEXT NOT NULL,
  category    TEXT,
  confirmed   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 7. QUESTIONS (MCQ bank)
CREATE TABLE public.questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_tag       TEXT NOT NULL,
  question_text   TEXT NOT NULL,
  option_a        TEXT NOT NULL,
  option_b        TEXT NOT NULL,
  option_c        TEXT NOT NULL,
  option_d        TEXT NOT NULL,
  correct_option  TEXT NOT NULL CHECK (correct_option IN ('A','B','C','D')),
  difficulty      TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  explanation     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ASSESSMENTS
CREATE TABLE public.assessments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  total_questions INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  score_percent   NUMERIC(5,2),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ASSESSMENT QUESTIONS
CREATE TABLE public.assessment_questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_id   UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  order_index   INT DEFAULT 0
);

-- 10. STUDENT ANSWERS
CREATE TABLE public.student_answers (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id          UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  assessment_question_id UUID NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  student_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  selected_option        TEXT CHECK (selected_option IN ('A','B','C','D')),
  is_correct             BOOLEAN,
  answered_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 11. CODING QUESTIONS
CREATE TABLE public.coding_questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_tag       TEXT NOT NULL,
  title           TEXT NOT NULL,
  problem_text    TEXT NOT NULL,
  input_format    TEXT,
  output_format   TEXT,
  sample_input    TEXT,
  sample_output   TEXT,
  test_cases      JSONB,
  difficulty      TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  time_limit_sec  INT DEFAULT 5,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 12. CODING SUBMISSIONS
CREATE TABLE public.coding_submissions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coding_question_id  UUID NOT NULL REFERENCES public.coding_questions(id) ON DELETE CASCADE,
  language            TEXT NOT NULL,
  code                TEXT NOT NULL,
  test_cases_total    INT DEFAULT 0,
  test_cases_passed   INT DEFAULT 0,
  score_percent       NUMERIC(5,2),
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending','running','accepted','wrong_answer','error')),
  submitted_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, coding_question_id)
);

-- 13. SKILL SCORES
CREATE TABLE public.skill_scores (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_name   TEXT NOT NULL,
  resume_score NUMERIC(5,2) DEFAULT 0,
  mcq_score    NUMERIC(5,2) DEFAULT 0,
  coding_score NUMERIC(5,2) DEFAULT 0,
  final_score  NUMERIC(5,2) DEFAULT 0,
  computed_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, skill_name)
);

-- 14. APPLICATIONS
CREATE TABLE public.applications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id      UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  match_score NUMERIC(5,2),
  status      TEXT DEFAULT 'Applied'
                CHECK (status IN ('Applied','Under Review','Shortlisted','Interview Scheduled','Selected','Rejected','Withdrawn')),
  cover_note  TEXT,
  applied_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, job_id)
);

-- 15. INTERVIEWS
CREATE TABLE public.interviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  round_name      TEXT DEFAULT 'Technical Round',
  interview_date  DATE,
  interview_time  TIME,
  mode            TEXT DEFAULT 'Online' CHECK (mode IN ('Online','Offline','Hybrid')),
  meeting_link    TEXT,
  venue           TEXT,
  notes           TEXT,
  result          TEXT CHECK (result IN ('Pending','Selected','Rejected','Rescheduled')),
  scheduled_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 16. NOTIFICATIONS
CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT,
  is_read    BOOLEAN DEFAULT FALSE,
  meta       JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. PLACEMENTS
CREATE TABLE public.placements (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id       UUID REFERENCES public.companies(id),
  job_id           UUID REFERENCES public.jobs(id),
  application_id   UUID REFERENCES public.applications(id),
  package_lpa      NUMERIC(6,2),
  joining_date     DATE,
  offer_letter_url TEXT,
  placed_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- STEP 3: INDEXES
-- ────────────────────────────────────────────────────────────
CREATE INDEX idx_profiles_role         ON public.profiles(role);
CREATE INDEX idx_jobs_status           ON public.jobs(status);
CREATE INDEX idx_jobs_company          ON public.jobs(company_id);
CREATE INDEX idx_applications_student  ON public.applications(student_id);
CREATE INDEX idx_applications_job      ON public.applications(job_id);
CREATE INDEX idx_skill_scores_student  ON public.skill_scores(student_id);
CREATE INDEX idx_resume_skills_student ON public.resume_skills(student_id);
CREATE INDEX idx_notifications_user    ON public.notifications(user_id, is_read);

-- ────────────────────────────────────────────────────────────
-- STEP 4: AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- STEP 5: HELPER FUNCTION (SECURITY DEFINER — no recursion)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ────────────────────────────────────────────────────────────
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_skills           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_skills        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_questions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_submissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_scores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placements           ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- STEP 7: RLS POLICIES
-- ────────────────────────────────────────────────────────────

-- PROFILES
CREATE POLICY "profiles_own_select"    ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_own_insert"    ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_own_update"    ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_admin_all"     ON public.profiles FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "profiles_company_view"  ON public.profiles FOR SELECT USING (public.get_my_role() = 'company' AND role = 'student');

-- COMPANIES
CREATE POLICY "companies_read_all"     ON public.companies FOR SELECT USING (true);
CREATE POLICY "companies_own_write"    ON public.companies FOR ALL   USING (profile_id = auth.uid());
CREATE POLICY "companies_admin"        ON public.companies FOR ALL   USING (public.get_my_role() = 'admin');

-- JOBS
CREATE POLICY "jobs_active_read"       ON public.jobs FOR SELECT USING (status = 'Active' OR public.get_my_role() IN ('admin','company'));
CREATE POLICY "jobs_company_write"     ON public.jobs FOR ALL USING (
  company_id IN (SELECT id FROM public.companies WHERE profile_id = auth.uid())
);
CREATE POLICY "jobs_admin"             ON public.jobs FOR ALL USING (public.get_my_role() = 'admin');

-- JOB SKILLS
CREATE POLICY "job_skills_read"        ON public.job_skills FOR SELECT USING (true);
CREATE POLICY "job_skills_write"       ON public.job_skills FOR ALL USING (
  job_id IN (SELECT j.id FROM public.jobs j JOIN public.companies c ON j.company_id = c.id WHERE c.profile_id = auth.uid())
);
CREATE POLICY "job_skills_admin"       ON public.job_skills FOR ALL USING (public.get_my_role() = 'admin');

-- RESUMES
CREATE POLICY "resumes_own"            ON public.resumes FOR ALL USING (student_id = auth.uid());
CREATE POLICY "resumes_admin"          ON public.resumes FOR SELECT USING (public.get_my_role() = 'admin');

-- RESUME SKILLS
CREATE POLICY "resume_skills_own"      ON public.resume_skills FOR ALL USING (student_id = auth.uid());
CREATE POLICY "resume_skills_admin"    ON public.resume_skills FOR SELECT USING (public.get_my_role() = 'admin');

-- QUESTIONS
CREATE POLICY "questions_auth_read"    ON public.questions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "questions_admin"        ON public.questions FOR ALL USING (public.get_my_role() = 'admin');

-- ASSESSMENTS
CREATE POLICY "assessments_own"        ON public.assessments FOR ALL USING (student_id = auth.uid());
CREATE POLICY "assessments_admin"      ON public.assessments FOR SELECT USING (public.get_my_role() = 'admin');

-- ASSESSMENT QUESTIONS
CREATE POLICY "aq_own"                 ON public.assessment_questions FOR SELECT USING (
  assessment_id IN (SELECT id FROM public.assessments WHERE student_id = auth.uid())
);
CREATE POLICY "aq_admin"               ON public.assessment_questions FOR ALL USING (public.get_my_role() = 'admin');

-- STUDENT ANSWERS
CREATE POLICY "answers_own"            ON public.student_answers FOR ALL USING (student_id = auth.uid());
CREATE POLICY "answers_admin"          ON public.student_answers FOR SELECT USING (public.get_my_role() = 'admin');

-- CODING QUESTIONS
CREATE POLICY "coding_q_read"          ON public.coding_questions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "coding_q_admin"         ON public.coding_questions FOR ALL USING (public.get_my_role() = 'admin');

-- CODING SUBMISSIONS
CREATE POLICY "coding_sub_own"         ON public.coding_submissions FOR ALL USING (student_id = auth.uid());
CREATE POLICY "coding_sub_admin"       ON public.coding_submissions FOR SELECT USING (public.get_my_role() = 'admin');

-- SKILL SCORES
CREATE POLICY "skill_scores_own"       ON public.skill_scores FOR ALL USING (student_id = auth.uid());
CREATE POLICY "skill_scores_company"   ON public.skill_scores FOR SELECT USING (public.get_my_role() IN ('company','admin'));

-- APPLICATIONS
CREATE POLICY "apps_student_own"       ON public.applications FOR ALL USING (student_id = auth.uid());
CREATE POLICY "apps_company_read"      ON public.applications FOR SELECT USING (
  job_id IN (SELECT j.id FROM public.jobs j JOIN public.companies c ON j.company_id = c.id WHERE c.profile_id = auth.uid())
);
CREATE POLICY "apps_company_update"    ON public.applications FOR UPDATE USING (
  job_id IN (SELECT j.id FROM public.jobs j JOIN public.companies c ON j.company_id = c.id WHERE c.profile_id = auth.uid())
);
CREATE POLICY "apps_admin"             ON public.applications FOR ALL USING (public.get_my_role() = 'admin');

-- INTERVIEWS
CREATE POLICY "interviews_student"     ON public.interviews FOR SELECT USING (
  application_id IN (SELECT id FROM public.applications WHERE student_id = auth.uid())
);
CREATE POLICY "interviews_company"     ON public.interviews FOR ALL USING (
  application_id IN (
    SELECT a.id FROM public.applications a
    JOIN public.jobs j ON a.job_id = j.id
    JOIN public.companies c ON j.company_id = c.id
    WHERE c.profile_id = auth.uid()
  )
);
CREATE POLICY "interviews_admin"       ON public.interviews FOR ALL USING (public.get_my_role() = 'admin');

-- NOTIFICATIONS
CREATE POLICY "notifications_own"      ON public.notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "notifications_admin"    ON public.notifications FOR ALL USING (public.get_my_role() = 'admin');

-- PLACEMENTS
CREATE POLICY "placements_own"         ON public.placements FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "placements_admin"       ON public.placements FOR ALL USING (public.get_my_role() = 'admin');
