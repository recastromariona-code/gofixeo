ALTER TABLE public.quote_requests
  ALTER COLUMN provider_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS budget_min numeric(10,2),
  ADD COLUMN IF NOT EXISTS budget_max numeric(10,2),
  ADD COLUMN IF NOT EXISTS urgency text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS preferred_time text,
  ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS accepted_quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Providers view matching broadcasts" ON public.quote_requests;
CREATE POLICY "Providers view matching broadcasts"
ON public.quote_requests FOR SELECT TO authenticated
USING (
  provider_id IS NULL
  AND status IN ('pending','quoted')
  AND (
    category_id IS NULL OR EXISTS (
      SELECT 1 FROM public.provider_categories pc
      WHERE pc.provider_id = auth.uid() AND pc.category_id = quote_requests.category_id
    )
  )
);

DROP POLICY IF EXISTS "Provider creates quote" ON public.quotes;
CREATE POLICY "Provider creates quote"
ON public.quotes FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = provider_id
  AND EXISTS (
    SELECT 1 FROM public.quote_requests qr
    WHERE qr.id = quotes.request_id
      AND (qr.provider_id IS NULL OR qr.provider_id = auth.uid())
      AND qr.status IN ('pending','quoted')
  )
);

DROP POLICY IF EXISTS "Quote parties view" ON public.quotes;
CREATE POLICY "Quote parties view"
ON public.quotes FOR SELECT TO authenticated
USING (
  auth.uid() = provider_id
  OR auth.uid() = (SELECT client_id FROM public.quote_requests WHERE id = quotes.request_id)
);

DROP POLICY IF EXISTS "Request photos read own" ON storage.objects;
CREATE POLICY "Request photos read own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'request-photos');

DROP POLICY IF EXISTS "Request photos upload own" ON storage.objects;
CREATE POLICY "Request photos upload own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'request-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Request photos delete own" ON storage.objects;
CREATE POLICY "Request photos delete own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'request-photos' AND auth.uid()::text = (storage.foldername(name))[1]);