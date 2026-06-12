import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/fetch-all-rows";
import { formatDateBR } from "@/lib/utils";
import { PageLoading } from "@/components/shared/PageLoading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Printer, FileSpreadsheet, FileText } from "lucide-react";
import { exportRelatorioXLSX, type RelatorioRow } from "@/lib/ficha-gestor-export";

const SIZES = ["pp", "p", "m", "g", "gg", "g1", "g2", "g3"] as const;
type SizeKey = typeof SIZES[number];

const sb = supabase as any;

interface Pedido {
  numero_pedido: string;
  cliente: string | null;
  modelo_ref: string;
  data_pedido: string | null;
  tecido: string | null;
  cor: string | null;
  consumo_tecido: number | null;
  observacoes: string | null;
  status_kanban: string | null;
}
interface Modelo {
  id: string;
  referencia: string;
  descricao: string;
  imagem_url: string | null;
  entretela: boolean | null;
  entretela_descricao: string | null;
  entretela_consumo_peca: number | null;
}
interface OC {
  id: string;
  numero: string;
  numero_pedido: string | null;
  modelo_ref: string | null;
  data_corte: string | null;
  cortador: string | null;
  enfestador: string | null;
  enfestos: number | null;
  perda_percent: number | null;
  consumo_por_peca: number | null;
  quantidade_pecas: number;
  status: string;
  observacoes: string | null;
}
type GradeCorte = { ordem_corte_id: string; cor: string } & Partial<Record<SizeKey, number | null>>;
interface Expedicao {
  id: string; ordem_corte_id: string; data_saida: string | null;
  oficina_nome: string | null; preco_peca: number | null; status: string;
}
type GradeExp = { id: string; expedicao_id: string; cor: string } &
  Partial<Record<`${SizeKey}_prod`, number | null>> &
  Partial<Record<`${SizeKey}_exp`, number | null>>;
interface Recebimento {
  id: string; expedicao_id: string; ordem_corte_id: string;
  oficina_nome: string | null; data_envio: string | null; data_recebimento: string | null;
  total_sem_defeitos: number | null; defeitos: number | null; segunda_qualidade: number | null;
  total_pagar: number | null; status: string; observacoes: string | null;
}
interface AvPedido {
  id: string; numero_pedido: string; modelo_ref: string | null;
  tipo: string | null; descricao_item: string | null; tamanho: string | null;
  cor: string | null; preco_unitario: number | null; partes_qtde: number | null;
}
interface ModAv { id: string; modelo_id: string; descricao: string | null; quantidade: number | null; unidade: string | null }
interface TecidoEntrada {
  id: string; nome_tecido: string; composicao: string | null; cor: string | null;
  data_entrada: string | null; qtde_rolos: number | null; metragem_total: number | null;
  unidade_medida: string | null; ordem_corte1: string | null; ordem_corte2: string | null;
}
interface Custos {
  ordem_corte_id: string;
  custo_entretelagem: number;
  custo_acabamento: number;
  custo_tecido_servico: number;
  preco_venda: number;
  comissao_percent: number;
}

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
const n = (v: any) => Number(v || 0);
const fmt = (v: number, d = 2) => v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

export default function FichaGestorPage() {
  const { numero } = useParams<{ numero: string }>();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [modelo, setModelo] = useState<Modelo | null>(null);
  const [ocs, setOcs] = useState<OC[]>([]);
  const [gradeCorte, setGradeCorte] = useState<GradeCorte[]>([]);
  const [expedicoes, setExpedicoes] = useState<Expedicao[]>([]);
  const [gradeExp, setGradeExp] = useState<GradeExp[]>([]);
  const [recebimentos, setRecebimentos] = useState<Recebimento[]>([]);
  const [aviamentos, setAviamentos] = useState<AvPedido[]>([]);
  const [modAviamentos, setModAviamentos] = useState<ModAv[]>([]);
  const [tecidos, setTecidos] = useState<TecidoEntrada[]>([]);
  const [custosMap, setCustosMap] = useState<Record<string, Custos>>({});

  const reload = useCallback(async () => {
    if (!numero) return;
    setLoading(true);
    const { data: pedidoData } = await sb.from("modelo_pedidos").select("*").eq("numero_pedido", numero).maybeSingle();
    if (!pedidoData) { setLoading(false); return; }
    setPedido(pedidoData);

    const { data: modeloData } = await sb.from("modelos").select("id,referencia,descricao,imagem_url,entretela,entretela_descricao,entretela_consumo_peca").eq("referencia", pedidoData.modelo_ref).maybeSingle();
    setModelo(modeloData);

    const { data: ocsData } = await sb.from("ordens_corte").select("*").eq("numero_pedido", numero);
    const ocList: OC[] = ocsData || [];
    setOcs(ocList);
    const ocIds = ocList.map((o) => o.id);
    const ocNumeros = ocList.map((o) => o.numero);

    if (ocIds.length === 0) { setLoading(false); return; }

    const [gc, exp, av, te, cu] = await Promise.all([
      sb.from("grade_corte").select("*").in("ordem_corte_id", ocIds),
      sb.from("expedicao").select("*").in("ordem_corte_id", ocIds),
      sb.from("aviamentos_pedido").select("*").eq("numero_pedido", numero),
      sb.from("tecido_entradas").select("*").or(
        ocNumeros.flatMap((n) => [`ordem_corte1.eq.${n}`, `ordem_corte2.eq.${n}`]).join(","),
      ),
      sb.from("ficha_gestor_custos").select("*").in("ordem_corte_id", ocIds),
    ]);
    setGradeCorte(gc.data || []);
    setExpedicoes(exp.data || []);
    setAviamentos(av.data || []);
    setTecidos(te.data || []);
    const cm: Record<string, Custos> = {};
    (cu.data || []).forEach((c: Custos) => (cm[c.ordem_corte_id] = c));
    setCustosMap(cm);

    const expIds = (exp.data || []).map((e: any) => e.id);
    if (expIds.length) {
      const [ge, rc] = await Promise.all([
        sb.from("grade_expedicao").select("*").in("expedicao_id", expIds),
        sb.from("recebimento").select("*").in("ordem_corte_id", ocIds),
      ]);
      setGradeExp(ge.data || []);
      setRecebimentos(rc.data || []);
    } else {
      setGradeExp([]);
      setRecebimentos([]);
    }

    if (modeloData?.id && (!av.data || av.data.length === 0)) {
      const { data: ma } = await sb.from("modelo_aviamentos").select("*").eq("modelo_id", modeloData.id);
      setModAviamentos(ma || []);
    } else {
      setModAviamentos([]);
    }

    setLoading(false);
  }, [numero]);

  useEffect(() => { reload(); }, [reload]);

  // --- helpers per OC ---
  const getCustos = (ocId: string): Custos => custosMap[ocId] || {
    ordem_corte_id: ocId, custo_entretelagem: 0, custo_acabamento: 0,
    custo_tecido_servico: 0, preco_venda: 0, comissao_percent: 0,
  };

  const saveCusto = async (ocId: string, patch: Partial<Custos>) => {
    if (!numero) return;
    const current = getCustos(ocId);
    const next = { ...current, ...patch };
    setCustosMap((m) => ({ ...m, [ocId]: next }));
    const { error } = await sb.from("ficha_gestor_custos").upsert({
      ordem_corte_id: ocId,
      numero_pedido: numero,
      custo_entretelagem: next.custo_entretelagem,
      custo_acabamento: next.custo_acabamento,
      custo_tecido_servico: next.custo_tecido_servico,
      preco_venda: next.preco_venda,
      comissao_percent: next.comissao_percent,
    });
    if (error) toast({ title: t("fichaGestor.toast.errorSave"), description: error.message, variant: "destructive" });
  };

  const updateAviamentoPreco = async (id: string, preco: number) => {
    setAviamentos((arr) => arr.map((a) => a.id === id ? { ...a, preco_unitario: preco } : a));
    const { error } = await sb.from("aviamentos_pedido").update({ preco_unitario: preco }).eq("id", id);
    if (error) toast({ title: t("fichaGestor.toast.errorSave"), description: error.message, variant: "destructive" });
  };

  // --- derived data ---
  const aviamentosPorPeca = useMemo(() => {
    return sum(aviamentos.map((a) => n(a.preco_unitario) * n(a.partes_qtde)));
  }, [aviamentos]);

  const relatorio: RelatorioRow[] = useMemo(() => {
    if (!pedido) return [];
    return ocs.map((oc) => {
      const c = getCustos(oc.id);
      const exps = expedicoes.filter((e) => e.ordem_corte_id === oc.id);
      const expIds = new Set(exps.map((e) => e.id));
      const gxs = gradeExp.filter((g) => expIds.has(g.expedicao_id));
      const totalExpedido = sum(gxs.flatMap((g) => SIZES.map((s) => n((g as any)[`${s}_exp`]))));
      const gcs = gradeCorte.filter((g) => g.ordem_corte_id === oc.id);
      const totalCortado = sum(gcs.flatMap((g) => SIZES.map((s) => n((g as any)[s])))) || n(oc.quantidade_pecas);
      const quantidade = totalExpedido > 0 ? totalExpedido : totalCortado;

      // custo oficina/peça = média ponderada do preco_peca das expedições (peso = total expedido por expedição)
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
        ? formatDateBR(rcs.map((r) => r.data_recebimento!).sort().pop()!)
        : "—";

      return {
        ordemCorte: oc.numero,
        cliente: pedido.cliente || "—",
        referencia: pedido.modelo_ref,
        modelo: modelo?.descricao || "—",
        custoOficinaPeca, custoAviamentosPeca: aviamentosPorPeca,
        acabamentoPeca, custoTotalPeca,
        dataEntrega, precoVenda, quantidade, valorTotal, tecidoMontante,
        custoFabricacaoTotal, aviamentosTotal,
        comissaoPercent: n(c.comissao_percent), comissaoValor,
        acabamentoTotal, custoTotal, lucro, media,
      };
    });
  }, [ocs, pedido, modelo, expedicoes, gradeExp, gradeCorte, recebimentos, aviamentosPorPeca, custosMap]);

  const totaisRelatorio = useMemo(() => {
    const tot = {
      quantidade: 0, valorTotal: 0, tecidoMontante: 0, custoFabricacaoTotal: 0,
      aviamentosTotal: 0, comissaoValor: 0, acabamentoTotal: 0, custoTotal: 0, lucro: 0,
    };
    relatorio.forEach((r) => {
      tot.quantidade += r.quantidade;
      tot.valorTotal += r.valorTotal;
      tot.tecidoMontante += r.tecidoMontante;
      tot.custoFabricacaoTotal += r.custoFabricacaoTotal;
      tot.aviamentosTotal += r.aviamentosTotal;
      tot.comissaoValor += r.comissaoValor;
      tot.acabamentoTotal += r.acabamentoTotal;
      tot.custoTotal += r.custoTotal;
      tot.lucro += r.lucro;
    });
    return tot;
  }, [relatorio]);

  const handleExport = () => {
    if (!pedido) return;
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
    exportRelatorioXLSX(pedido.numero_pedido, relatorio, headers);
    toast({ title: t("fichaGestor.toast.exported") });
  };

  if (loading) return <PageLoading message={t("common.loading")} />;
  if (!pedido) return <div className="p-6">{t("fichaGestor.notFound")}</div>;

  const lista = aviamentos.length > 0 ? aviamentos : modAviamentos.map((m) => ({
    id: m.id, numero_pedido: pedido.numero_pedido, modelo_ref: pedido.modelo_ref,
    tipo: null, descricao_item: m.descricao, tamanho: m.unidade, cor: null,
    preco_unitario: 0, partes_qtde: m.quantidade,
  } as AvPedido));

  return (
    <div className="p-4 md:p-6 space-y-4 print:p-2 print:space-y-2">
      {/* Top bar (hidden on print) */}
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button variant="outline" asChild>
          <Link to="/ficha-gestor"><ArrowLeft className="w-4 h-4 mr-2" />{t("common.back")}</Link>
        </Button>
        <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />{t("common.print")}</Button>
        <Button onClick={handleExport}><FileSpreadsheet className="w-4 h-4 mr-2" />{t("fichaGestor.exportXlsx")}</Button>
      </div>

      {/* Header */}
      <div className="bg-[hsl(217,71%,25%)] text-white rounded-t-lg px-6 py-3 text-center print:bg-white print:text-black print:border-b-2 print:border-black">
        <h1 className="text-xl md:text-2xl font-bold tracking-wide font-mono flex items-center justify-center gap-2">
          <FileText className="w-5 h-5" /> {t("fichaGestor.title")} — {pedido.numero_pedido}
        </h1>
      </div>

      {/* Cabeçalho do pedido */}
      <Card className="break-inside-avoid">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
          <div className="bg-muted rounded overflow-hidden flex items-center justify-center aspect-square">
            {modelo?.imagem_url ? (
              <img src={modelo.imagem_url} alt={pedido.modelo_ref} className="w-full h-full object-contain" />
            ) : <span className="text-xs text-muted-foreground">{t("fichaGestor.noImage")}</span>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <Field label={t("fichaGestor.pedido.numero")} value={pedido.numero_pedido} mono />
            <Field label={t("fichaGestor.pedido.cliente")} value={pedido.cliente || "—"} />
            <Field label={t("fichaGestor.pedido.data")} value={formatDateBR(pedido.data_pedido)} mono />
            <Field label={t("fichaGestor.pedido.referencia")} value={pedido.modelo_ref} mono />
            <Field label={t("fichaGestor.pedido.modelo")} value={modelo?.descricao || "—"} />
            <Field label={t("fichaGestor.pedido.status")} value={pedido.status_kanban || "—"} />
            <Field label={t("fichaGestor.pedido.tecido")} value={pedido.tecido || "—"} />
            <Field label={t("fichaGestor.pedido.cor")} value={pedido.cor || "—"} />
            <Field label={t("fichaGestor.pedido.consumo")} value={`${fmt(n(pedido.consumo_tecido), 3)} mt`} mono />
            {pedido.observacoes && (
              <div className="col-span-full">
                <div className="text-xs text-muted-foreground">{t("fichaGestor.pedido.observacoes")}</div>
                <div>{pedido.observacoes}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {ocs.length === 0 && (
        <Card><CardContent className="p-6 text-center text-muted-foreground">{t("fichaGestor.noOCs")}</CardContent></Card>
      )}

      {/* Bloco por OC */}
      {ocs.map((oc) => {
        const exps = expedicoes.filter((e) => e.ordem_corte_id === oc.id);
        const gcs = gradeCorte.filter((g) => g.ordem_corte_id === oc.id);
        const tecs = tecidos.filter((tx) => tx.ordem_corte1 === oc.numero || tx.ordem_corte2 === oc.numero);
        const rcs = recebimentos.filter((r) => r.ordem_corte_id === oc.id);
        const custos = getCustos(oc.id);

        return (
          <Card key={oc.id} className="break-inside-avoid">
            <CardContent className="p-4 space-y-4">
              <div className="bg-muted px-3 py-2 rounded font-semibold flex items-center justify-between">
                <span>{t("fichaGestor.oc.title")}: <span className="font-mono">{oc.numero}</span></span>
                <span className="text-xs capitalize">{oc.status}</span>
              </div>

              {/* a) Dados da OC */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <Field label={t("fichaGestor.oc.dataCorte")} value={formatDateBR(oc.data_corte)} mono />
                <Field label={t("fichaGestor.oc.cortador")} value={oc.cortador || "—"} />
                <Field label={t("fichaGestor.oc.enfestador")} value={oc.enfestador || "—"} />
                <Field label={t("fichaGestor.oc.enfestos")} value={String(oc.enfestos ?? 0)} mono />
                <Field label={t("fichaGestor.oc.perda")} value={`${fmt(n(oc.perda_percent), 2)} %`} mono />
                <Field label={t("fichaGestor.oc.consumoPeca")} value={`${fmt(n(oc.consumo_por_peca), 3)} mt`} mono />
                <Field label={t("fichaGestor.oc.qtdPecas")} value={String(oc.quantidade_pecas)} mono />
                {oc.observacoes && <Field label={t("fichaGestor.pedido.observacoes")} value={oc.observacoes} />}
              </div>

              {/* b) Tecido vinculado + rolos */}
              <div>
                <h3 className="font-semibold text-sm mb-2">{t("fichaGestor.tecido.title")}</h3>
                {tecs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t("fichaGestor.tecido.empty")}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-2 py-1">{t("fichaGestor.tecido.nome")}</th>
                          <th className="text-left px-2 py-1">{t("fichaGestor.tecido.composicao")}</th>
                          <th className="text-left px-2 py-1">{t("fichaGestor.tecido.cor")}</th>
                          <th className="text-center px-2 py-1">{t("fichaGestor.tecido.data")}</th>
                          <th className="text-right px-2 py-1">{t("fichaGestor.tecido.rolos")}</th>
                          <th className="text-right px-2 py-1">{t("fichaGestor.tecido.metragem")}</th>
                          <th className="text-center px-2 py-1">{t("fichaGestor.tecido.un")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tecs.map((te) => (
                          <tr key={te.id} className="border-t">
                            <td className="px-2 py-1">{te.nome_tecido}</td>
                            <td className="px-2 py-1">{te.composicao || "—"}</td>
                            <td className="px-2 py-1">{te.cor || "—"}</td>
                            <td className="px-2 py-1 text-center font-mono">{formatDateBR(te.data_entrada)}</td>
                            <td className="px-2 py-1 text-right font-mono">{te.qtde_rolos ?? 0}</td>
                            <td className="px-2 py-1 text-right font-mono">{fmt(n(te.metragem_total), 2)}</td>
                            <td className="px-2 py-1 text-center">{te.unidade_medida || "mt"}</td>
                          </tr>
                        ))}
                        <tr className="bg-muted/30 font-semibold border-t">
                          <td colSpan={4} className="px-2 py-1 text-right">{t("common.total") || "Total"}:</td>
                          <td className="px-2 py-1 text-right font-mono">{sum(tecs.map((te) => n(te.qtde_rolos)))}</td>
                          <td className="px-2 py-1 text-right font-mono">{fmt(sum(tecs.map((te) => n(te.metragem_total))), 2)}</td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* c) Grade — expedições ou corte */}
              <div>
                <h3 className="font-semibold text-sm mb-2">{t("fichaGestor.grade.title")}</h3>
                {exps.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-2 py-1">{t("fichaGestor.grade.oficina")}</th>
                          <th className="text-center px-2 py-1">{t("fichaGestor.grade.dataSaida")}</th>
                          <th className="text-left px-2 py-1">{t("fichaGestor.tecido.cor")}</th>
                          {SIZES.map((s) => <th key={s} className="text-right px-2 py-1 uppercase">{s}</th>)}
                          <th className="text-right px-2 py-1">{t("fichaGestor.grade.total")}</th>
                          <th className="text-right px-2 py-1">{t("fichaGestor.grade.precoPeca")}</th>
                          <th className="text-right px-2 py-1">{t("fichaGestor.grade.subtotal")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exps.flatMap((e) => {
                          const rows = gradeExp.filter((g) => g.expedicao_id === e.id);
                          if (rows.length === 0) return [(
                            <tr key={e.id} className="border-t text-muted-foreground italic">
                              <td className="px-2 py-1">{e.oficina_nome || "—"}</td>
                              <td className="px-2 py-1 text-center font-mono">{formatDateBR(e.data_saida)}</td>
                              <td colSpan={SIZES.length + 4} className="px-2 py-1">{t("fichaGestor.grade.semGrade")}</td>
                            </tr>
                          )];
                          return rows.map((g) => {
                            const tot = sum(SIZES.map((s) => n((g as any)[`${s}_exp`])));
                            return (
                              <tr key={g.id} className="border-t">
                                <td className="px-2 py-1">{e.oficina_nome || "—"}</td>
                                <td className="px-2 py-1 text-center font-mono">{formatDateBR(e.data_saida)}</td>
                                <td className="px-2 py-1">{g.cor}</td>
                                {SIZES.map((s) => <td key={s} className="px-2 py-1 text-right font-mono">{n((g as any)[`${s}_exp`])}</td>)}
                                <td className="px-2 py-1 text-right font-mono font-semibold">{tot}</td>
                                <td className="px-2 py-1 text-right font-mono">{fmt(n(e.preco_peca), 2)}</td>
                                <td className="px-2 py-1 text-right font-mono">{fmt(tot * n(e.preco_peca), 2)}</td>
                              </tr>
                            );
                          });
                        })}
                        {(() => {
                          const totalExp = sum(gradeExp.filter((g) => exps.some((e) => e.id === g.expedicao_id)).flatMap((g) => SIZES.map((s) => n((g as any)[`${s}_exp`]))));
                          const totalCort = sum(gcs.flatMap((g) => SIZES.map((s) => n((g as any)[s]))));
                          return (
                            <>
                              <tr className="bg-muted/30 font-semibold border-t">
                                <td colSpan={SIZES.length + 3} className="px-2 py-1 text-right">{t("fichaGestor.grade.totalExpedido")}:</td>
                                <td className="px-2 py-1 text-right font-mono">{totalExp}</td>
                                <td colSpan={2}></td>
                              </tr>
                              <tr className="bg-muted/30 text-xs border-t">
                                <td colSpan={SIZES.length + 3} className="px-2 py-1 text-right">{t("fichaGestor.grade.saldo")} ({t("fichaGestor.grade.cortado")} {totalCort}):</td>
                                <td className="px-2 py-1 text-right font-mono">{totalCort - totalExp}</td>
                                <td colSpan={2}></td>
                              </tr>
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-muted-foreground italic mb-1">{t("fichaGestor.grade.aguardando")}</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left px-2 py-1">{t("fichaGestor.tecido.cor")}</th>
                            {SIZES.map((s) => <th key={s} className="text-right px-2 py-1 uppercase">{s}</th>)}
                            <th className="text-right px-2 py-1">{t("fichaGestor.grade.total")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gcs.map((g) => {
                            const tot = sum(SIZES.map((s) => n((g as any)[s])));
                            return (
                              <tr key={g.cor} className="border-t">
                                <td className="px-2 py-1">{g.cor}</td>
                                {SIZES.map((s) => <td key={s} className="px-2 py-1 text-right font-mono">{n((g as any)[s])}</td>)}
                                <td className="px-2 py-1 text-right font-mono font-semibold">{tot}</td>
                              </tr>
                            );
                          })}
                          {gcs.length === 0 && (
                            <tr><td colSpan={SIZES.length + 2} className="px-2 py-2 text-center text-muted-foreground">{t("common.noData")}</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* d) Recebimentos */}
              {rcs.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">{t("fichaGestor.recebimento.title")}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-2 py-1">{t("fichaGestor.grade.oficina")}</th>
                          <th className="text-center px-2 py-1">{t("fichaGestor.recebimento.dataEnvio")}</th>
                          <th className="text-center px-2 py-1">{t("fichaGestor.recebimento.dataRecebimento")}</th>
                          <th className="text-right px-2 py-1">{t("fichaGestor.recebimento.semDefeitos")}</th>
                          <th className="text-right px-2 py-1">{t("fichaGestor.recebimento.defeitos")}</th>
                          <th className="text-right px-2 py-1">{t("fichaGestor.recebimento.segunda")}</th>
                          <th className="text-right px-2 py-1">{t("fichaGestor.recebimento.totalPagar")}</th>
                          <th className="text-left px-2 py-1">{t("fichaGestor.pedido.status")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rcs.map((r) => (
                          <tr key={r.id} className="border-t">
                            <td className="px-2 py-1">{r.oficina_nome || "—"}</td>
                            <td className="px-2 py-1 text-center font-mono">{formatDateBR(r.data_envio)}</td>
                            <td className="px-2 py-1 text-center font-mono">{formatDateBR(r.data_recebimento)}</td>
                            <td className="px-2 py-1 text-right font-mono">{r.total_sem_defeitos ?? 0}</td>
                            <td className="px-2 py-1 text-right font-mono">{r.defeitos ?? 0}</td>
                            <td className="px-2 py-1 text-right font-mono">{r.segunda_qualidade ?? 0}</td>
                            <td className="px-2 py-1 text-right font-mono">{fmt(n(r.total_pagar), 2)}</td>
                            <td className="px-2 py-1 capitalize">{r.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Quadro de serviços */}
              <div>
                <h3 className="font-semibold text-sm mb-2">{t("fichaGestor.servicos.title")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {modelo?.entretela && (
                    <ServicoField
                      label={t("fichaGestor.servicos.entretelagem")}
                      hint={modelo.entretela_descricao || ""}
                      value={custos.custo_entretelagem}
                      onChange={(v) => saveCusto(oc.id, { custo_entretelagem: v })}
                      currency={t("fichaGestor.currency")}
                    />
                  )}
                  <ServicoField
                    label={t("fichaGestor.servicos.acabamento")}
                    value={custos.custo_acabamento}
                    onChange={(v) => saveCusto(oc.id, { custo_acabamento: v })}
                    currency={t("fichaGestor.currency")}
                  />
                  <ServicoField
                    label={t("fichaGestor.servicos.tecido")}
                    value={custos.custo_tecido_servico}
                    onChange={(v) => saveCusto(oc.id, { custo_tecido_servico: v })}
                    currency={t("fichaGestor.currency")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Aviamentos do modelo */}
      <Card className="break-inside-avoid">
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold text-sm">{t("fichaGestor.aviamentos.title")}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-2 py-1">{t("fichaGestor.aviamentos.tipo")}</th>
                  <th className="text-left px-2 py-1">{t("fichaGestor.aviamentos.descricao")}</th>
                  <th className="text-left px-2 py-1">{t("fichaGestor.aviamentos.tamanho")}</th>
                  <th className="text-left px-2 py-1">{t("fichaGestor.tecido.cor")}</th>
                  <th className="text-right px-2 py-1">{t("fichaGestor.aviamentos.partes")}</th>
                  <th className="text-right px-2 py-1">{t("fichaGestor.aviamentos.precoUn")}</th>
                  <th className="text-right px-2 py-1">{t("fichaGestor.aviamentos.subtotal")}</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((a) => {
                  const sub = n(a.preco_unitario) * n(a.partes_qtde);
                  return (
                    <tr key={a.id} className="border-t">
                      <td className="px-2 py-1">{a.tipo || "—"}</td>
                      <td className="px-2 py-1">{a.descricao_item}</td>
                      <td className="px-2 py-1">{a.tamanho || "—"}</td>
                      <td className="px-2 py-1">{a.cor || "—"}</td>
                      <td className="px-2 py-1 text-right font-mono">{fmt(n(a.partes_qtde), 2)}</td>
                      <td className="px-2 py-1 text-right">
                        <Input
                          type="number"
                          step="0.001"
                          value={a.preco_unitario ?? 0}
                          onChange={(e) => updateAviamentoPreco(a.id, Number(e.target.value))}
                          className="h-7 w-24 text-right font-mono text-xs ml-auto print:border-0 print:p-0"
                        />
                      </td>
                      <td className="px-2 py-1 text-right font-mono">{fmt(sub, 2)}</td>
                    </tr>
                  );
                })}
                {lista.length === 0 && (
                  <tr><td colSpan={7} className="px-2 py-2 text-center text-muted-foreground">{t("common.noData")}</td></tr>
                )}
                <tr className="bg-muted/30 font-semibold border-t">
                  <td colSpan={6} className="px-2 py-1 text-right">{t("fichaGestor.aviamentos.totalPeca")}:</td>
                  <td className="px-2 py-1 text-right font-mono">{fmt(aviamentosPorPeca, 2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Relatório por coluna */}
      <Card className="break-inside-avoid">
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold text-sm">{t("fichaGestor.report.title")}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border">
              <thead className="bg-muted/50">
                <tr>
                  {[
                    "ordemCorte","cliente","referencia","modelo",
                    "custoOficinaPeca","custoAviamentosPeca","acabamentoPeca","custoTotalPeca",
                    "dataEntrega","precoVenda","quantidade","valorTotal","tecidoMontante",
                    "custoFabricacaoTotal","aviamentosTotal","comissao","acabamentoTotal",
                    "custoTotal","lucro","media",
                  ].map((k) => (
                    <th key={k} className="text-left px-2 py-1 whitespace-nowrap">{t(`fichaGestor.report.${k}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {relatorio.map((r, idx) => {
                  const oc = ocs[idx];
                  const c = getCustos(oc.id);
                  return (
                    <tr key={r.ordemCorte} className="border-t">
                      <td className="px-2 py-1 font-mono">{r.ordemCorte}</td>
                      <td className="px-2 py-1">{r.cliente}</td>
                      <td className="px-2 py-1">{r.referencia}</td>
                      <td className="px-2 py-1">{r.modelo}</td>
                      <td className="px-2 py-1 text-right font-mono">{fmt(r.custoOficinaPeca, 2)}</td>
                      <td className="px-2 py-1 text-right font-mono">{fmt(r.custoAviamentosPeca, 2)}</td>
                      <td className="px-2 py-1 text-right font-mono">{fmt(r.acabamentoPeca, 2)}</td>
                      <td className="px-2 py-1 text-right font-mono font-semibold">{fmt(r.custoTotalPeca, 2)}</td>
                      <td className="px-2 py-1 font-mono">{r.dataEntrega}</td>
                      <td className="px-2 py-1 text-right">
                        <Input
                          type="number" step="0.01" value={c.preco_venda}
                          onChange={(e) => saveCusto(oc.id, { preco_venda: Number(e.target.value) })}
                          className="h-7 w-24 text-right font-mono text-xs ml-auto print:border-0 print:p-0"
                        />
                      </td>
                      <td className="px-2 py-1 text-right font-mono">{r.quantidade}</td>
                      <td className="px-2 py-1 text-right font-mono">{fmt(r.valorTotal, 2)}</td>
                      <td className="px-2 py-1 text-right font-mono">{fmt(r.tecidoMontante, 2)}</td>
                      <td className="px-2 py-1 text-right font-mono">{fmt(r.custoFabricacaoTotal, 2)}</td>
                      <td className="px-2 py-1 text-right font-mono">{fmt(r.aviamentosTotal, 2)}</td>
                      <td className="px-2 py-1 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Input
                            type="number" step="0.01" value={c.comissao_percent}
                            onChange={(e) => saveCusto(oc.id, { comissao_percent: Number(e.target.value) })}
                            className="h-7 w-16 text-right font-mono text-xs print:border-0 print:p-0"
                          />
                          <span className="text-[10px] text-muted-foreground">%</span>
                          <span className="font-mono text-[10px]">({fmt(r.comissaoValor, 2)})</span>
                        </div>
                      </td>
                      <td className="px-2 py-1 text-right font-mono">{fmt(r.acabamentoTotal, 2)}</td>
                      <td className="px-2 py-1 text-right font-mono font-semibold">{fmt(r.custoTotal, 2)}</td>
                      <td className={`px-2 py-1 text-right font-mono font-semibold ${r.lucro >= 0 ? "text-[hsl(142,71%,35%)]" : "text-destructive"}`}>{fmt(r.lucro, 2)}</td>
                      <td className="px-2 py-1 text-right font-mono">{fmt(r.media, 2)}</td>
                    </tr>
                  );
                })}
                {relatorio.length > 0 && (
                  <tr className="bg-muted/30 font-semibold border-t">
                    <td colSpan={10} className="px-2 py-1 text-right">{t("common.total") || "Total"}:</td>
                    <td className="px-2 py-1 text-right font-mono">{totaisRelatorio.quantidade}</td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(totaisRelatorio.valorTotal, 2)}</td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(totaisRelatorio.tecidoMontante, 2)}</td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(totaisRelatorio.custoFabricacaoTotal, 2)}</td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(totaisRelatorio.aviamentosTotal, 2)}</td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(totaisRelatorio.comissaoValor, 2)}</td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(totaisRelatorio.acabamentoTotal, 2)}</td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(totaisRelatorio.custoTotal, 2)}</td>
                    <td className={`px-2 py-1 text-right font-mono ${totaisRelatorio.lucro >= 0 ? "text-[hsl(142,71%,35%)]" : "text-destructive"}`}>{fmt(totaisRelatorio.lucro, 2)}</td>
                    <td className="px-2 py-1 text-right font-mono">{fmt(totaisRelatorio.quantidade ? totaisRelatorio.lucro / totaisRelatorio.quantidade : 0, 2)}</td>
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

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={mono ? "font-mono" : ""}>{value}</div>
    </div>
  );
}

function ServicoField({ label, hint, value, onChange, currency }: {
  label: string; hint?: string; value: number; onChange: (v: number) => void; currency: string;
}) {
  return (
    <div className="border rounded p-3 bg-muted/20">
      <div className="text-xs font-medium">{label}</div>
      {hint && <div className="text-[10px] text-muted-foreground truncate">{hint}</div>}
      <div className="flex items-center gap-1 mt-1">
        <span className="text-xs text-muted-foreground">{currency}</span>
        <Input
          type="number" step="0.01" value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-8 font-mono text-sm"
        />
      </div>
    </div>
  );
}
