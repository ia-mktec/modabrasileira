import * as XLSX from "xlsx";

export type AuditFilters = {
  inicio: Date | null;
  fim: Date | null;
};

export type AuditDatasets = {
  ordens: any[]; // ordens_corte (full)
  expedicoes: any[]; // expedicao
  gradesExp: any[]; // grade_expedicao
  recebimentos: any[]; // recebimento
  entregas: any[]; // entrega_cliente
  tecidos: any[]; // tecidos
  pedidos: any[]; // modelo_pedidos
  expedidasSet: Set<string>;
  expedicaoConcluidaSet: Set<string>;
  recebidasSet: Set<string>;
  recebimentoConcluidoSet: Set<string>;
  entreguesSet: Set<string>;
};

const fmtDate = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "—");

const inRange = (dateStr: string | null | undefined, ini: Date | null, fim: Date | null) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (ini && d < ini) return false;
  if (fim) {
    const f = new Date(fim);
    f.setHours(23, 59, 59, 999);
    if (d > f) return false;
  }
  return true;
};

const etapaLabel = (oc: any, ds: AuditDatasets): string => {
  const id = oc.id;
  if (ds.entreguesSet.has(id)) return "Entregue";
  if (ds.recebimentoConcluidoSet.has(id)) return "Acabamento";
  if (ds.recebidasSet.has(id)) return "Recebimento";
  if (ds.expedicaoConcluidaSet.has(id)) return "Oficina";
  if (ds.expedidasSet.has(id)) return "Expedição";
  return "Corte";
};

export function buildAuditWorkbook(filters: AuditFilters, ds: AuditDatasets) {
  const { inicio, fim } = filters;
  const periodo = `${fmtDate(inicio)} a ${fmtDate(fim)}`;
  const wb = XLSX.utils.book_new();
  const ocMap = new Map(ds.ordens.map((o) => [o.id, o]));

  // --- Produção Cortada no Período ---
  const cortadas = ds.ordens.filter(
    (o) => o.status === "concluido" && inRange(o.data_corte, inicio, fim),
  );
  const cortadasTotal = cortadas.reduce((s, o) => s + (o.quantidade_pecas || 0), 0);
  const wsCort = XLSX.utils.json_to_sheet(
    cortadas.map((o) => ({
      "Nº OC": o.numero,
      Modelo: o.modelo_ref || "",
      Tecido: o.tecido_nome || "",
      "Qtd Peças": o.quantidade_pecas || 0,
      "Data Corte": o.data_corte || "",
    })),
  );
  XLSX.utils.sheet_add_aoa(
    wsCort,
    [
      [],
      ["Regra:", "SUM(quantidade_pecas) WHERE ordens_corte.status='concluido' AND data_corte ∈ período"],
      ["Período:", periodo],
      ["Total:", cortadasTotal],
    ],
    { origin: -1 },
  );
  XLSX.utils.book_append_sheet(wb, wsCort, "Produção Cortada");

  // --- Produção Finalizada no Período (Acabamento concluído ou Entregue) ---
  // Mapear última data de finalização por OC
  const recConcluidoData = new Map<string, string>();
  ds.recebimentos.forEach((r) => {
    if (r.status === "concluido" && r.ordem_corte_id) {
      const cur = recConcluidoData.get(r.ordem_corte_id);
      const d = r.data_recebimento || r.created_at;
      if (d && (!cur || new Date(d) > new Date(cur))) recConcluidoData.set(r.ordem_corte_id, d);
    }
  });
  const entregaData = new Map<string, string>();
  ds.entregas.forEach((e) => {
    if (!e.ordem_corte_id) return;
    const cur = entregaData.get(e.ordem_corte_id);
    const d = e.data_entrega || e.created_at;
    if (d && (!cur || new Date(d) > new Date(cur))) entregaData.set(e.ordem_corte_id, d);
  });
  const finalizadas: any[] = [];
  ds.ordens.forEach((o) => {
    const dEnt = entregaData.get(o.id);
    const dRec = recConcluidoData.get(o.id);
    // Data de finalização = mais recente entre entrega e recebimento concluído
    let dataFin: string | undefined;
    let evento = "";
    if (dEnt && (!dRec || new Date(dEnt) >= new Date(dRec))) {
      dataFin = dEnt;
      evento = "Entregue";
    } else if (dRec) {
      dataFin = dRec;
      evento = "Acabamento";
    }
    if (dataFin && inRange(dataFin, inicio, fim)) {
      finalizadas.push({
        "Nº OC": o.numero,
        Modelo: o.modelo_ref || "",
        Tecido: o.tecido_nome || "",
        "Qtd Peças": o.quantidade_pecas || 0,
        "Data Finalização": dataFin,
        Evento: evento,
      });
    }
  });
  const finalizadasTotal = finalizadas.reduce((s, l) => s + (l["Qtd Peças"] || 0), 0);
  const wsFin = XLSX.utils.json_to_sheet(finalizadas);
  XLSX.utils.sheet_add_aoa(
    wsFin,
    [
      [],
      ["Regra:", "SUM(quantidade_pecas) das OCs com recebimento.status='concluido' OU entrega_cliente, considerando a data mais recente do evento ∈ período"],
      ["Período:", periodo],
      ["Total:", finalizadasTotal],
    ],
    { origin: -1 },
  );
  XLSX.utils.book_append_sheet(wb, wsFin, "Produção Finalizada");

  // --- Pedidos no Período ---
  const pedidosPeriodo = ds.pedidos.filter((p) => inRange(p.data_pedido, inicio, fim));
  const wsPed = XLSX.utils.json_to_sheet(
    pedidosPeriodo.map((p) => ({
      "Nº Pedido": p.numero_pedido,
      Cliente: p.cliente || "",
      Modelo: p.modelo_ref || "",
      Tecido: p.tecido || "",
      Cor: p.cor || "",
      "Data Pedido": p.data_pedido || "",
      Status: p.status_kanban || "",
    })),
  );
  XLSX.utils.sheet_add_aoa(
    wsPed,
    [
      [],
      ["Regra:", "COUNT(*) FROM modelo_pedidos WHERE data_pedido ∈ período"],
      ["Período:", periodo],
      ["Total:", pedidosPeriodo.length],
    ],
    { origin: -1 },
  );
  XLSX.utils.book_append_sheet(wb, wsPed, "Pedidos no Período");

  // --- Peças Expedidas ---
  const expFiltradas = ds.expedicoes.filter((e) =>
    inRange(e.data_saida || e.created_at, inicio, fim),
  );
  const expIds = new Set(expFiltradas.map((e) => e.id));
  const ocByExpId = new Map(expFiltradas.map((e) => [e.id, e.ordem_corte_id]));
  const linhasExp = ds.gradesExp
    .filter((g) => expIds.has(g.expedicao_id))
    .map((g) => {
      const ocId = ocByExpId.get(g.expedicao_id);
      const oc = ocId ? ocMap.get(ocId) : null;
      const exp = expFiltradas.find((e) => e.id === g.expedicao_id);
      const total =
        (g.pp_exp || 0) + (g.p_exp || 0) + (g.m_exp || 0) + (g.g_exp || 0) +
        (g.gg_exp || 0) + (g.g1_exp || 0) + (g.g2_exp || 0) + (g.g3_exp || 0);
      return {
        "Nº OC": oc?.numero || "",
        Modelo: oc?.modelo_ref || "",
        Cor: g.cor || "",
        PP: g.pp_exp || 0,
        P: g.p_exp || 0,
        M: g.m_exp || 0,
        G: g.g_exp || 0,
        GG: g.gg_exp || 0,
        G1: g.g1_exp || 0,
        G2: g.g2_exp || 0,
        G3: g.g3_exp || 0,
        Total: total,
        "Data Expedição": exp?.data_saida || exp?.created_at || "",
      };
    });
  const totalExp = linhasExp.reduce((s, l) => s + l.Total, 0);
  const wsExp = XLSX.utils.json_to_sheet(linhasExp);
  XLSX.utils.sheet_add_aoa(
    wsExp,
    [
      [],
      ["Regra:", "SUM(pp_exp+p_exp+m_exp+g_exp+gg_exp+g1_exp+g2_exp+g3_exp) WHERE expedicao.data_saida ∈ período"],
      ["Período:", periodo],
      ["Total:", totalExp],
    ],
    { origin: -1 },
  );
  XLSX.utils.book_append_sheet(wb, wsExp, "Peças Expedidas");

  // --- Ordens em Aberto ---
  const abertas = expFiltradas
    .filter((e) => e.ordem_corte_id && !ds.recebidasSet.has(e.ordem_corte_id))
    .map((e) => {
      const oc = ocMap.get(e.ordem_corte_id);
      const dataExp = e.data_saida || e.created_at;
      const dias = dataExp
        ? Math.floor((Date.now() - new Date(dataExp).getTime()) / 86400000)
        : "";
      return {
        "Nº OC": oc?.numero || "",
        Modelo: oc?.modelo_ref || "",
        Oficina: e.oficina_nome || "",
        "Data Expedição": dataExp || "",
        "Dias em Aberto": dias,
      };
    });
  const wsAb = XLSX.utils.json_to_sheet(abertas);
  XLSX.utils.sheet_add_aoa(
    wsAb,
    [
      [],
      ["Regra:", "expedicoes no período sem registro em recebimento (LEFT JOIN ordem_corte_id)"],
      ["Período:", periodo],
      ["Total:", abertas.length],
    ],
    { origin: -1 },
  );
  XLSX.utils.book_append_sheet(wb, wsAb, "Ordens em Aberto");

  // --- Status das Ordens ---
  const ocPeriodo = ds.ordens.filter((o) => inRange(o.data_corte, inicio, fim));
  const wsStatus = XLSX.utils.json_to_sheet(
    ocPeriodo.map((o) => ({
      "Nº OC": o.numero,
      Modelo: o.modelo_ref || "",
      Tecido: o.tecido_nome || "",
      "Data Corte": o.data_corte || "",
      Etapa: etapaLabel(o, ds),
      "Status OC": o.status || "",
    })),
  );
  XLSX.utils.sheet_add_aoa(
    wsStatus,
    [
      [],
      ["Regra:", "Precedência: Entregue > Acabamento (recebimento concluído) > Recebimento > Oficina de Costura (expedição concluída) > Expedição > Corte concluído > Corte. Filtro: data_corte ∈ período"],
      ["Período:", periodo],
    ],
    { origin: -1 },
  );
  XLSX.utils.book_append_sheet(wb, wsStatus, "Status das Ordens");

  // --- Tecido em Estoque (snapshot) ---
  const totalTec = ds.tecidos.reduce((s, t) => s + Number(t.estoque_kg || 0), 0);
  const wsTec = XLSX.utils.json_to_sheet(
    ds.tecidos.map((t) => ({
      Tecido: t.nome || "",
      Composição: t.composicao || "",
      Cor: t.cor || "",
      "Estoque (kg)": Number(t.estoque_kg || 0),
      Status: t.status || "",
    })),
  );
  XLSX.utils.sheet_add_aoa(
    wsTec,
    [
      [],
      ["Regra:", "SUM(estoque_kg). Observação: o card do Dashboard rotula 'mt' mas o campo é 'kg'."],
      ["Snapshot em:", fmtDate(new Date())],
      ["Total (kg):", totalTec],
    ],
    { origin: -1 },
  );
  XLSX.utils.book_append_sheet(wb, wsTec, "Tecido em Estoque");

  // --- Resumo (primeira aba) ---
  const resumo = [
    ["Indicador", "Valor", "Fonte", "Fórmula / Regra"],
    ["Período auditado", periodo, "—", "Filtros de data aplicados no Dashboard"],
    [
      "Pedidos no Período",
      pedidosPeriodo.length,
      "modelo_pedidos",
      "COUNT(*) WHERE data_pedido ∈ período",
    ],
    [
      "Produção Cortada (peças)",
      cortadasTotal,
      "ordens_corte",
      "SUM(quantidade_pecas) WHERE status='concluido' AND data_corte ∈ período",
    ],
    [
      "Produção Finalizada (peças)",
      finalizadasTotal,
      "recebimento + entrega_cliente",
      "SUM(quantidade_pecas) das OCs com acabamento concluído ou entregues no período (data mais recente do evento)",
    ],
    [
      "Peças Expedidas",
      totalExp,
      "grade_expedicao + expedicao",
      "SUM(pp_exp..g3_exp) WHERE expedicao.data_saida ∈ período",
    ],
    [
      "Ordens em Aberto",
      abertas.length,
      "expedicao + recebimento",
      "COUNT(expedicao) no período sem registro em recebimento",
    ],
    [
      "Tecido em Estoque (kg)",
      totalTec,
      "tecidos",
      "SUM(estoque_kg) — snapshot atual (ignora filtro de data)",
    ],
  ];
  const wsResumo = XLSX.utils.aoa_to_sheet(resumo);
  wsResumo["!cols"] = [{ wch: 32 }, { wch: 14 }, { wch: 32 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

  // Mover Resumo para primeira posição
  wb.SheetNames = ["Resumo", ...wb.SheetNames.filter((n) => n !== "Resumo")];

  const fileName = `auditoria-dashboard_${fmtDate(inicio)}_${fmtDate(fim)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
