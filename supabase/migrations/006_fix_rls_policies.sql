-- ============================================================
-- MIGRATION 006: Fix RLS for assessment_questions & student_answers
-- Run in Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- 1. Allow students to INSERT into assessment_questions for their own assessments
DROP POLICY IF EXISTS "aq_student_insert" ON public.assessment_questions;
CREATE POLICY "aq_student_insert"
  ON public.assessment_questions FOR INSERT
  WITH CHECK (
    assessment_id IN (
      SELECT id FROM public.assessments WHERE student_id = auth.uid()
    )
  );

-- 2. Allow admin to do all operations on assessment_questions  
DROP POLICY IF EXISTS "aq_admin" ON public.assessment_questions;
CREATE POLICY "aq_admin"
  ON public.assessment_questions FOR ALL
  USING (public.get_my_role() = 'admin');

-- 3. Fix student_answers unique constraint for upsert on assessment_question_id
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

-- 4. Allow students to UPDATE their own notifications (mark as read)
DROP POLICY IF EXISTS "notifications_own_update" ON public.notifications;
CREATE POLICY "notifications_own_update"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- 5. Allow company/admin to insert notifications for any user
DROP POLICY IF EXISTS "notifications_company_insert" ON public.notifications;
CREATE POLICY "notifications_company_insert"
  ON public.notifications FOR INSERT
  WITH CHECK (public.get_my_role() IN ('admin', 'company'));

-- 6. Allow student to UPDATE own applications (withdrawal)
DROP POLICY IF EXISTS "apps_student_withdraw" ON public.applications;
CREATE POLICY "apps_student_withdraw"
  ON public.applications FOR UPDATE
  USING (student_id = auth.uid());

-- 7. Allow placements to be inserted by admin
DROP POLICY IF EXISTS "placements_admin_insert" ON public.placements;
CREATE POLICY "placements_admin_insert"
  ON public.placements FOR INSERT
  WITH CHECK (public.get_my_role() = 'admin');

-- 8. Allow all users to read companies
DROP POLICY IF EXISTS "companies_read_all" ON public.companies;
CREATE POLICY "companies_read_all"
  ON public.companies FOR SELECT
  USING (true);
