import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Constants } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRoles {
  id: string;
  email: string | null;
  full_name: string | null;
  roles: AppRole[];
}

const ROLE_LABELS: Record<AppRole, string> = {
  corte: "Corte",
  modelagem: "Modelagem",
  expedicao: "Expedição",
  recebimento: "Recebimento",
  acabamento: "Acabamento",
  gestao: "Gestão",
  dev: "Dev",
};

const ROLE_COLORS: Record<AppRole, string> = {
  corte: "bg-blue-100 text-blue-800",
  modelagem: "bg-purple-100 text-purple-800",
  expedicao: "bg-orange-100 text-orange-800",
  recebimento: "bg-green-100 text-green-800",
  acabamento: "bg-pink-100 text-pink-800",
  gestao: "bg-yellow-100 text-yellow-800",
  dev: "bg-red-100 text-red-800",
};

export default function GerenciarUsuariosPage() {
  const { isDev } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Record<string, AppRole>>({});

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: roles } = await supabase.from("user_roles").select("*");

    if (profiles) {
      const usersWithRoles: UserWithRoles[] = profiles.map((p) => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        roles: (roles?.filter((r) => r.user_id === p.id).map((r) => r.role) ?? []) as AppRole[],
      }));
      setUsers(usersWithRoles);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (!isDev) return <Navigate to="/" replace />;

  const addRole = async (userId: string) => {
    const role = selectedRole[userId];
    if (!role) return;

    // Clear selection immediately to unmount Select portal before refetch
    setSelectedRole((prev) => ({ ...prev, [userId]: undefined as unknown as AppRole }));

    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil adicionado" });
    }
    await fetchUsers();
  };

  const removeRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil removido" });
    }
    await fetchUsers();
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Gerenciar Usuários"
        description="Controle de perfis e permissões de acesso"
      />

      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfis</TableHead>
                  <TableHead>Adicionar Perfil</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 && (
                          <span className="text-sm text-muted-foreground">Sem perfil</span>
                        )}
                        {u.roles.map((role) => (
                          <Badge key={role} variant="secondary" className={`${ROLE_COLORS[role]} gap-1`}>
                            {ROLE_LABELS[role]}
                            <button
                              onClick={() => removeRole(u.id, role)}
                              className="ml-1 hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={selectedRole[u.id] || ""}
                          onValueChange={(v) =>
                            setSelectedRole((prev) => ({ ...prev, [u.id]: v as AppRole }))
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Perfil" />
                          </SelectTrigger>
                          <SelectContent>
                            {Constants.public.Enums.app_role
                              .filter((r) => !u.roles.includes(r))
                              .map((r) => (
                                <SelectItem key={r} value={r}>
                                  {ROLE_LABELS[r]}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => addRole(u.id)}
                          disabled={!selectedRole[u.id]}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
