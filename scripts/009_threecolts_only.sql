-- ============================================================
-- 009: Threecolts accounts only
--
-- Before this, campaigns, content items and settings could be read with
-- the public (anon) key without signing in, and any signed-up account,
-- on any email, could read and comment on everything.
--
-- This adds one RESTRICTIVE policy to every table in the public schema.
-- Restrictive policies are ANDed with the existing ones, so every rule
-- that's already there (editors-only writes, own notifications, …) still
-- applies, and on top of that the caller must be a verified
-- @threecolts.com account. Signed-out (anon) requests get nothing.
--
-- The server's service-role key (Slack notifications, invites) and the
-- security-definer triggers/functions bypass RLS as before.
--
-- Safe to re-run.
-- ============================================================

-- 1. Who counts as a member -------------------------------------------
CREATE OR REPLACE FUNCTION public.is_threecolts_member()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid()
      AND u.email_confirmed_at IS NOT NULL
      AND lower(split_part(u.email, '@', 2)) = 'threecolts.com'
  )
$$;

REVOKE ALL ON FUNCTION public.is_threecolts_member() FROM public;
GRANT EXECUTE ON FUNCTION public.is_threecolts_member() TO anon, authenticated;

-- 2. Every public table: RLS on, members only ---------------------------
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    EXECUTE format('DROP POLICY IF EXISTS "threecolts_members_only" ON public.%I', t.tablename);
    EXECUTE format(
      'CREATE POLICY "threecolts_members_only" ON public.%I AS RESTRICTIVE FOR ALL TO public '
      'USING ((SELECT public.is_threecolts_member())) WITH CHECK ((SELECT public.is_threecolts_member()))',
      t.tablename
    );
  END LOOP;
END $$;

-- 3. Signed-out requests shouldn't even reach the tables -----------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- 4. Check: who has an account that isn't Threecolts? ---------------------
-- Run this, review the list, then delete those users in
-- Authentication → Users (deleting a user also removes their profile).
--
-- SELECT id, email, created_at, last_sign_in_at
-- FROM auth.users
-- WHERE lower(split_part(email, '@', 2)) <> 'threecolts.com'
-- ORDER BY created_at DESC;
