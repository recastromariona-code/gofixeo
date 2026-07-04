
-- Extend providers table with richer profile fields
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS hourly_rate_min numeric(10,2),
  ADD COLUMN IF NOT EXISTS hourly_rate_max numeric(10,2),
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS availability text;

-- Portfolio items (past work)
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  image_url text,
  project_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.portfolio_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_items TO authenticated;
GRANT ALL ON public.portfolio_items TO service_role;

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Portfolio items are public" ON public.portfolio_items
  FOR SELECT USING (true);

CREATE POLICY "Provider manages own portfolio" ON public.portfolio_items
  FOR ALL USING (auth.uid() = provider_id) WITH CHECK (auth.uid() = provider_id);

CREATE TRIGGER portfolio_items_touch BEFORE UPDATE ON public.portfolio_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS portfolio_items_provider_id_idx ON public.portfolio_items(provider_id);

-- Storage policies for provider-media bucket
-- Path convention: {provider_id}/gallery/{filename} or {provider_id}/portfolio/{filename}

CREATE POLICY "Anyone can view provider media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'provider-media');

CREATE POLICY "Providers upload own media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'provider-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Providers update own media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'provider-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Providers delete own media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'provider-media' AND (storage.foldername(name))[1] = auth.uid()::text);
