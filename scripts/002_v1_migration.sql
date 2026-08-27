-- V1 Migration (idempotent) — projects→campaigns, tasks→content_items
-- Run with: NODE_TLS_REJECT_UNAUTHORIZED=0 node --env-file=.env.local scripts/run-migration.mjs

BEGIN;

-- ============================================================
-- 1. PROFILES — add app_role
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS app_role text NOT NULL DEFAULT 'editor'
    CHECK (app_role IN ('editor','viewer'));

UPDATE public.profiles SET app_role = 'editor';

-- allow editors to manage any profile's role
DROP POLICY IF EXISTS "profiles_update_own"          ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_role_editor"  ON public.profiles;

CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_role_editor" ON public.profiles FOR UPDATE TO authenticated
  USING  ((SELECT app_role FROM public.profiles WHERE id = auth.uid()) = 'editor')
  WITH CHECK ((SELECT app_role FROM public.profiles WHERE id = auth.uid()) = 'editor');

-- Refresh signup trigger to give editors by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, app_role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'Content Creator'),
    'editor'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. CAMPAIGNS  (rename projects)
-- ============================================================

ALTER TABLE public.projects RENAME TO campaigns;

-- new V1 columns
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS motion    text NOT NULL DEFAULT 'Always-on'
    CHECK (motion IN ('Always-on','Brand Awareness','Product Launch','Seasonal','Event','Lead Gen')),
  ADD COLUMN IF NOT EXISTS product   text NOT NULL DEFAULT 'Other',
  ADD COLUMN IF NOT EXISTS objective text DEFAULT '',
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date   date;

-- backfill product from title
UPDATE public.campaigns SET
  motion  = 'Always-on',
  product = CASE
    WHEN title ILIKE '%SmartRepricer%'              THEN 'SmartRepricer'
    WHEN title ILIKE '%FeedbackWhiz%'               THEN 'FeedbackWhiz'
    WHEN title ILIKE '%ExportYourStore%' OR title ILIKE '%Export%' THEN 'ExportYourStore'
    WHEN title ILIKE '%Seller365%' OR title ILIKE '%S365%' THEN 'Seller365'
    WHEN title ILIKE '%Reimbursement%'              THEN 'Reimbursements'
    WHEN title ILIKE '%UniCon%'                     THEN 'UniCon'
    WHEN title ILIKE '%MPP%'                        THEN 'MPP'
    WHEN title ILIKE '%Promo%' OR title ILIKE '%Brand%' THEN 'Threecolts Brand'
    ELSE 'Other'
  END;

DROP POLICY IF EXISTS "projects_select_all"            ON public.campaigns;
DROP POLICY IF EXISTS "projects_insert_authenticated"  ON public.campaigns;
DROP POLICY IF EXISTS "projects_update_authenticated"  ON public.campaigns;
DROP POLICY IF EXISTS "projects_delete_authenticated"  ON public.campaigns;

CREATE POLICY "campaigns_select_all"    ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "campaigns_insert_editor" ON public.campaigns FOR INSERT TO authenticated
  WITH CHECK ((SELECT app_role FROM public.profiles WHERE id = auth.uid()) = 'editor');
CREATE POLICY "campaigns_update_editor" ON public.campaigns FOR UPDATE TO authenticated
  USING  ((SELECT app_role FROM public.profiles WHERE id = auth.uid()) = 'editor')
  WITH CHECK ((SELECT app_role FROM public.profiles WHERE id = auth.uid()) = 'editor');
CREATE POLICY "campaigns_delete_editor" ON public.campaigns FOR DELETE TO authenticated
  USING  ((SELECT app_role FROM public.profiles WHERE id = auth.uid()) = 'editor');

-- ============================================================
-- 3. CAMPAIGN_MEMBERS  (rename project_members)
-- ============================================================

ALTER TABLE public.project_members   RENAME TO campaign_members;
ALTER TABLE public.campaign_members  RENAME COLUMN project_id TO campaign_id;

DROP POLICY IF EXISTS "project_members_select_all"           ON public.campaign_members;
DROP POLICY IF EXISTS "project_members_insert_authenticated" ON public.campaign_members;
DROP POLICY IF EXISTS "project_members_delete_authenticated" ON public.campaign_members;

CREATE POLICY "campaign_members_select_all"    ON public.campaign_members FOR SELECT USING (true);
CREATE POLICY "campaign_members_insert_editor" ON public.campaign_members FOR INSERT TO authenticated
  WITH CHECK ((SELECT app_role FROM public.profiles WHERE id = auth.uid()) = 'editor');
CREATE POLICY "campaign_members_delete_editor" ON public.campaign_members FOR DELETE TO authenticated
  USING  ((SELECT app_role FROM public.profiles WHERE id = auth.uid()) = 'editor');

-- ============================================================
-- 4. CONTENT_ITEMS  (rename tasks)
-- ============================================================

ALTER TABLE public.tasks RENAME TO content_items;

ALTER TABLE public.content_items RENAME COLUMN project_id   TO campaign_id;
ALTER TABLE public.content_items RENAME COLUMN due_date     TO publish_date;
ALTER TABLE public.content_items RENAME COLUMN task_type    TO format;

-- new V1 columns
ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS channel         text NOT NULL DEFAULT 'YouTube'
    CHECK (channel IN ('YouTube','Instagram','LinkedIn','TikTok','Blog','Email','Twitter/X','Other')),
  ADD COLUMN IF NOT EXISTS date_confidence text NOT NULL DEFAULT 'Confirmed'
    CHECK (date_confidence IN ('Confirmed','Provisional')),
  ADD COLUMN IF NOT EXISTS content_role    text DEFAULT '',
  ADD COLUMN IF NOT EXISTS notes           text DEFAULT '',
  ADD COLUMN IF NOT EXISTS brief_url       text DEFAULT '',
  ADD COLUMN IF NOT EXISTS live_url        text DEFAULT '';

UPDATE public.content_items SET channel = 'YouTube', date_confidence = 'Confirmed';

DROP INDEX IF EXISTS public.idx_tasks_project_id;
DROP INDEX IF EXISTS public.idx_tasks_assignee_id;
DROP INDEX IF EXISTS public.idx_tasks_due_date;
DROP INDEX IF EXISTS public.idx_tasks_status;

CREATE INDEX IF NOT EXISTS idx_content_items_campaign_id  ON public.content_items(campaign_id);
CREATE INDEX IF NOT EXISTS idx_content_items_assignee_id  ON public.content_items(assignee_id);
CREATE INDEX IF NOT EXISTS idx_content_items_publish_date ON public.content_items(publish_date);
CREATE INDEX IF NOT EXISTS idx_content_items_status       ON public.content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_channel      ON public.content_items(channel);

DROP POLICY IF EXISTS "tasks_select_all"            ON public.content_items;
DROP POLICY IF EXISTS "tasks_insert_authenticated"  ON public.content_items;
DROP POLICY IF EXISTS "tasks_update_authenticated"  ON public.content_items;
DROP POLICY IF EXISTS "tasks_delete_authenticated"  ON public.content_items;

CREATE POLICY "content_items_select_all"    ON public.content_items FOR SELECT USING (true);
CREATE POLICY "content_items_insert_editor" ON public.content_items FOR INSERT TO authenticated
  WITH CHECK ((SELECT app_role FROM public.profiles WHERE id = auth.uid()) = 'editor');
CREATE POLICY "content_items_update_editor" ON public.content_items FOR UPDATE TO authenticated
  USING  ((SELECT app_role FROM public.profiles WHERE id = auth.uid()) = 'editor')
  WITH CHECK ((SELECT app_role FROM public.profiles WHERE id = auth.uid()) = 'editor');
CREATE POLICY "content_items_delete_editor" ON public.content_items FOR DELETE TO authenticated
  USING  ((SELECT app_role FROM public.profiles WHERE id = auth.uid()) = 'editor');

-- ============================================================
-- 5. SETTINGS  (editable product/channel lists)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.settings (
  key   text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select_all"    ON public.settings;
DROP POLICY IF EXISTS "settings_upsert_editor" ON public.settings;
DROP POLICY IF EXISTS "settings_update_editor" ON public.settings;

CREATE POLICY "settings_select_all"    ON public.settings FOR SELECT USING (true);
CREATE POLICY "settings_insert_editor" ON public.settings FOR INSERT TO authenticated
  WITH CHECK ((SELECT app_role FROM public.profiles WHERE id = auth.uid()) = 'editor');
CREATE POLICY "settings_update_editor" ON public.settings FOR UPDATE TO authenticated
  USING  ((SELECT app_role FROM public.profiles WHERE id = auth.uid()) = 'editor')
  WITH CHECK ((SELECT app_role FROM public.profiles WHERE id = auth.uid()) = 'editor');

INSERT INTO public.settings (key, value) VALUES (
  'products',
  '["SmartRepricer","FeedbackWhiz","ExportYourStore","Seller365","Reimbursements","UniCon","MPP","Threecolts Brand","ChannelAdvisor","Linnworks","Zentail","Skubana","Other"]'::jsonb
) ON CONFLICT (key) DO NOTHING;

INSERT INTO public.settings (key, value) VALUES (
  'channels',
  '["YouTube","Instagram","LinkedIn","TikTok","Blog","Email","Twitter/X","Other"]'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 6. GRANTS  (expose to Supabase Data API)
-- ============================================================

GRANT SELECT ON public.campaigns        TO anon, authenticated;
GRANT SELECT ON public.content_items    TO anon, authenticated;
GRANT SELECT ON public.campaign_members TO anon, authenticated;
GRANT SELECT ON public.settings         TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.campaigns        TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.content_items    TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.campaign_members TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.settings         TO authenticated;

-- ============================================================
-- 7. DROP obsolete table
-- ============================================================

DROP TABLE IF EXISTS public.archived_projects;

COMMIT;
