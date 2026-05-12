import { Loader2 } from "lucide-react";

interface PageLoadingProps {
  message?: string;
  fullPage?: boolean;
}

export function PageLoading({ message = "Carregando...", fullPage = true }: PageLoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground font-medium">{message}</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return <div className="py-12 flex items-center justify-center">{content}</div>;
}
