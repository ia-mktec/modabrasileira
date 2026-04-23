import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessRoute } from "@/lib/permissions";

export function ProtectedRoute() {
  const { user, loading, roles } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Block users with no roles or no permission for the current route
  const route = location.pathname;
  // Allow the user-management page check to be handled inside that page (dev-only)
  // For all other routes, enforce permission matrix
  if (route !== "/gerenciar-usuarios" && !canAccessRoute(route, roles)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Acesso negado</h1>
        <p className="text-muted-foreground max-w-md">
          {roles.length === 0
            ? "Sua conta ainda não possui um perfil atribuído. Solicite ao administrador (Dev) que defina seu perfil de acesso."
            : "Seu perfil não tem permissão para acessar esta página."}
        </p>
      </div>
    );
  }

  return <Outlet />;
}
