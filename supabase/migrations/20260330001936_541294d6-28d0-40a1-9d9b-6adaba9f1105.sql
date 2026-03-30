-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('produtos', 'produtos', true);

-- Allow authenticated users to upload
CREATE POLICY "Auth users can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'produtos');

-- Allow public read access
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'produtos');

-- Allow authenticated users to update/delete their uploads
CREATE POLICY "Auth users can update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'produtos');

CREATE POLICY "Auth users can delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'produtos');