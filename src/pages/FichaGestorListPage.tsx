import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/fetch-all-rows";
import { formatDateBR } from "@/lib/utils";
import { PageLoading } from "@/components/shared/PageLoading";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, FileText } from "lucide-react";

interface Row {
  numero_pedido: string;
  cliente: string | null;
  modelo_ref: string;
  data_pedido: string | null;
  status_kanban: string | null;
}

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function FichaGestorListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [ocsByPedido, setOcsByPedido] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: pedidos }, { data: ocs }] = await Promise.all([
        fetchAllRows<Row>((f, to) =>
          supabase
            .from("modelo_pedidos")
            .select("numero_pedido, cliente, modelo_ref, data_pedido, status_kanban")
            .order("data_pedido", { ascending: false })
            .range(f, to),
        ),
        fetchAllRows<{ numero: string; numero_pedido: string | null }>((f, to) =>
          supabase.from("ordens_corte").select("numero, numero_pedido").range(f, to),
        ),
      ]);
      const map: Record<string, string[]> = {};
      (ocs || []).forEach((o) => {
        if (!o.numero_pedido) return;
        (map[o.numero_pedido] ||= []).push(o.numero);
      });
      setOcsByPedido(map);
      setRows(pedidos || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!busca.trim()) return rows;
    const q = norm(busca);
    return rows.filter((r) => {
      const ocs = (ocsByPedido[r.numero_pedido] || []).join(" ");
      return [r.numero_pedido, r.cliente || "", r.modelo_ref, ocs]
        .some((v) => norm(v).includes(q));
    });
  }, [rows, busca, ocsByPedido]);

  if (loading) return <PageLoading message={t("common.loading")} />;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="bg-[hsl(217,71%,25%)] text-white rounded-t-lg px-6 py-3 text-center">
        <h1 className="text-xl md:text-2xl font-bold tracking-wide font-mono flex items-center justify-center gap-2">
          <FileText className="w-5 h-5" /> {t("fichaGestor.title")}
        </h1>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t("fichaGestor.searchPlaceholder")}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-3 py-2">{t("fichaGestor.cols.pedido")}</th>
                  <th className="text-left px-3 py-2">{t("fichaGestor.cols.cliente")}</th>
                  <th className="text-left px-3 py-2">{t("fichaGestor.cols.referencia")}</th>
                  <th className="text-left px-3 py-2">{t("fichaGestor.cols.data")}</th>
                  <th className="text-left px-3 py-2">{t("fichaGestor.cols.ocs")}</th>
                  <th className="text-left px-3 py-2">{t("fichaGestor.cols.status")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.numero_pedido}
                    className="border-b hover:bg-muted/30 cursor-pointer"
                    onClick={() => navigate(`/ficha-gestor/${r.numero_pedido}`)}
                  >
                    <td className="px-3 py-2 font-mono font-semibold text-primary">{r.numero_pedido}</td>
                    <td className="px-3 py-2">{r.cliente || "—"}</td>
                    <td className="px-3 py-2">{r.modelo_ref}</td>
                    <td className="px-3 py-2 font-mono">{formatDateBR(r.data_pedido)}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {(ocsByPedido[r.numero_pedido] || []).join(", ") || "—"}
                    </td>
                    <td className="px-3 py-2 capitalize">{r.status_kanban || "—"}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">{t("common.noData")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
