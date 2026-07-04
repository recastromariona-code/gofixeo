
-- Fix search_path and revoke public execute on internal SECURITY DEFINER functions
ALTER FUNCTION public.touch_updated_at() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_provider_rating() FROM PUBLIC, anon, authenticated;
