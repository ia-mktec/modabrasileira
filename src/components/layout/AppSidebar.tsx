import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Scissors,
  Shirt,
  Layers,
  Users,
  Package,
  TruckIcon,
  Settings,
  ChevronLeft,
  ChevronRight,
  Factory,
  PackageCheck,
  HandCoins,
  BarChart3,
  DollarSign,
  Warehouse,
  Menu,
  LogOut,
  ShieldCheck,
  Lock,
  Eye,
  ClipboardList,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessRoute, canEditRoute } from "@/lib/permissions";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LanguageSwitcher } from "./LanguageSwitcher";

const navItems = [
  { to: "/", icon: LayoutDashboard, labelKey: "sidebar.dashboard" },
  { to: "/tecidos", icon: Layers, labelKey: "sidebar.tecidos" },
  { to: "/estoque-tecidos", icon: Warehouse, labelKey: "sidebar.estoqueTecidos" },
  { to: "/modelos", icon: Shirt, labelKey: "sidebar.modelos" },
  { to: "/pedidos", icon: ClipboardList, labelKey: "sidebar.pedidos" },
  { to: "/corte", icon: Scissors, labelKey: "sidebar.corte" },
  { to: "/expedicao", icon: TruckIcon, labelKey: "sidebar.expedicao" },
  { to: "/recebimento", icon: PackageCheck, labelKey: "sidebar.recebimento" },
  { to: "/entrega-cliente", icon: HandCoins, labelKey: "sidebar.acabamento" },
  { to: "/relatorio-clientes", icon: BarChart3, labelKey: "sidebar.relatorioClientes" },
  { to: "/relatorio-producao", icon: Factory, labelKey: "sidebar.fluxoProducao" },
  { to: "/cash-flow", icon: DollarSign, labelKey: "sidebar.cashFlow" },
  { to: "/cadastro", icon: Users, labelKey: "sidebar.cadastro" },
  { to: "/aviamentos", icon: Package, labelKey: "sidebar.aviamentos" },
];

function SidebarContent({ collapsed, setCollapsed, onNavigate }: { collapsed: boolean; setCollapsed?: (v: boolean) => void; onNavigate?: () => void }) {
  const { roles, signOut, user, isDev } = useAuth();
  const { t } = useTranslation();

  const accessibleItems = navItems.filter((item) => canAccessRoute(item.to, roles));

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[hsl(var(--sidebar-primary))]">
          <Factory className="w-5 h-5 text-[hsl(var(--sidebar-primary-foreground))]" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-[hsl(var(--sidebar-primary-foreground))] tracking-wide">
              {t("sidebar.appName")}
            </h1>
            <p className="text-[10px] text-[hsl(var(--sidebar-foreground))] opacity-60">
              {user?.email}
            </p>
          </div>
        )}
      </div>

      {/* Language switcher */}
      <div className="px-2 pt-2 border-b border-[hsl(var(--sidebar-border))] pb-2">
        <LanguageSwitcher collapsed={collapsed} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {accessibleItems.map((item) => {
          const isEditMode = canEditRoute(item.to, roles);
          const label = t(item.labelKey);
          const link = (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex flex-row items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full whitespace-nowrap min-w-0",
                  "hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]",
                  isActive
                    ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))] shadow-sm"
                    : "text-[hsl(var(--sidebar-foreground))]",
                  collapsed && "justify-center px-2"
                )
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <span className="flex-1 truncate">{label}</span>
              )}
              {!collapsed && (
                isEditMode ? (
                  <Settings className="w-3.5 h-3.5 opacity-40 shrink-0" />
                ) : (
                  <Eye className="w-3.5 h-3.5 opacity-40 shrink-0" />
                )
              )}
            </NavLink>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.to} delayDuration={300}>
                <TooltipTrigger asChild>
                  <div>{link}</div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {label} {isEditMode ? t("common.editMode") : t("common.viewMode")}
                </TooltipContent>
              </Tooltip>
            );
          }

          return link;
        })}
      </nav>

      {/* Collapse toggle - desktop only */}
      {setCollapsed && (
        <div className="px-2 py-3 border-t border-[hsl(var(--sidebar-border))]">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full py-2 rounded-lg hover:bg-[hsl(var(--sidebar-accent))] transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      {/* Bottom actions */}
      <div className="px-2 pb-4 space-y-1">
        {isDev && (
          <NavLink
            to="/gerenciar-usuarios"
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                "hover:bg-[hsl(var(--sidebar-accent))]",
                isActive ? "text-[hsl(var(--sidebar-primary))]" : "",
                collapsed && "justify-center px-2"
              )
            }
          >
            <ShieldCheck className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{t("sidebar.gerenciarUsuarios")}</span>}
          </NavLink>
        )}
        <button
          onClick={signOut}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full",
            "hover:bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))]",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>{t("sidebar.signOut")}</span>}
        </button>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMobileOpen(false);
  }, []);

  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-3 left-3 z-50 bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] rounded-lg shadow-lg h-10 w-10"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="p-0 w-[260px] bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] border-[hsl(var(--sidebar-border))]"
          >
            <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 border-r transition-all duration-300 overflow-hidden",
        "bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] border-[hsl(var(--sidebar-border))]",
        collapsed ? "w-[68px] min-w-[68px]" : "w-[240px] min-w-[240px]"
      )}
    >
      <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
    </aside>
  );
}
