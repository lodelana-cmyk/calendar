-- 1. Temporarily disable the constraint so we can update rows first
ALTER TABLE public.campaigns
  DROP CONSTRAINT IF EXISTS campaigns_motion_check;

-- 2. Migrate existing rows
UPDATE public.campaigns SET motion = 'Always On' WHERE motion = 'Always-on';

-- 3. Re-add constraint with the new value included
ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_motion_check
  CHECK (motion IN ('Always On','Brand Awareness','Product Launch','Seasonal','Event','Lead Gen'));
