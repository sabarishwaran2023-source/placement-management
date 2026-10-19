-- ============================================================
-- RUN THIS IN: Supabase Dashboard → SQL Editor → New Query
-- PURPOSE: Confirm ALL existing unconfirmed users instantly
--          so they can log in without email verification
-- ============================================================

-- Step 1: Confirm all unconfirmed email addresses
UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmed_at       = COALESCE(confirmed_at,       NOW()),
  updated_at         = NOW()
WHERE email_confirmed_at IS NULL
   OR confirmed_at IS NULL;

-- Step 2: Verify — should return 0 rows if all are confirmed
SELECT id, email, email_confirmed_at, confirmed_at
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;
