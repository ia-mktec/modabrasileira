import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

type Permission = "edit" | "view";

// Route -> which roles can edit, which can view
const routePermissions: Record<string, Partial<Record<AppRole, Permission>>> = {
  "/": {
    corte: "view",
    modelagem: "view",
    gestao: "view",
    dev: "edit",
  },
  "/tecidos": {
    corte: "edit",
    dev: "edit",
  },
  "/estoque-tecidos": {
    corte: "edit",
    gestao: "view",
    dev: "edit",
  },
  "/modelos": {
    corte: "view",
    modelagem: "edit",
    expedicao: "edit",
    gestao: "view",
    dev: "edit",
  },
  "/corte": {
    corte: "edit",
    modelagem: "view",
    expedicao: "view",
    recebimento: "view",
    dev: "edit",
  },
  "/cadastro": {
    corte: "edit",
    modelagem: "edit",
    expedicao: "edit",
    gestao: "edit",
    dev: "edit",
  },
  "/aviamentos": {
    corte: "edit",
    modelagem: "edit",
    expedicao: "edit",
    gestao: "edit",
    dev: "edit",
  },
  "/expedicao": {
    expedicao: "edit",
    recebimento: "view",
    gestao: "edit",
    dev: "edit",
  },
  "/recebimento": {
    recebimento: "edit",
    acabamento: "view",
    dev: "edit",
  },
  "/entrega-cliente": {
    acabamento: "edit",
    dev: "edit",
  },
  "/relatorio-clientes": {
    gestao: "view",
    dev: "edit",
  },
  "/relatorio-producao": {
    corte: "view",
    modelagem: "view",
    expedicao: "view",
    recebimento: "view",
    acabamento: "view",
    gestao: "view",
    dev: "edit",
  },
  "/cash-flow": {
    gestao: "view",
    dev: "edit",
  },
  "/ficha-ziper": {
    dev: "edit",
  },
  "/gerenciar-usuarios": {
    dev: "edit",
  },
};

export function getRoutePermission(route: string, roles: AppRole[]): Permission | null {
  const perms = routePermissions[route];
  if (!perms) return null;

  // Dev has full access
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
