-- ============================================================
-- MIGRATION 004: ENHANCED SIGNUP TRIGGER
-- Stores ALL user registration fields (name, role, department,
-- cgpa, company_name, phone, register_number) into the
-- profiles table immediately on account creation.
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- Drop old trigger and function to replace with enhanced version
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ──────────────────────────────────────────────────────────────
-- ENHANCED TRIGGER FUNCTION
-- Reads all metadata passed during signUp() and stores it
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name             TEXT;
  v_role             TEXT;
  v_department       TEXT;
  v_cgpa             NUMERIC(3,2);
  v_company_name     TEXT;
  v_phone            TEXT;
  v_register_number  TEXT;
  v_graduation_year  INT;
BEGIN
  -- Extract metadata passed from the frontend signUp() call
  v_name            := COALESCE(
                          NEW.raw_user_meta_data->>'name',
                          split_part(NEW.email, '@', 1)
                        );
  v_role            := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  v_department      := NEW.raw_user_meta_data->>'department';
  v_company_name    := NEW.raw_user_meta_data->>'company_name';
  v_phone           := NEW.raw_user_meta_data->>'phone';
  v_register_number := NEW.raw_user_meta_data->>'register_number';

  -- Parse CGPA safely
  BEGIN
    v_cgpa := (NEW.raw_user_meta_data->>'cgpa')::NUMERIC(3,2);
  EXCEPTION WHEN OTHERS THEN
    v_cgpa := NULL;
  END;

  -- Parse graduation year safely
  BEGIN
    v_graduation_year := (NEW.raw_user_meta_data->>'graduation_year')::INT;
  EXCEPTION WHEN OTHERS THEN
    v_graduation_year := NULL;
  END;

  -- Insert / update profile row (safe to call multiple times)
  INSERT INTO public.profiles (
    id,
    email,
    name,
    role,
    department,
    cgpa,
    company_name,
    phone,
    register_number,
    graduation_year,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_name,
    v_role,
    v_department,
    v_cgpa,
    v_company_name,
    v_phone,
    v_register_number,
    v_graduation_year,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email            = EXCLUDED.email,
      name             = COALESCE(EXCLUDED.name,            public.profiles.name),
      role             = COALESCE(EXCLUDED.role,            public.profiles.role),
      department       = COALESCE(EXCLUDED.department,      public.profiles.department),
      cgpa             = COALESCE(EXCLUDED.cgpa,            public.profiles.cgpa),
      company_name     = COALESCE(EXCLUDED.company_name,    public.profiles.company_name),
      phone            = COALESCE(EXCLUDED.phone,           public.profiles.phone),
      register_number  = COALESCE(EXCLUDED.register_number, public.profiles.register_number),
      graduation_year  = COALESCE(EXCLUDED.graduation_year, public.profiles.graduation_year),
      updated_at       = NOW();

  RETURN NEW;
END;
$$;

-- Re-attach the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ──────────────────────────────────────────────────────────────
-- ALSO: Fix RLS policies to allow admin to view ALL profiles
-- (needed for PlacementOfficerDashboard to list all students)
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all"
  ON public.profiles
  FOR ALL
  USING (public.get_my_role() = 'admin');

-- Allow company HR to view all student profiles (for job matching)
DROP POLICY IF EXISTS "profiles_company_view" ON public.profiles;
CREATE POLICY "profiles_company_view"
  ON public.profiles
  FOR SELECT
  USING (public.get_my_role() = 'company' AND role = 'student');
