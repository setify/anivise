-- ============================================
-- Storage RLS Policies for Supabase Storage Buckets
-- ============================================
-- This migration sets up RLS policies for two storage buckets:
--   1. platform-assets  – Platform-wide media managed by superadmins/staff
--   2. org-assets       – Organization-scoped media managed by org admins/members
--
-- Both buckets are created as public (read access via public URL),
-- but write/update/delete operations are restricted via RLS.
-- ============================================


-- ────────────────────────────────────────────
-- Helper Function: Check if user is platform staff (superadmin or staff)
-- ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_platform_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND platform_role IN ('superadmin', 'staff')
  );
$$;


-- ────────────────────────────────────────────
-- Helper Function: Check if user is a platform superadmin
-- ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_platform_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND platform_role = 'superadmin'
  );
$$;


-- ────────────────────────────────────────────
-- Helper Function: Check if user is a member of a given organization
-- Extracts organization_id from the storage path prefix: {org_id}/...
-- ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_org_member_for_path(object_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = auth.uid()
      AND organization_id = (split_part(object_name, '/', 1))::uuid
  );
$$;


-- ────────────────────────────────────────────
-- Helper Function: Check if user is an org_admin for the org in the path
-- ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_org_admin_for_path(object_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = auth.uid()
      AND organization_id = (split_part(object_name, '/', 1))::uuid
      AND role = 'org_admin'
  );
$$;


-- ============================================
-- BUCKET 1: platform-assets
-- ============================================
-- Used for: email logos, email templates, form headers, report assets,
--           general platform design assets.
-- Structure: media/{context}/{entityId?}/{timestamp}-{filename}
-- Access:    Public read, staff/superadmin write.
-- ============================================

-- Create bucket if it does not exist (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'platform-assets',
  'platform-assets',
  true,
  5242880,  -- 5 MB
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;


-- Policy 1: Public read access for platform-assets
-- Anyone (including anonymous/unauthenticated) can read platform media
CREATE POLICY "platform_assets_public_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'platform-assets');


-- Policy 2: Platform staff (superadmin + staff) can upload to platform-assets
CREATE POLICY "platform_assets_staff_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'platform-assets'
    AND public.is_platform_staff()
  );


-- Policy 3: Platform staff can update files in platform-assets
CREATE POLICY "platform_assets_staff_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'platform-assets'
    AND public.is_platform_staff()
  );


-- Policy 4: Only superadmins can delete from platform-assets
CREATE POLICY "platform_assets_superadmin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'platform-assets'
    AND public.is_platform_superadmin()
  );


-- ============================================
-- BUCKET 2: org-assets
-- ============================================
-- Used for: organization media (logos, branding), guides (PDFs/docs),
--           employee avatars, analysis documents.
-- Structure: {organization_id}/media/..., {organization_id}/guides/..., etc.
-- Access:    Public read, org members read, org_admin + staff write.
--            The first path segment is always the organization_id.
-- ============================================

-- Create bucket if it does not exist (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'org-assets',
  'org-assets',
  true,
  10485760,  -- 10 MB
  ARRAY[
    'image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;


-- Policy 1: Public read access for org-assets
-- Org assets (logos, branding, guides) need to be publicly accessible via URL
CREATE POLICY "org_assets_public_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'org-assets');


-- Policy 2: Org admins can upload files scoped to their organization
-- The storage path must start with their organization_id
CREATE POLICY "org_assets_org_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'org-assets'
    AND (
      public.is_org_admin_for_path(name)
      OR public.is_platform_staff()
    )
  );


-- Policy 3: Org admins can update files within their organization scope
CREATE POLICY "org_assets_org_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'org-assets'
    AND (
      public.is_org_admin_for_path(name)
      OR public.is_platform_staff()
    )
  );


-- Policy 4: Org admins can delete files within their organization scope
-- Platform staff (superadmin/staff) can also delete
CREATE POLICY "org_assets_org_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'org-assets'
    AND (
      public.is_org_admin_for_path(name)
      OR public.is_platform_staff()
    )
  );
