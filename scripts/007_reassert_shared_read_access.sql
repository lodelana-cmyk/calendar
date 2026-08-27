-- ============================================================
-- 007: Re-assert full read access to campaigns & content items
--
-- Symptom: a newly added teammate (Angela) sees an empty calendar —
-- no campaigns, no items — while an existing teammate sees everything.
--
-- That gap can't come from this app's own code: getCampaignsWithItems()
-- (lib/data.ts) and getCampaignsWithItemsClient() (lib/data-client.ts)
-- both do a plain `select("*")` with no per-user filter whatsoever —
-- no campaign_members join, no created_by check, nothing. And the
-- SELECT policies declared back in 002_v1_migration.sql are already
-- fully open:
--   CREATE POLICY "campaigns_select_all"     ON public.campaigns     FOR SELECT USING (true);
--   CREATE POLICY "content_items_select_all" ON public.content_items FOR SELECT USING (true);
-- (no role check, no `TO` clause restricting which role it applies to)
--
-- So if one signed-in account sees nothing, the live database has
-- drifted from what's checked into this scripts/ folder — either
-- those policies never actually landed, or something has since
-- narrowed them outside of any file here. (This repo already has one
-- confirmed instance of scripts/ not matching production: campaigns
-- and content_items were renamed from projects/tasks outside of any
-- checked-in migration.)
--
-- This migration only re-asserts the ORIGINAL, already-open policy —
-- it does not change who can write, only reaffirms who can read.
-- Ideas need no separate fix: an idea is just a content_items row
-- (campaign_id null, status = 'Idea'), so fixing content_items
-- covers ideas too.
--
-- Before applying the fix below, it's worth running these two
-- (commented out) queries first to see what's actually live:
--
--   select tablename, policyname, cmd, roles, qual
--   from pg_policies
--   where tablename in ('campaigns','content_items')
--   order by tablename, policyname;
--
--   select count(*) as campaigns from public.campaigns;
--   select count(*) as items     from public.content_items;
-- ============================================================

DROP POLICY IF EXISTS "campaigns_select_all"     ON public.campaigns;
DROP POLICY IF EXISTS "content_items_select_all" ON public.content_items;

CREATE POLICY "campaigns_select_all"     ON public.campaigns     FOR SELECT USING (true);
CREATE POLICY "content_items_select_all" ON public.content_items FOR SELECT USING (true);

GRANT SELECT ON public.campaigns     TO anon, authenticated;
GRANT SELECT ON public.content_items TO anon, authenticated;
