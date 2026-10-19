-- ============================================================
-- MIGRATION 007: FINAL SCHEMA PATCH
-- Fixes all RLS gaps, constraint issues, and policy problems.
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. FIX applications.status CHECK constraint
-- Add 'Interview Scheduled' which was missing
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check
  CHECK (status IN (
    'Applied',
    'Under Review',
    'Shortlisted',
    'Interview Scheduled',
    'Selected',
    'Rejected',
    'Withdrawn'
  ));

-- ──────────────────────────────────────────────────────────────
-- 2. FIX profiles — ensure backlogs default is 0 not NULL
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ALTER COLUMN backlogs SET DEFAULT 0;

UPDATE public.profiles SET backlogs = 0 WHERE backlogs IS NULL;

-- ──────────────────────────────────────────────────────────────
-- 3. FIX RLS — Admin can read ALL profiles (bypass normal RLS)
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_admin_all"    ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;

CREATE POLICY "profiles_admin_all"
  ON public.profiles FOR ALL
  USING (public.get_my_role() = 'admin');

-- ──────────────────────────────────────────────────────────────
-- 4. FIX RLS — Admin can read ALL applications
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "apps_admin" ON public.applications;
CREATE POLICY "apps_admin"
  ON public.applications FOR ALL
  USING (public.get_my_role() = 'admin');

-- ──────────────────────────────────────────────────────────────
-- 5. FIX RLS — Admin can read ALL interviews
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "interviews_admin" ON public.interviews;
CREATE POLICY "interviews_admin"
  ON public.interviews FOR ALL
  USING (public.get_my_role() = 'admin');

-- ──────────────────────────────────────────────────────────────
-- 6. FIX RLS — Notifications: ANY authenticated user can insert
-- (students insert their own on actions like applying)
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "notifications_own"            ON public.notifications;
DROP POLICY IF EXISTS "notifications_admin"          ON public.notifications;
DROP POLICY IF EXISTS "notifications_company_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_own_update"     ON public.notifications;

-- Read own
CREATE POLICY "notifications_own_select"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

-- Insert: any authenticated user can create a notification for any user
-- (e.g. student creates notification for themselves, company notifies student)
CREATE POLICY "notifications_any_insert"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Update own (mark as read)
CREATE POLICY "notifications_own_update"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Admin full access
CREATE POLICY "notifications_admin_all"
  ON public.notifications FOR ALL
  USING (public.get_my_role() = 'admin');

-- ──────────────────────────────────────────────────────────────
-- 7. FIX RLS — assessment_questions: student can INSERT + SELECT
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "aq_own"           ON public.assessment_questions;
DROP POLICY IF EXISTS "aq_admin"         ON public.assessment_questions;
DROP POLICY IF EXISTS "aq_student_insert" ON public.assessment_questions;

CREATE POLICY "aq_student_select"
  ON public.assessment_questions FOR SELECT
  USING (
    assessment_id IN (
      SELECT id FROM public.assessments WHERE student_id = auth.uid()
    )
  );

CREATE POLICY "aq_student_insert"
  ON public.assessment_questions FOR INSERT
  WITH CHECK (
    assessment_id IN (
      SELECT id FROM public.assessments WHERE student_id = auth.uid()
    )
  );

CREATE POLICY "aq_admin_all"
  ON public.assessment_questions FOR ALL
  USING (public.get_my_role() = 'admin');

-- ──────────────────────────────────────────────────────────────
-- 8. FIX RLS — student_answers: fix unique constraint for upsert
-- ──────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'student_answers_unique_answer'
    AND conrelid = 'public.student_answers'::regclass
  ) THEN
    ALTER TABLE public.student_answers
      ADD CONSTRAINT student_answers_unique_answer
      UNIQUE (assessment_id, assessment_question_id, student_id);
  END IF;
END;
$$;

-- ──────────────────────────────────────────────────────────────
-- 9. FIX RLS — placements: admin can insert/update/select
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "placements_own"          ON public.placements;
DROP POLICY IF EXISTS "placements_admin"        ON public.placements;
DROP POLICY IF EXISTS "placements_admin_insert" ON public.placements;

CREATE POLICY "placements_student_select"
  ON public.placements FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "placements_admin_all"
  ON public.placements FOR ALL
  USING (public.get_my_role() = 'admin');

-- ──────────────────────────────────────────────────────────────
-- 10. FIX RLS — companies: read all + company manages own
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "companies_read_all"  ON public.companies;
DROP POLICY IF EXISTS "companies_own_write" ON public.companies;
DROP POLICY IF EXISTS "companies_admin"     ON public.companies;

CREATE POLICY "companies_read_all"
  ON public.companies FOR SELECT
  USING (true);

CREATE POLICY "companies_own_write"
  ON public.companies FOR ALL
  USING (profile_id = auth.uid());

CREATE POLICY "companies_admin_all"
  ON public.companies FOR ALL
  USING (public.get_my_role() = 'admin');

-- ──────────────────────────────────────────────────────────────
-- 11. FIX RLS — jobs: company can read own, admin all, public active
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "jobs_active_read"   ON public.jobs;
DROP POLICY IF EXISTS "jobs_company_write" ON public.jobs;
DROP POLICY IF EXISTS "jobs_admin"         ON public.jobs;

CREATE POLICY "jobs_active_read"
  ON public.jobs FOR SELECT
  USING (
    status = 'Active'
    OR public.get_my_role() IN ('admin', 'company')
    OR company_id IN (
      SELECT id FROM public.companies WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "jobs_company_write"
  ON public.jobs FOR ALL
  USING (
    company_id IN (
      SELECT id FROM public.companies WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "jobs_admin_all"
  ON public.jobs FOR ALL
  USING (public.get_my_role() = 'admin');

-- ──────────────────────────────────────────────────────────────
-- 12. FIX RLS — job_skills: company insert, all select
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "job_skills_read"  ON public.job_skills;
DROP POLICY IF EXISTS "job_skills_write" ON public.job_skills;
DROP POLICY IF EXISTS "job_skills_admin" ON public.job_skills;

CREATE POLICY "job_skills_read_all"
  ON public.job_skills FOR SELECT
  USING (true);

CREATE POLICY "job_skills_company_write"
  ON public.job_skills FOR ALL
  USING (
    job_id IN (
      SELECT j.id FROM public.jobs j
      JOIN public.companies c ON j.company_id = c.id
      WHERE c.profile_id = auth.uid()
    )
  );

CREATE POLICY "job_skills_admin_all"
  ON public.job_skills FOR ALL
  USING (public.get_my_role() = 'admin');

-- ──────────────────────────────────────────────────────────────
-- 13. FIX RLS — interviews: company can insert + update
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "interviews_student" ON public.interviews;
DROP POLICY IF EXISTS "interviews_company" ON public.interviews;

CREATE POLICY "interviews_student_select"
  ON public.interviews FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM public.applications WHERE student_id = auth.uid()
    )
  );

CREATE POLICY "interviews_company_all"
  ON public.interviews FOR ALL
  USING (
    application_id IN (
      SELECT a.id FROM public.applications a
      JOIN public.jobs j ON a.job_id = j.id
      JOIN public.companies c ON j.company_id = c.id
      WHERE c.profile_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────────
-- 14. FIX RLS — apps_student_withdraw (UPDATE own application)
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "apps_student_withdraw" ON public.applications;
CREATE POLICY "apps_student_withdraw"
  ON public.applications FOR UPDATE
  USING (student_id = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- 15. FIX RLS — company can update applicant status
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "apps_company_read"   ON public.applications;
DROP POLICY IF EXISTS "apps_company_update" ON public.applications;

CREATE POLICY "apps_company_read"
  ON public.applications FOR SELECT
  USING (
    job_id IN (
      SELECT j.id FROM public.jobs j
      JOIN public.companies c ON j.company_id = c.id
      WHERE c.profile_id = auth.uid()
    )
  );

CREATE POLICY "apps_company_update"
  ON public.applications FOR UPDATE
  USING (
    job_id IN (
      SELECT j.id FROM public.jobs j
      JOIN public.companies c ON j.company_id = c.id
      WHERE c.profile_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────────
-- 16. FIX RLS — skill_scores: company/admin can view student scores
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "skill_scores_own"     ON public.skill_scores;
DROP POLICY IF EXISTS "skill_scores_company" ON public.skill_scores;

CREATE POLICY "skill_scores_own"
  ON public.skill_scores FOR ALL
  USING (student_id = auth.uid());

CREATE POLICY "skill_scores_company_read"
  ON public.skill_scores FOR SELECT
  USING (public.get_my_role() IN ('company', 'admin'));

-- ──────────────────────────────────────────────────────────────
-- 17. ENSURE placements has unique student constraint
-- ──────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'placements_student_id_key'
    AND conrelid = 'public.placements'::regclass
  ) THEN
    ALTER TABLE public.placements
      ADD CONSTRAINT placements_student_id_key UNIQUE (student_id);
  END IF;
END;
$$;

-- ──────────────────────────────────────────────────────────────
-- 18. ADD missing updated_at column to applications if missing
-- ──────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'applications'
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.applications ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END;
$$;

-- ──────────────────────────────────────────────────────────────
-- 19. REALTIME — Enable realtime for notifications table
-- ──────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.interviews;

-- ──────────────────────────────────────────────────────────────
-- Done
-- ──────────────────────────────────────────────────────────────
SELECT 'Migration 007 complete — all RLS policies patched.' AS status;
