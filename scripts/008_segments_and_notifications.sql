-- ============================================================
-- 008: Audience segments on content items, and notifications
--      (@-mentions in comments, plus an opt-in "notify the team"
--      when someone starts a new piece of content)
--
-- Safe to re-run.
-- ============================================================

-- 1. Audience segments ------------------------------------------------
-- Allowed values live in code (AUDIENCE_SEGMENTS in lib/database.types.ts),
-- so the list can grow without another migration.
ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS audience_segments text[] NOT NULL DEFAULT '{}';

-- 2. Notifications ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  type         text NOT NULL CHECK (type IN ('mention', 'new_content')),
  item_id      uuid REFERENCES public.content_items(id) ON DELETE CASCADE,
  comment_id   uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  body_preview text,
  read_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_recipient_idx
  ON public.notifications (recipient_id, read_at, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- People can only see and manage their own notifications. There is
-- deliberately NO insert policy: rows are only created by the two
-- security-definer functions below, so nobody can forge one.
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = recipient_id);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = recipient_id)
  WITH CHECK ((SELECT auth.uid()) = recipient_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = recipient_id);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;

-- 3. Mentions ---------------------------------------------------------
-- Comments store mentions as @[Full Name](profile-uuid). After a comment is
-- inserted, notify each mentioned person (not the author, and only real
-- profiles — a stale id must not make the comment itself fail).
CREATE OR REPLACE FUNCTION public.notify_comment_mentions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mentioned uuid;
  preview   text;
BEGIN
  preview := left(
    regexp_replace(NEW.body, '@\[([^\]]*)\]\([0-9a-fA-F-]{36}\)', '@\1', 'g'),
    200
  );

  FOR mentioned IN
    SELECT DISTINCT (r.m)[1]::uuid
    FROM regexp_matches(
      NEW.body,
      '@\[[^\]]*\]\(([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\)',
      'g'
    ) AS r(m)
  LOOP
    IF mentioned <> NEW.author_id
       AND EXISTS (SELECT 1 FROM public.profiles WHERE id = mentioned) THEN
      INSERT INTO public.notifications (recipient_id, actor_id, type, item_id, comment_id, body_preview)
      VALUES (mentioned, NEW.author_id, 'mention', NEW.item_id, NEW.id, preview);
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS comments_notify_mentions ON public.comments;
CREATE TRIGGER comments_notify_mentions
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_comment_mentions();

-- 4. "Notify the team" ------------------------------------------------
-- Called by the app when an editor ticks "Notify the team" while creating
-- an item. Sends one notification to everyone except the caller.
CREATE OR REPLACE FUNCTION public.notify_team(p_item_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller     uuid := auth.uid();
  item_title text;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;

  IF (SELECT app_role FROM public.profiles WHERE id = caller) IS DISTINCT FROM 'editor' THEN
    RAISE EXCEPTION 'Only editors can notify the team';
  END IF;

  SELECT title INTO item_title FROM public.content_items WHERE id = p_item_id;
  IF item_title IS NULL THEN
    RAISE EXCEPTION 'Content item not found';
  END IF;

  INSERT INTO public.notifications (recipient_id, actor_id, type, item_id, body_preview)
  SELECT p.id, caller, 'new_content', p_item_id, left(item_title, 200)
  FROM public.profiles p
  WHERE p.id <> caller;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_team(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.notify_team(uuid) TO authenticated;
