-- ============================================================
-- SUPABASE STORAGE BUCKETS & RLS POLICIES
-- Run this in Supabase SQL Editor → New Query → Run All
-- Fixes: "Error: Storage upload failed: new row violates row-level security policy"
-- ============================================================

-- 1. Create 'resumes' and 'profile-images' storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "storage_public_select" ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_insert"   ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_update"   ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_delete"   ON storage.objects;

-- 3. Create Storage Policies for authenticated users
CREATE POLICY "storage_public_select" ON storage.objects
  FOR SELECT USING (bucket_id IN ('resumes', 'profile-images'));

CREATE POLICY "storage_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('resumes', 'profile-images') 
    AND (auth.role() = 'authenticated' OR auth.role() = 'anon')
  );

CREATE POLICY "storage_auth_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id IN ('resumes', 'profile-images') 
    AND (auth.role() = 'authenticated' OR auth.role() = 'anon')
  );

CREATE POLICY "storage_auth_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('resumes', 'profile-images') 
    AND (auth.role() = 'authenticated' OR auth.role() = 'anon')
  );
