-- Seed: 4 Default Plans (Products)
-- Run this after migration to populate initial plan data.

INSERT INTO products (id, name, slug, description, status, is_default, sort_order, max_org_admins, max_managers, max_members, max_analyses_per_month, max_forms, max_form_submissions_per_month, max_storage_mb)
VALUES
  (gen_random_uuid(), 'Starter', 'starter', 'Basic plan for small teams getting started', 'active', true, 1, 1, 2, 5, 10, 3, 100, 500),
  (gen_random_uuid(), 'Professional', 'professional', 'For growing teams with advanced needs', 'active', false, 2, 2, 5, 20, 50, 10, 500, 2000),
  (gen_random_uuid(), 'Enterprise', 'enterprise', 'Unlimited access for large organizations', 'active', false, 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (gen_random_uuid(), 'Custom', 'custom', 'Individually configured plan with custom limits', 'active', false, 4, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
ON CONFLICT (slug) DO NOTHING;
