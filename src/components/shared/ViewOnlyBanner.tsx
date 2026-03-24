import { Eye } from "lucide-react";

export function ViewOnlyBanner() {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted border border-border text-muted-foreground text-sm mb-4">
      <Eye className="w-4 h-4 shrink-0" />
      <span>Você está no modo <strong>somente visualização</strong>. Edição não permitida para seu perfil.</span>
    </div>
  );
}
