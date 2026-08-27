-- ============================================================
-- 004: Spec alignment — campaign type/motion, item statuses,
--      contributors, comments table
-- ============================================================

-- 1. Campaign TYPE (Pillar / Launch / Always-on)
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS type text;

UPDATE public.campaigns SET type = CASE
  WHEN motion = 'Product Launch' THEN 'Launch'
  ELSE 'Always-on'
END
WHERE type IS NULL;

ALTER TABLE public.campaigns ALTER COLUMN type SET DEFAULT 'Always-on';
ALTER TABLE public.campaigns ALTER COLUMN type SET NOT NULL;
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_type_check;
ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_type_check
  CHECK (type IN ('Pillar','Launch','Always-on'));

-- 2. Campaign MOTION -> SMB / Enterprise / Both / Retention
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_motion_check;

UPDATE public.campaigns SET motion = 'Both'
WHERE motion NOT IN ('SMB','Enterprise','Both','Retention');

ALTER TABLE public.campaigns ALTER COLUMN motion SET DEFAULT 'Both';
ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_motion_check
  CHECK (motion IN ('SMB','Enterprise','Both','Retention'));

-- 3. Content item STATUS -> spec values
ALTER TABLE public.content_items DROP CONSTRAINT IF EXISTS content_items_status_check;
ALTER TABLE public.content_items DROP CONSTRAINT IF EXISTS tasks_status_check;

UPDATE public.content_items SET status = CASE status
  WHEN 'Not Started'   THEN 'Planned'
  WHEN 'In Production' THEN 'In progress'
  WHEN 'In Review'     THEN 'In review'
  WHEN 'Blocked'       THEN 'In progress'
  WHEN 'Cancelled'     THEN 'Idea'
  WHEN 'Published'     THEN 'Published'
  ELSE 'Planned'
END
WHERE status NOT IN ('Idea','Planned','In progress','In review','Scheduled','Published');

ALTER TABLE public.content_items ALTER COLUMN status SET DEFAULT 'Planned';
ALTER TABLE public.content_items
  ADD CONSTRAINT content_items_status_check
  CHECK (status IN ('Idea','Planned','In progress','In review','Scheduled','Published'));

-- 4. Contributors (array of {profile_id, role})
ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS contributors jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 5. Comments table (single-level thread per item)
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comments_item_id_idx ON public.comments(item_id, created_at);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- All authenticated users (incl. viewers) can read and post comments per spec
DROP POLICY IF EXISTS "comments_select" ON public.comments;
CREATE POLICY "comments_select" ON public.comments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "comments_insert" ON public.comments;
CREATE POLICY "comments_insert" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = author_id);

-- Authors can delete their own comments
DROP POLICY IF EXISTS "comments_delete_own" ON public.comments;
CREATE POLICY "comments_delete_own" ON public.comments
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = author_id);
