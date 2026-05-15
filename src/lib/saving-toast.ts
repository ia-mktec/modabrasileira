import { toast } from "sonner";

/**
 * Shows a "Salvando informações..." loading toast.
 * Returns a dismiss function. Always call it when the save settles.
 *
 * Usage:
 *   const dismiss = showSaving();
 *   try { await save(); } finally { dismiss(); }
 */
export function showSaving(message = "Salvando informações..."): () => void {
  const id = toast.loading(message);
  return () => toast.dismiss(id);
}
