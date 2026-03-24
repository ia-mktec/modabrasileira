import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { canEditRoute, getRoutePermission } from "@/lib/permissions";

export function usePagePermission() {
  const { roles } = useAuth();
  const location = useLocation();
  const route = location.pathname;

  const permission = getRoutePermission(route, roles);
  const canEdit = canEditRoute(route, roles);
  const isViewOnly = permission === "view";

  return { canEdit, isViewOnly, permission };
}
