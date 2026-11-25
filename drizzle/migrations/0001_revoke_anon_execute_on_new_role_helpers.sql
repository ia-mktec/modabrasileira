REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_access_any_route(uuid, text[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_edit_any_route(uuid, text[]) FROM anon;