import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

type AppRole = Database["public"]["Enums"]["app_role"];

export type Permission = "edit" | "view";
export type RoutePermissionsMap = Record<string, Partial<Record<AppRole, Permission>>>;

// Default matrix — used until DB is loaded, and as fallback for routes not yet in DB
export const DEFAULT_ROUTE_PERMISSIONS: RoutePermissionsMap = {
  "/": { corte: "view", modelagem: "view", gestao: "view", dev: "edit" },
  "/tecidos": { corte: "edit", dev: "edit" },
  "/estoque-tecidos": { corte: "edit", gestao: "view", dev: "edit" },
  "/modelos": { corte: "view", modelagem: "edit", expedicao: "edit", gestao: "view", dev: "edit" },
  "/pedidos": { corte: "view", modelagem: "view", expedicao: "view", recebimento: "view", acabamento: "view", gestao: "view", dev: "edit" },
  "/corte": { corte: "edit", modelagem: "view", expedicao: "view", recebimento: "view", dev: "edit" },
  "/cadastro": { corte: "edit", modelagem: "edit", expedicao: "edit", gestao: "edit", dev: "edit" },
  "/aviamentos": { corte: "edit", modelagem: "edit", expedicao: "edit", gestao: "edit", dev: "edit" },
  "/expedicao": { expedicao: "edit", recebimento: "view", gestao: "edit", dev: "edit" },
  "/recebimento": { recebimento: "edit", acabamento: "view", dev: "edit" },
  "/entrega-cliente": { acabamento: "edit", dev: "edit" },
  "/relatorio-clientes": { gestao: "view", dev: "edit" },
  "/relatorio-producao": { corte: "view", modelagem: "view", expedicao: "view", recebimento: "view", acabamento: "view", gestao: "view", dev: "edit" },
  "/cash-flow": { gestao: "view", dev: "edit" },
  "/ficha-ziper": { dev: "edit" },
  "/gerenciar-usuarios": { dev: "edit" },
};

// Mutable runtime matrix — replaced once we load from DB
export let routePermissions: RoutePermissionsMap = { ...DEFAULT_ROUTE_PERMISSIONS };

const listeners = new Set<() => void>();

export function subscribeRoutePermissions(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setRoutePermissions(map: RoutePermissionsMap) {
  routePermissions = map;
  listeners.forEach((cb) => cb());
}

export async function loadRoutePermissionsFromDB(): Promise<void> {
  const { data, error } = await supabase
    .from("route_permissions")
    .select("route, role, permission");
  if (error || !data) return;
  const next: RoutePermissionsMap = {};
  for (const row of data) {
    const route = row.route as string;
    const role = row.role as AppRole;
    const perm = row.permission as Permission;
    if (!next[route]) next[route] = {};
    next[route][role] = perm;
  }
  // Ensure all known default routes exist as keys (so they appear in matrix even if no roles)
  for (const route of Object.keys(DEFAULT_ROUTE_PERMISSIONS)) {
    if (!next[route]) next[route] = {};
  }
  setRoutePermissions(next);
}

export function getRoutePermission(route: string, roles: AppRole[]): Permission | null {
  const perms = routePermissions[route];
  if (!perms) return null;

  // Dev always has full access
  if (roles.includes("dev")) return "edit";

  let bestPermission: Permission | null = null;
  for (const role of roles) {
    const perm = perms[role];
    if (perm === "edit") return "edit";
    if (perm === "view") bestPermission = "view";
  }
  return bestPermission;
}

export function canAccessRoute(route: string, roles: AppRole[]): boolean {
  if (roles.includes("dev")) return true;
  return getRoutePermission(route, roles) !== null;
}

export function canEditRoute(route: string, roles: AppRole[]): boolean {
  if (roles.includes("dev")) return true;
  return getRoutePermission(route, roles) === "edit";
}

export function getAccessibleRoutes(roles: AppRole[]): string[] {
  if (roles.includes("dev")) return Object.keys(routePermissions);
  return Object.keys(routePermissions).filter((route) => canAccessRoute(route, roles));
}
