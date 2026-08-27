-- ============================================================
-- 006: Allow Podcast / Webinar channels
--      CHANNEL_OPTIONS (lib/database.types.ts) and the AI import
--      schema (app/api/import-plan/route.ts) already include these
--      two values, but the check constraint added in
--      002_v1_migration.sql predates them and will reject any
--      item the AI import (or manual entry) tries to save with
--      channel = 'Podcast' or 'Webinar'.
-- ============================================================

ALTER TABLE public.content_items DROP CONSTRAINT IF EXISTS content_items_channel_check;
ALTER TABLE public.content_items DROP CONSTRAINT IF EXISTS tasks_channel_check;

ALTER TABLE public.content_items
  ADD CONSTRAINT content_items_channel_check
  CHECK (channel IN ('YouTube','Instagram','LinkedIn','TikTok','Blog','Email','Twitter/X','Podcast','Webinar','Other'));
