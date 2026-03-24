import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { canEditRoute, getRoutePermission } from "@/lib/permissions";
import { ViewOnlyBanner } from "@/components/shared/ViewOnlyBanner";

export function AppLayout() {
  const { roles } = useAuth();
  const location = useLocation();
  const permission = getRoutePermission(location.pathname, roles);
  const isViewOnly = permission === "view";

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        {isViewOnly && (
          <div className="px-6 pt-6">
            <ViewOnlyBanner />
          </div>
        )}
        <div className={isViewOnly ? "pointer-events-none opacity-90 select-none" : ""}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
