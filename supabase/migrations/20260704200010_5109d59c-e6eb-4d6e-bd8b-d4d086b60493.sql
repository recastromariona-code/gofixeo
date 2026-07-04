
-- Enum roles
CREATE TYPE public.user_role AS ENUM ('client', 'provider');
CREATE TYPE public.request_status AS ENUM ('pending', 'quoted', 'accepted', 'completed', 'cancelled');

-- Categories (seed data)
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are public" ON public.categories FOR SELECT USING (true);

INSERT INTO public.categories (slug, name, description, icon, sort_order) VALUES
  ('aires-acondicionados', 'Aires Acondicionados', 'Instalación y mantenimiento de aires acondicionados', 'Wind', 1),
  ('electricistas', 'Electricistas', 'Instalaciones y reparaciones eléctricas', 'Zap', 2),
  ('fontaneria', 'Fontanería', 'Reparación de tuberías, grifos y desagües', 'Droplet', 3),
  ('albanileria', 'Albañilería', 'Construcción, remodelación y reparaciones', 'Hammer', 4),
  ('pintura', 'Pintura', 'Pintura interior y exterior', 'PaintBucket', 5),
  ('carpinteria', 'Carpintería', 'Muebles a medida, puertas y ventanas', 'Axe', 6),
  ('jardineria', 'Jardinería', 'Mantenimiento de jardines y paisajismo', 'Sprout', 7),
  ('refrigeracion', 'Refrigeración', 'Técnicos en refrigeración comercial y residencial', 'Snowflake', 8),
  ('mantenimiento', 'Mantenimiento general', 'Servicios de mantenimiento del hogar', 'Wrench', 9);

-- Profiles (base user data)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  city TEXT,
  avatar_url TEXT,
  role public.user_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Provider details
CREATE TABLE public.providers (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio TEXT,
  years_experience INT DEFAULT 0,
  certifications TEXT[],
  gallery_urls TEXT[],
  service_areas TEXT[],
  rating NUMERIC(3,2) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  whatsapp_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.providers TO anon, authenticated;
GRANT INSERT, UPDATE ON public.providers TO authenticated;
GRANT ALL ON public.providers TO service_role;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Providers are public" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Providers manage self" ON public.providers FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Provider categories (many-to-many)
CREATE TABLE public.provider_categories (
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (provider_id, category_id)
);
GRANT SELECT ON public.provider_categories TO anon, authenticated;
GRANT INSERT, DELETE ON public.provider_categories TO authenticated;
GRANT ALL ON public.provider_categories TO service_role;
ALTER TABLE public.provider_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read pc" ON public.provider_categories FOR SELECT USING (true);
CREATE POLICY "Provider manages own pc" ON public.provider_categories FOR ALL USING (auth.uid() = provider_id) WITH CHECK (auth.uid() = provider_id);

-- Services
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  title TEXT NOT NULL,
  description TEXT,
  starting_price NUMERIC(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.services(category_id);
CREATE INDEX ON public.services(provider_id);
GRANT SELECT ON public.services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read services" ON public.services FOR SELECT USING (is_active OR auth.uid() = provider_id);
CREATE POLICY "Provider manages own services" ON public.services FOR ALL USING (auth.uid() = provider_id) WITH CHECK (auth.uid() = provider_id);

-- Quote requests
CREATE TABLE public.quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id),
  description TEXT NOT NULL,
  address TEXT,
  preferred_date DATE,
  status public.request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.quote_requests(client_id);
CREATE INDEX ON public.quote_requests(provider_id);
GRANT SELECT, INSERT, UPDATE ON public.quote_requests TO authenticated;
GRANT ALL ON public.quote_requests TO service_role;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties can view requests" ON public.quote_requests FOR SELECT USING (auth.uid() = client_id OR auth.uid() = provider_id);
CREATE POLICY "Client creates requests" ON public.quote_requests FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Parties can update" ON public.quote_requests FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = provider_id);

-- Quotes
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  notes TEXT,
  estimated_days INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quote parties view" ON public.quotes FOR SELECT USING (
  auth.uid() = provider_id OR
  auth.uid() = (SELECT client_id FROM public.quote_requests WHERE id = request_id)
);
CREATE POLICY "Provider creates quote" ON public.quotes FOR INSERT WITH CHECK (auth.uid() = provider_id);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.messages(request_id);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties see messages" ON public.messages FOR SELECT USING (
  auth.uid() IN (
    SELECT client_id FROM public.quote_requests WHERE id = request_id
    UNION SELECT provider_id FROM public.quote_requests WHERE id = request_id
  )
);
CREATE POLICY "Parties send messages" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND auth.uid() IN (
    SELECT client_id FROM public.quote_requests WHERE id = request_id
    UNION SELECT provider_id FROM public.quote_requests WHERE id = request_id
  )
);

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.quote_requests(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, request_id)
);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are public" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Client writes review" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Favorites
CREATE TABLE public.favorites (
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (client_id, provider_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Client sees own favs" ON public.favorites FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Client manages own favs" ON public.favorites FOR ALL USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);

-- Auto profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'client')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update rating when review added
CREATE OR REPLACE FUNCTION public.update_provider_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.providers
  SET rating = (SELECT COALESCE(AVG(rating),0) FROM public.reviews WHERE provider_id = NEW.provider_id),
      reviews_count = (SELECT COUNT(*) FROM public.reviews WHERE provider_id = NEW.provider_id)
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_review_created
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_provider_rating();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER providers_touch BEFORE UPDATE ON public.providers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER requests_touch BEFORE UPDATE ON public.quote_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
