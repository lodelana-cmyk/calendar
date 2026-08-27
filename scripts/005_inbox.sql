-- ============================================================
-- 005: Inbox — quick-capture ideas that aren't tied to a
--      campaign yet (and support for campaign-less content
--      items in general, e.g. one-off posts).
-- ============================================================

-- 1. Allow content items to exist without a campaign.
--    Ideas live here with campaign_id = NULL until promoted;
--    a promoted "single item" can also stay campaign-less.
ALTER TABLE public.content_items ALTER COLUMN campaign_id DROP NOT NULL;

-- 2. Track who submitted an item (used to attribute Inbox ideas).
ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Note: RLS already allows any authenticated user to insert/update/delete
-- content_items via the pre-existing "Authenticated users can do everything
-- with tasks" policy, so no policy changes are required for viewers to add
-- ideas to the Inbox.
