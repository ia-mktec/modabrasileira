import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/fetch-all-rows";
import { formatDateBR } from "@/lib/utils";
import { PageLoading } from "@/components/shared/PageLoading";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, FileSpreadsheet } from "lucide-react";
import { exportRelatorioXLSX, type RelatorioRow } from "@/lib/ficha-gestor-export";

const sb = supabase as any;
const SIZES = ["pp", "p", "m", "g", "gg", "g1", "g2", "g3"] as const;
const n = (v: any) => Number(v || 0);
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const fmt = (v: number, d = 2) => v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

interface Custos {
  ordem_corte_id: string;
  numero_pedido: string;
  custo_entretelagem: number;
  custo_acabamento: number;
  custo_tecido_servico: number;
  preco_venda: number;
  comissao_percent: number;
}

export default function FichaGestorListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [modelos, setModelos] = useState<any[]>([]);
  const [ocs, setOcs] = useState<any[]>([]);
  const [expedicoes, setExpedicoes] = useState<any[]>([]);
  const [gradeExp, setGradeExp] = useState<any[]>([]);
  const [gradeCorte, setGradeCorte] = useState<any[]>([]);
  const [aviamentos, setAviamentos] = useState<any[]>([]);
  const [recebimentos, setRecebimentos] = useState<any[]>([]);
  const [custosMap, setCustosMap] = useState<Record<string, Custos>>({});

  useEffect(() => {
    (async () => {
      const [p, m, o, e, gE, gC, av, rc, cu] = await Promise.all([
        fetchAllRows<any>((f, to) => sb.from("modelo_pedidos").select("numero_pedido, cliente, modelo_ref, data_pedido").order("data_pedido", { ascending: false }).range(f, to)),
        fetchAllRows<any>((f, to) => sb.from("modelos").select("referencia, descricao, entretela").range(f, to)),
        fetchAllRows<any>((f, to) => sb.from("ordens_corte").select("id, numero, numero_pedido, quantidade_pecas, consumo_por_peca").range(f, to)),
        fetchAllRows<any>((f, to) => sb.from("expedicao").select("id, ordem_corte_id, preco_peca").range(f, to)),
        fetchAllRows<any>((f, to) => sb.from("grade_expedicao").select("*").range(f, to)),
        fetchAllRows<any>((f, to) => sb.from("grade_corte").select("*").range(f, to)),
        fetchAllRows<any>((f, to) => sb.from("aviamentos_pedido").select("numero_pedido, preco_unitario, partes_qtde").range(f, to)),
        fetchAllRows<any>((f, to) => sb.from("recebimento").select("ordem_corte_id, data_recebimento").range(f, to)),
        fetchAllRows<Custos>((f, to) => sb.from("ficha_gestor_custos").select("*").range(f, to)),
      ]);
      setPedidos(p.data || []); setModelos(m.data || []); setOcs(o.data || []);
      setExpedicoes(e.data || []); setGradeExp(gE.data || []); setGradeCorte(gC.data || []);
      setAviamentos(av.data || []); setRecebimentos(rc.data || []);
      const cm: Record<string, Custos> = {};
      (cu.data || []).forEach((c) => (cm[c.ordem_corte_id] = c));
      setCustosMap(cm);
      setLoading(false);
    })();
  }, []);

  const pedidosByNumero = useMemo(() => {
    const m: Record<string, any> = {};
    pedidos.forEach((p) => (m[p.numero_pedido] = p));
    return m;
  }, [pedidos]);

  const modelosByRef = useMemo(() => {
    const m: Record<string, any> = {};
    modelos.forEach((x) => (m[x.referencia] = x));
    return m;
  }, [modelos]);

  // aviamentos/peça por pedido
  const aviamentosPorPecaByPedido = useMemo(() => {
    const m: Record<string, number> = {};
    aviamentos.forEach((a) => {
      m[a.numero_pedido] = (m[a.numero_pedido] || 0) + n(a.preco_unitario) * n(a.partes_qtde);
    });
    return m;
  }, [aviamentos]);

  const getCustos = (ocId: string, numero_pedido: string): Custos => custosMap[ocId] || {
    ordem_corte_id: ocId, numero_pedido,
    custo_entretelagem: 0, custo_acabamento: 0, custo_tecido_servico: 0,
    preco_venda: 0, comissao_percent: 0,
  };

  const saveCusto = async (ocId: string, numero_pedido: string, patch: Partial<Custos>) => {
    const current = getCustos(ocId, numero_pedido);
    const next = { ...current, ...patch };
    setCustosMap((mp) => ({ ...mp, [ocId]: next }));
    const { error } = await sb.from("ficha_gestor_custos").upsert({
      ordem_corte_id: ocId,
      numero_pedido,
      custo_entretelagem: next.custo_entretelagem,
      custo_acabamento: next.custo_acabamento,
      custo_tecido_servico: next.custo_tecido_servico,
      preco_venda: next.preco_venda,
      comissao_percent: next.comissao_percent,
    });
    if (error) toast({ title: t("fichaGestor.toast.errorSave"), description: error.message, variant: "destructive" });
  };

  const rows = useMemo(() => {
    return ocs
      .filter((oc) => oc.numero_pedido && pedidosByNumero[oc.numero_pedido])
      .map((oc) => {
        const pedido = pedidosByNumero[oc.numero_pedido];
        const modelo = modelosByRef[pedido.modelo_ref];
        const c = getCustos(oc.id, oc.numero_pedido);

        const exps = expedicoes.filter((e) => e.ordem_corte_id === oc.id);
        const expIds = new Set(exps.map((e) => e.id));
        const gxs = gradeExp.filter((g) => expIds.has(g.expedicao_id));
        const totalExpedido = sum(gxs.flatMap((g) => SIZES.map((s) => n((g as any)[`${s}_exp`]))));
        const gcs = gradeCorte.filter((g) => g.ordem_corte_id === oc.id);
        const totalCortado = sum(gcs.flatMap((g) => SIZES.map((s) => n((g as any)[s])))) || n(oc.quantidade_pecas);
        const quantidade = totalExpedido > 0 ? totalExpedido : totalCortado;

        let custoOficinaPeca = 0;
        if (exps.length) {
          let totalQtd = 0, totalCusto = 0;
          for (const e of exps) {
            const qtdExp = sum(gradeExp.filter((g) => g.expedicao_id === e.id).flatMap((g) => SIZES.map((s) => n((g as any)[`${s}_exp`]))));
            totalQtd += qtdExp;
            totalCusto += qtdExp * n(e.preco_peca);
          }
          custoOficinaPeca = totalQtd > 0 ? totalCusto / totalQtd : n(exps[0].preco_peca);
        }

        const aviamentosPorPeca = aviamentosPorPecaByPedido[oc.numero_pedido] || 0;
        const acabamentoPeca = n(c.custo_acabamento);
        const tecidoServicoPeca = n(c.custo_tecido_servico);
        const entretelagemPeca = modelo?.entretela ? n(c.custo_entretelagem) : 0;

        const custoTotalPeca = custoOficinaPeca + aviamentosPorPeca + acabamentoPeca + tecidoServicoPeca + entretelagemPeca;
        const precoVenda = n(c.preco_venda);
        const valorTotal = precoVenda * quantidade;
        const tecidoMontante = n(oc.consumo_por_peca) * quantidade;
        const custoFabricacaoTotal = custoOficinaPeca * quantidade;
        const aviamentosTotal = aviamentosPorPeca * quantidade;
        const acabamentoTotal = acabamentoPeca * quantidade;
        const tecidoServicoTotal = tecidoServicoPeca * quantidade;
        const entretelagemTotal = entretelagemPeca * quantidade;
        const comissaoValor = (valorTotal * n(c.comissao_percent)) / 100;
        const custoTotal = custoFabricacaoTotal + aviamentosTotal + acabamentoTotal + tecidoServicoTotal + entretelagemTotal + comissaoValor;
        const lucro = valorTotal - custoTotal;
        const media = quantidade > 0 ? lucro / quantidade : 0;

        const rcs = recebimentos.filter((r) => r.ordem_corte_id === oc.id && r.data_recebimento);
        const dataEntrega = rcs.length
          ? formatDateBR(rcs.map((r) => r.data_recebimento).sort().pop()!)
          : "—";

        return {
          ocId: oc.id,
          numero_pedido: oc.numero_pedido as string,
          ordemCorte: oc.numero as string,
          cliente: pedido.cliente || "—",
          referencia: pedido.modelo_ref as string,
          modelo: modelo?.descricao || "—",
          custoOficinaPeca,
          custoAviamentosPeca: aviamentosPorPeca,
          acabamentoPeca,
          custoTotalPeca,
          dataEntrega,
          precoVenda,
          quantidade,
          valorTotal,
          tecidoMontante,
          custoFabricacaoTotal,
          aviamentosTotal,
          comissaoPercent: n(c.comissao_percent),
          comissaoValor,
          acabamentoTotal,
          custoTotal,
          lucro,
          media,
        };
      });
  }, [ocs, pedidosByNumero, modelosByRef, expedicoes, gradeExp, gradeCorte, recebimentos, aviamentosPorPecaByPedido, custosMap]);

  const filtered = useMemo(() => {
    if (!busca.trim()) return rows;
    const q = norm(busca);
    return rows.filter((r) =>
      [r.numero_pedido, r.ordemCorte, r.cliente, r.referencia, r.modelo].some((v) => norm(String(v)).includes(q)),
    );
  }, [rows, busca]);

  const totals = useMemo(() => {
    const t = { quantidade: 0, valorTotal: 0, tecidoMontante: 0, custoFabricacaoTotal: 0, aviamentosTotal: 0, comissaoValor: 0, acabamentoTotal: 0, custoTotal: 0, lucro: 0 };
    filtered.forEach((r) => {
      t.quantidade += r.quantidade; t.valorTotal += r.valorTotal; t.tecidoMontante += r.tecidoMontante;
      t.custoFabricacaoTotal += r.custoFabricacaoTotal; t.aviamentosTotal += r.aviamentosTotal;
      t.comissaoValor += r.comissaoValor; t.acabamentoTotal += r.acabamentoTotal;
      t.custoTotal += r.custoTotal; t.lucro += r.lucro;
    });
    return t;
  }, [filtered]);

  const handleExport = () => {
    const headers = {
      ordemCorte: t("fichaGestor.report.ordemCorte"),
      cliente: t("fichaGestor.report.cliente"),
      referencia: t("fichaGestor.report.referencia"),
      modelo: t("fichaGestor.report.modelo"),
      custoOficinaPeca: t("fichaGestor.report.custoOficinaPeca"),
      custoAviamentosPeca: t("fichaGestor.report.custoAviamentosPeca"),
      acabamentoPeca: t("fichaGestor.report.acabamentoPeca"),
      custoTotalPeca: t("fichaGestor.report.custoTotalPeca"),
      dataEntrega: t("fichaGestor.report.dataEntrega"),
      precoVenda: t("fichaGestor.report.precoVenda"),
      quantidade: t("fichaGestor.report.quantidade"),
      valorTotal: t("fichaGestor.report.valorTotal"),
      tecidoMontante: t("fichaGestor.report.tecidoMontante"),
      custoFabricacaoTotal: t("fichaGestor.report.custoFabricacaoTotal"),
      aviamentosTotal: t("fichaGestor.report.aviamentosTotal"),
      comissao: t("fichaGestor.report.comissao"),
      acabamentoTotal: t("fichaGestor.report.acabamentoTotal"),
      custoTotal: t("fichaGestor.report.custoTotal"),
      lucro: t("fichaGestor.report.lucro"),
      media: t("fichaGestor.report.media"),
    };
    exportRelatorioXLSX("geral", filtered as RelatorioRow[], headers);
    toast({ title: t("fichaGestor.toast.exported") });
  };

  if (loading) return <PageLoading message={t("common.loading")} />;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="bg-[hsl(217,71%,25%)] text-white rounded-t-lg px-6 py-3 text-center">
        <h1 className="text-xl md:text-2xl font-bold tracking-wide font-mono flex items-center justify-center gap-2">
          <FileText className="w-5 h-5" /> {t("fichaGestor.title")}
        </h1>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("fichaGestor.searchPlaceholder")}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={handleExport}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          {t("fichaGestor.exportXlsx")}
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="max-h-[calc(100vh-190px)] overflow-auto">
            <table className="min-w-[2200px] w-full text-[11px] border">
              <thead className="bg-muted/50 border-b">
                <tr>
                  {[
                    "ordemCorte","cliente","referencia","modelo",
                    "custoOficinaPeca","custoAviamentosPeca","acabamentoPeca","custoTotalPeca",
                    "dataEntrega","precoVenda","quantidade","valorTotal","tecidoMontante",
                    "custoFabricacaoTotal","aviamentosTotal","comissao","acabamentoTotal",
                    "custoTotal","lucro","media",
                  ].map((k) => (
                    <th key={k} className="text-left px-2 py-2 whitespace-nowrap">{t(`fichaGestor.report.${k}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.ocId} className="border-t hover:bg-muted/30">
                    <td className="px-2 py-1 font-mono font-semibold text-primary cursor-pointer" onClick={() => navigate(`/ficha-gestor/${r.numero_pedido}`)}>{r.ordemCorte}</td>
                    <td className="px-2 py-1">{r.cliente}</td>
                    <td className="px-2 py-1">{r.referencia}</td>
                    <td className="px-2 py-1">{r.modelo}</td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(r.custoOficinaPeca)}</td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(r.custoAviamentosPeca)}</td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(r.acabamentoPeca)}</td>
                    <td className="px-2 py-1 text-right font-mono font-semibold">{fmt(r.custoTotalPeca)}</td>
                    <td className="px-2 py-1 font-mono">{r.dataEntrega}</td>
                    <td className="px-2 py-1 text-right">
                      <Input
                        type="number" step="0.01"
                        value={getCustos(r.ocId, r.numero_pedido).preco_venda}
                        onChange={(e) => saveCusto(r.ocId, r.numero_pedido, { preco_venda: Number(e.target.value) })}
                        className="h-7 w-24 text-right font-mono text-xs ml-auto"
                      />
                    </td>
                    <td className="px-2 py-1 text-right font-mono">{r.quantidade}</td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(r.valorTotal)}</td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(r.tecidoMontante)}</td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(r.custoFabricacaoTotal)}</td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(r.aviamentosTotal)}</td>
                    <td className="px-2 py-1 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Input
                          type="number" step="0.01"
                          value={getCustos(r.ocId, r.numero_pedido).comissao_percent}
                          onChange={(e) => saveCusto(r.ocId, r.numero_pedido, { comissao_percent: Number(e.target.value) })}
                          className="h-7 w-16 text-right font-mono text-xs"
                        />
                        <span className="text-[10px] text-muted-foreground">%</span>
                        <span className="font-mono text-[10px]">({fmt(r.comissaoValor)})</span>
                      </div>
                    </td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(r.acabamentoTotal)}</td>
                    <td className="px-2 py-1 text-right font-mono font-semibold">{fmt(r.custoTotal)}</td>
                    <td className={`px-2 py-1 text-right font-mono font-semibold ${r.lucro >= 0 ? "text-[hsl(142,71%,35%)]" : "text-destructive"}`}>{fmt(r.lucro)}</td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(r.media)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={20} className="text-center py-8 text-muted-foreground">{t("common.noData")}</td></tr>
                )}
                {filtered.length > 0 && (
                  <tr className="bg-muted/30 font-semibold border-t">
                    <td colSpan={10} className="px-2 py-2 text-right">{t("common.total") || "Total"}:</td>
                    <td className="px-2 py-2 text-right font-mono">{totals.quantidade}</td>
                    <td className="px-2 py-2 text-right font-mono">{fmt(totals.valorTotal)}</td>
                    <td className="px-2 py-2 text-right font-mono">{fmt(totals.tecidoMontante)}</td>
                    <td className="px-2 py-2 text-right font-mono">{fmt(totals.custoFabricacaoTotal)}</td>
                    <td className="px-2 py-2 text-right font-mono">{fmt(totals.aviamentosTotal)}</td>
                    <td className="px-2 py-2 text-right font-mono">{fmt(totals.comissaoValor)}</td>
                    <td className="px-2 py-2 text-right font-mono">{fmt(totals.acabamentoTotal)}</td>
                    <td className="px-2 py-2 text-right font-mono">{fmt(totals.custoTotal)}</td>
                    <td className={`px-2 py-2 text-right font-mono ${totals.lucro >= 0 ? "text-[hsl(142,71%,35%)]" : "text-destructive"}`}>{fmt(totals.lucro)}</td>
                    <td className="px-2 py-2 text-right font-mono">{fmt(totals.quantidade ? totals.lucro / totals.quantidade : 0)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
