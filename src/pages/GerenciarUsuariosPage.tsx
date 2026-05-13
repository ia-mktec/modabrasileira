import { useEffect, useState } from "react";
import { PageLoading } from "@/components/shared/PageLoading";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Trash2, KeyRound, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [resetTarget, setResetTarget] = useState<UserWithRoles | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [resetting, setResetting] = useState(false);

  const openReset = (u: UserWithRoles) => {
    setResetTarget(u);
    setNewPassword("");
    setConfirmPassword("");
    setShowPwd(false);
  };

  const submitReset = async () => {
    if (!resetTarget) return;
    if (newPassword.length < 8) {
      toast({ title: "Senha inválida", description: "A senha deve ter pelo menos 8 caracteres.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Senhas diferentes", description: "A confirmação não confere com a nova senha.", variant: "destructive" });
      return;
    }
    setResetting(true);
    const { data, error } = await supabase.functions.invoke("admin-reset-password", {
      body: { user_id: resetTarget.id, new_password: newPassword },
    });
    setResetting(false);
    if (error || (data as any)?.error) {
      toast({ title: "Erro", description: (data as any)?.error || error?.message || "Falha ao redefinir senha", variant: "destructive" });
      return;
    }
    toast({ title: "Senha redefinida", description: `Nova senha definida para ${resetTarget.full_name || resetTarget.email}.` });
    setResetTarget(null);
  };

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

    setSelectedRole((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });

    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil adicionado" });
    }
    // Delay refetch to allow Radix portal to fully unmount
    setTimeout(() => fetchUsers(), 100);
  };

  const removeRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil removido" });
    }
    setTimeout(() => fetchUsers(), 100);
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
            <PageLoading fullPage={false} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfis</TableHead>
                  <TableHead>Adicionar Perfil</TableHead>
                  <TableHead className="text-right">Senha</TableHead>
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
                          key={`select-${u.id}-${u.roles.join(",")}`}
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
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openReset(u)} className="gap-1">
                        <KeyRound className="w-3.5 h-3.5" /> Redefinir
                      </Button>
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
