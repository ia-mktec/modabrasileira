import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, UserPlus, Mail, Lock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import mktecLogo from "@/assets/mktec-logo.jpg";

export default function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a2332]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b82c4]" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Conta criada!", description: "Verifique seu email para confirmar o cadastro." });
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex bg-[#1a2332]">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        {/* Animated background circles */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2a4a6b]/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#3b82c4]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#1e3a5f]/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center px-12">
          <div className="mb-8 flex justify-center">
            <div className="w-40 h-40 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center p-4 shadow-2xl">
              <img src={mktecLogo} alt="MKTEC Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
            MKTEC <span className="text-[#3b82c4]">Flow</span>
          </h1>
          <p className="text-[#8ba4c0] text-lg leading-relaxed max-w-sm mx-auto">
            Sistema integrado de gestão de produção têxtil
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-xs mx-auto">
            {["Corte", "Expedição", "Estoque"].map((item) => (
              <div key={item} className="text-center">
                <div className="w-12 h-12 mx-auto rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-2">
                  <div className="w-3 h-3 rounded-full bg-[#3b82c4]" />
                </div>
                <span className="text-xs text-[#6b8ab0]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center p-3 mb-4 shadow-xl">
              <img src={mktecLogo} alt="MKTEC Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              MKTEC <span className="text-[#3b82c4]">Flow</span>
            </h1>
          </div>

          <div className="bg-[#1e2d3d] rounded-2xl border border-[#2a3d52] p-8 shadow-2xl">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white">
                {isSignUp ? "Criar conta" : "Bem-vindo de volta"}
              </h2>
              <p className="text-[#6b8ab0] mt-2 text-sm">
                {isSignUp ? "Preencha os dados para criar sua conta" : "Entre com suas credenciais para continuar"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-[#8ba4c0] text-sm font-medium">
                    Nome completo
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a6a8a]" />
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome"
                      required
                      className="pl-10 bg-[#162231] border-[#2a3d52] text-white placeholder:text-[#4a6a8a] focus:border-[#3b82c4] focus:ring-[#3b82c4]/20 h-11 rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#8ba4c0] text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a6a8a]" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="pl-10 bg-[#162231] border-[#2a3d52] text-white placeholder:text-[#4a6a8a] focus:border-[#3b82c4] focus:ring-[#3b82c4]/20 h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#8ba4c0] text-sm font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a6a8a]" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="pl-10 bg-[#162231] border-[#2a3d52] text-white placeholder:text-[#4a6a8a] focus:border-[#3b82c4] focus:ring-[#3b82c4]/20 h-11 rounded-xl"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-[#3b82c4] hover:bg-[#2d6da8] text-white font-semibold text-sm shadow-lg shadow-[#3b82c4]/20 transition-all duration-200"
                disabled={submitting}
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : isSignUp ? (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" /> Criar conta
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" /> Entrar
                  </>
                )}
              </Button>

              {!isSignUp && (
                <div className="text-center">
                  <Link to="/forgot-password" className="text-sm text-[#3b82c4] hover:text-[#5a9ed6] transition-colors">
                    Esqueceu a senha?
                  </Link>
                </div>
              )}
            </form>

            <div className="mt-6 pt-6 border-t border-[#2a3d52] text-center">
              <button
                type="button"
                className="text-sm text-[#6b8ab0] hover:text-white transition-colors"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? (
                  <>Já tem conta? <span className="text-[#3b82c4] font-medium">Entrar</span></>
                ) : (
                  <>Não tem conta? <span className="text-[#3b82c4] font-medium">Criar conta</span></>
                )}
              </button>
            </div>
          </div>

          <p className="text-center text-[#4a6a8a] text-xs mt-6">
            © 2024 MKTEC Flow — Gestão de Produção Têxtil
          </p>
        </div>
      </div>
    </div>
  );
}
