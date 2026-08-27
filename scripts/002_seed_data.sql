-- Seed data for Editorial Studio

-- Insert sample profiles (these will be linked to actual auth users)
-- For development, we create placeholder profiles
insert into public.profiles (id, full_name, role, avatar_url, is_online) values
  ('00000000-0000-0000-0000-000000000001', 'Lionel', 'Creative Director', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face', true),
  ('00000000-0000-0000-0000-000000000002', 'Dre', 'Video Producer', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face', true),
  ('00000000-0000-0000-0000-000000000003', 'Naufal', 'Motion Designer', 'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=200&h=200&fit=crop&crop=face', false),
  ('00000000-0000-0000-0000-000000000004', 'Andrea', 'Production Lead', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face', true),
  ('00000000-0000-0000-0000-000000000005', 'Zed', 'Event Producer', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face', false),
  ('00000000-0000-0000-0000-000000000006', 'Talha', 'Course Producer', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face', true),
  ('00000000-0000-0000-0000-000000000007', 'Monica', 'Localization Manager', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face', true),
  ('00000000-0000-0000-0000-000000000008', 'Angela', 'Product Specialist', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face', false),
  ('00000000-0000-0000-0000-000000000009', 'Layla', 'HR Coordinator', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face', true),
  ('00000000-0000-0000-0000-000000000010', 'Amanda', 'Documentary Lead', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face', false),
  ('00000000-0000-0000-0000-000000000011', 'Hamza', 'Interview Director', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face', true),
  ('00000000-0000-0000-0000-000000000012', 'Wiktoria', 'Pitch Producer', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop&crop=face', false)
on conflict (id) do nothing;

-- Insert sample projects
insert into public.projects (id, name, description, category, lead_id, icon_label, icon_color, status) values
  ('10000000-0000-0000-0000-000000000001', 'ScoutIQ', 'Product demo videos and onboarding tutorials for the ScoutIQ analytics platform launch.', 'DEVELOPMENT', '00000000-0000-0000-0000-000000000001', 'SIQ', 'bg-indigo-500', 'Active'),
  ('10000000-0000-0000-0000-000000000002', 'Prep Center Portal', 'FBA prep workflow documentation and client-facing promotional content series.', 'E-COMMERCE', '00000000-0000-0000-0000-000000000004', 'PCP', 'bg-emerald-500', 'Active'),
  ('10000000-0000-0000-0000-000000000003', 'TikTok', 'Short-form viral content creation for brand awareness and social engagement campaigns.', 'ADVERTISING', '00000000-0000-0000-0000-000000000003', 'TT', 'bg-rose-500', 'Active'),
  ('10000000-0000-0000-0000-000000000004', 'UniCon', 'Conference highlight reels and speaker introduction videos for annual summit.', 'CORPORATE', '00000000-0000-0000-0000-000000000005', 'UC', 'bg-violet-500', 'Active'),
  ('10000000-0000-0000-0000-000000000005', 'Portuguese SLG', 'Localization and dubbing project for expanding market reach into Portuguese-speaking regions.', 'LOCALIZATION', '00000000-0000-0000-0000-000000000007', 'PT', 'bg-amber-500', 'Active'),
  ('10000000-0000-0000-0000-000000000006', 'Stephens Course', 'Educational course content production with multi-module video lessons and supplementary materials.', 'STUDIO', '00000000-0000-0000-0000-000000000006', 'SC', 'bg-cyan-500', 'Active'),
  ('10000000-0000-0000-0000-000000000007', 'ExportYourStore', 'SaaS product walkthrough and tutorial series for e-commerce export automation tool.', 'E-COMMERCE', '00000000-0000-0000-0000-000000000008', 'EYS', 'bg-teal-500', 'On Hold'),
  ('10000000-0000-0000-0000-000000000008', 'TA Onboarding', 'Internal training and onboarding video series for new team member orientation.', 'CORPORATE', '00000000-0000-0000-0000-000000000009', 'TAO', 'bg-blue-500', 'Active'),
  ('10000000-0000-0000-0000-000000000009', 'Breakfast in London', 'Documentary-style event coverage capturing networking sessions and panel discussions.', 'MEDIA', '00000000-0000-0000-0000-000000000010', 'BIL', 'bg-orange-500', 'Active'),
  ('10000000-0000-0000-0000-000000000010', 'Brand Interviews', 'Executive interview series featuring brand leaders and industry thought leadership content.', 'COMMERCIAL', '00000000-0000-0000-0000-000000000011', 'BI', 'bg-pink-500', 'Active'),
  ('10000000-0000-0000-0000-000000000011', 'Venture Forge', 'Startup pitch video and investor presentation materials for funding round preparation.', 'COMMERCIAL', '00000000-0000-0000-0000-000000000012', 'VF', 'bg-slate-600', 'On Hold')
on conflict (id) do nothing;

-- Insert sample tasks
insert into public.tasks (project_id, name, task_type, status, assignee_id, due_date, sort_order) values
  -- ScoutIQ tasks
  ('10000000-0000-0000-0000-000000000001', 'Intro Animation', 'Edit', 'Done', '00000000-0000-0000-0000-000000000001', '2025-06-10', 1),
  ('10000000-0000-0000-0000-000000000001', 'Feature Walkthrough', 'Script', 'Done', '00000000-0000-0000-0000-000000000002', '2025-06-10', 2),
  ('10000000-0000-0000-0000-000000000001', 'Screen Recording', 'Filming', 'In Progress', '00000000-0000-0000-0000-000000000003', '2025-06-11', 3),
  ('10000000-0000-0000-0000-000000000001', 'Final Mix', 'Voiceover', 'Not Started', '00000000-0000-0000-0000-000000000008', '2025-06-13', 4),
  -- Prep Center Portal tasks
  ('10000000-0000-0000-0000-000000000002', 'Thumbnail Design', 'Design', 'Done', '00000000-0000-0000-0000-000000000002', '2025-06-10', 1),
  ('10000000-0000-0000-0000-000000000002', 'Storyboard Draft', 'Script', 'In Progress', '00000000-0000-0000-0000-000000000001', '2025-06-11', 2),
  ('10000000-0000-0000-0000-000000000002', 'B-Roll Footage', 'Filming', 'Blocked', '00000000-0000-0000-0000-000000000003', '2025-06-12', 3),
  ('10000000-0000-0000-0000-000000000002', 'Audio Polish', 'Edit', 'Not Started', '00000000-0000-0000-0000-000000000005', '2025-06-13', 4),
  ('10000000-0000-0000-0000-000000000002', 'Channel Upload', 'Upload', 'Not Started', '00000000-0000-0000-0000-000000000010', '2025-06-14', 5),
  -- TikTok tasks
  ('10000000-0000-0000-0000-000000000003', 'Hook Script', 'Script', 'Done', '00000000-0000-0000-0000-000000000003', '2025-06-10', 1),
  ('10000000-0000-0000-0000-000000000003', 'Vertical Edit', 'Edit', 'Done', '00000000-0000-0000-0000-000000000002', '2025-06-11', 2),
  ('10000000-0000-0000-0000-000000000003', 'Caption Overlay', 'Design', 'Done', '00000000-0000-0000-0000-000000000001', '2025-06-11', 3),
  ('10000000-0000-0000-0000-000000000003', 'Schedule Post', 'Upload', 'In Progress', '00000000-0000-0000-0000-000000000003', '2025-06-12', 4),
  -- UniCon tasks
  ('10000000-0000-0000-0000-000000000004', 'Event Promo', 'Promo', 'Done', '00000000-0000-0000-0000-000000000001', '2025-06-10', 1),
  ('10000000-0000-0000-0000-000000000004', 'Speaker Intros', 'Script', 'In Progress', '00000000-0000-0000-0000-000000000002', '2025-06-12', 2),
  ('10000000-0000-0000-0000-000000000004', 'Stage Recording', 'Filming', 'Not Started', '00000000-0000-0000-0000-000000000006', '2025-06-13', 3),
  ('10000000-0000-0000-0000-000000000004', 'Highlight Reel', 'Edit', 'Not Started', '00000000-0000-0000-0000-000000000007', '2025-06-14', 4),
  -- Portuguese SLG tasks
  ('10000000-0000-0000-0000-000000000005', 'Localization', 'Script', 'Done', '00000000-0000-0000-0000-000000000002', '2025-06-10', 1),
  ('10000000-0000-0000-0000-000000000005', 'VO Recording', 'Voiceover', 'Done', '00000000-0000-0000-0000-000000000003', '2025-06-10', 2),
  ('10000000-0000-0000-0000-000000000005', 'Subtitle Sync', 'Edit', 'In Progress', '00000000-0000-0000-0000-000000000001', '2025-06-12', 3),
  ('10000000-0000-0000-0000-000000000005', 'QA Review', 'Admin', 'Blocked', '00000000-0000-0000-0000-000000000002', '2025-06-13', 4),
  -- Stephens Course tasks
  ('10000000-0000-0000-0000-000000000006', 'Module 1 Film', 'Filming', 'Done', '00000000-0000-0000-0000-000000000003', '2025-06-10', 1),
  ('10000000-0000-0000-0000-000000000006', 'Module 2 Film', 'Filming', 'Done', '00000000-0000-0000-0000-000000000003', '2025-06-11', 2),
  ('10000000-0000-0000-0000-000000000006', 'Module 3 Edit', 'Edit', 'In Progress', '00000000-0000-0000-0000-000000000002', '2025-06-12', 3),
  ('10000000-0000-0000-0000-000000000006', 'Course Graphics', 'Design', 'Not Started', '00000000-0000-0000-0000-000000000012', '2025-06-13', 4),
  ('10000000-0000-0000-0000-000000000006', 'Platform Upload', 'Upload', 'Not Started', '00000000-0000-0000-0000-000000000009', '2025-06-14', 5),
  -- ExportYourStore tasks
  ('10000000-0000-0000-0000-000000000007', 'Product Demo', 'Script', 'In Progress', '00000000-0000-0000-0000-000000000001', '2025-06-13', 1),
  ('10000000-0000-0000-0000-000000000007', 'UI Capture', 'Filming', 'Not Started', '00000000-0000-0000-0000-000000000011', '2025-06-14', 2),
  ('10000000-0000-0000-0000-000000000007', 'Tutorial Edit', 'Edit', 'Not Started', null, '2025-06-14', 3),
  -- TA Onboarding tasks
  ('10000000-0000-0000-0000-000000000008', 'Welcome Video', 'Filming', 'Done', '00000000-0000-0000-0000-000000000002', '2025-06-10', 1),
  ('10000000-0000-0000-0000-000000000008', 'Process Guide', 'Script', 'Done', '00000000-0000-0000-0000-000000000001', '2025-06-10', 2),
  ('10000000-0000-0000-0000-000000000008', 'HR Review', 'Admin', 'Done', '00000000-0000-0000-0000-000000000002', '2025-06-11', 3),
  ('10000000-0000-0000-0000-000000000008', 'Final Export', 'Upload', 'In Progress', '00000000-0000-0000-0000-000000000003', '2025-06-11', 4),
  -- Breakfast in London tasks
  ('10000000-0000-0000-0000-000000000009', 'Location Scout', 'Admin', 'Done', '00000000-0000-0000-0000-000000000003', '2025-06-10', 1),
  ('10000000-0000-0000-0000-000000000009', 'Interview Setup', 'Filming', 'In Progress', '00000000-0000-0000-0000-000000000001', '2025-06-12', 2),
  ('10000000-0000-0000-0000-000000000009', 'Candid Shots', 'Filming', 'Blocked', '00000000-0000-0000-0000-000000000002', '2025-06-12', 3),
  ('10000000-0000-0000-0000-000000000009', 'Event Recap', 'Edit', 'Not Started', '00000000-0000-0000-0000-000000000004', '2025-06-14', 4),
  -- Brand Interviews tasks
  ('10000000-0000-0000-0000-000000000010', 'Guest Prep', 'Admin', 'Done', '00000000-0000-0000-0000-000000000001', '2025-06-10', 1),
  ('10000000-0000-0000-0000-000000000010', 'Studio Film', 'Filming', 'Done', '00000000-0000-0000-0000-000000000003', '2025-06-11', 2),
  ('10000000-0000-0000-0000-000000000010', 'Color Grade', 'Edit', 'Done', '00000000-0000-0000-0000-000000000002', '2025-06-11', 3),
  ('10000000-0000-0000-0000-000000000010', 'Social Clips', 'Promo', 'In Progress', '00000000-0000-0000-0000-000000000001', '2025-06-13', 4),
  -- Venture Forge tasks
  ('10000000-0000-0000-0000-000000000011', 'Concept Art', 'Design', 'In Progress', '00000000-0000-0000-0000-000000000002', '2025-06-13', 1),
  ('10000000-0000-0000-0000-000000000011', 'Pitch Script', 'Script', 'Not Started', '00000000-0000-0000-0000-000000000005', '2025-06-14', 2),
  ('10000000-0000-0000-0000-000000000011', 'Founder VO', 'Voiceover', 'Not Started', null, '2025-06-14', 3),
  ('10000000-0000-0000-0000-000000000011', 'Teaser Cut', 'Edit', 'Not Started', null, '2025-06-14', 4),
  ('10000000-0000-0000-0000-000000000011', 'Launch Promo', 'Promo', 'Not Started', null, '2025-06-14', 5);

-- Insert archived projects
insert into public.archived_projects (title, description, category, campaign_cycle, delivered_on, tags, storage_gb, impressions, lead_name, cover_image_url) values
  ('ScoutIQ Product Launch', 'Complete video campaign for the ScoutIQ 3.0 release including product demos, tutorials, and promotional content.', 'DEVELOPMENT', 'Q4 2024', '2024-12-15', ARRAY['Product Launch', 'Tutorial', 'Promo'], 2.4, 45200, 'Lionel', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop'),
  ('Seller 365 Onboarding Series', '8-part onboarding video series for new Seller 365 users.', 'E-COMMERCE', 'Q4 2024', '2024-11-30', ARRAY['Onboarding', 'Tutorial'], 1.2, 18300, 'Andrea', null),
  ('Black Friday Ad Campaign', 'Multi-platform ad creatives for BFCM promotion.', 'ADVERTISING', 'Q4 2024', '2024-11-22', ARRAY['Advertising', 'Social'], 0.8, 0, 'Naufal', null),
  ('Threecolts Podcast S2', 'Full season production including 12 episodes, show notes, audiograms, and promotional clips for social distribution.', 'MEDIA', 'Q3 2024', '2024-09-28', ARRAY['Podcast', 'Audio', 'Social'], 4.8, 67800, 'Amanda', 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&h=400&fit=crop'),
  ('Portuguese Localization', 'Full localization of 20+ videos for Brazilian market.', 'LOCALIZATION', 'Q3 2024', '2024-08-15', ARRAY['Localization', 'Translation'], 1.6, 0, 'Monica', null),
  ('Enterprise Demo Reel', 'Showcase reel for enterprise sales presentations.', 'COMMERCIAL', 'Q3 2024', '2024-07-30', ARRAY['Sales', 'Demo'], 0.6, 3200, 'Hamza', null),
  ('CedCommerce Integration Guide', 'Complete video documentation for CedCommerce platform integration including setup walkthroughs and troubleshooting guides.', 'E-COMMERCE', 'Q2 2024', '2024-06-20', ARRAY['Documentation', 'Tutorial', 'Integration'], 2.1, 28400, 'Angela', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop'),
  ('Summer Campaign 2024', 'Seasonal promotional content across all channels.', 'ADVERTISING', 'Q2 2024', '2024-05-31', ARRAY['Campaign', 'Promo'], 1.4, 0, 'Dre', null);
