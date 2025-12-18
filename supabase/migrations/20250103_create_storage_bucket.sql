-- Migration to create Supabase Storage Bucket for Study Materials
-- 2025-01-03

-- Note: In managed Supabase, direct SQL for storage is often restricted or requires specific roles.
-- However, standard postgres-meta extension usually allows this.
-- If this fails, the user must manually create a bucket named 'study_materials' in the dashboard.

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('study_materials', 'study_materials', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: Authenticated users can upload
CREATE POLICY "Authenticated users can upload study materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'study_materials'
    AND (storage.foldername(name))[1]::uuid = auth.uid()
);

-- 3. Policy: Authenticated users can read their own study materials
-- (Or public read if we want them to be accessible via public URL easily,
-- but strictly we should probably secure them. The current code uses getPublicUrl though, so 'public' is easier.)
-- Since we set public=true in bucket, we just need to allow SELECT on objects.
CREATE POLICY "Authenticated users can select own study materials"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'study_materials'
    AND (storage.foldername(name))[1]::uuid = auth.uid()
);

-- 4. Policy: Authenticated users can delete own study materials
CREATE POLICY "Authenticated users can delete own study materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'study_materials'
    AND (storage.foldername(name))[1]::uuid = auth.uid()
);
