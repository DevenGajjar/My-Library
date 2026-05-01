CREATE TABLE public.saved_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  image_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  title TEXT,
  source TEXT,
  source_url TEXT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(device_id, image_id)
);

CREATE INDEX idx_saved_images_device ON public.saved_images(device_id, created_at DESC);

ALTER TABLE public.saved_images ENABLE ROW LEVEL SECURITY;

-- Public app with anonymous device id; allow all operations.
-- (Device id acts as an opaque identifier; no PII stored.)
CREATE POLICY "Anyone can view saved images"
  ON public.saved_images FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert saved images"
  ON public.saved_images FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can delete saved images"
  ON public.saved_images FOR DELETE
  USING (true);