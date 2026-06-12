import * as XLSX from "xlsx";

export interface RelatorioRow {
  ordemCorte: string;
  cliente: string;
  referencia: string;
  modelo: string;
  custoOficinaPeca: number;
  custoAviamentosPeca: number;
  acabamentoPeca: number;
  custoTotalPeca: number;
  dataEntrega: string;
  precoVenda: number;
  quantidade: number;
  valorTotal: number;
  tecidoMontante: number;
  custoFabricacaoTotal: number;
  aviamentosTotal: number;
  comissaoPercent: number;
  comissaoValor: number;
  acabamentoTotal: number;
  custoTotal: number;
  lucro: number;
  media: number;
}

export function exportRelatorioXLSX(numeroPedido: string, rows: RelatorioRow[], headers: Record<string, string>) {
  const data = rows.map((r) => ({
    [headers.ordemCorte]: r.ordemCorte,
    [headers.cliente]: r.cliente,
    [headers.referencia]: r.referencia,
    [headers.modelo]: r.modelo,
    [headers.custoOficinaPeca]: r.custoOficinaPeca,
    [headers.custoAviamentosPeca]: r.custoAviamentosPeca,
    [headers.acabamentoPeca]: r.acabamentoPeca,
    [headers.custoTotalPeca]: r.custoTotalPeca,
    [headers.dataEntrega]: r.dataEntrega,
    [headers.precoVenda]: r.precoVenda,
    [headers.quantidade]: r.quantidade,
    [headers.valorTotal]: r.valorTotal,
    [headers.tecidoMontante]: r.tecidoMontante,
    [headers.custoFabricacaoTotal]: r.custoFabricacaoTotal,
    [headers.aviamentosTotal]: r.aviamentosTotal,
    [headers.comissao]: r.comissaoValor,
    [headers.acabamentoTotal]: r.acabamentoTotal,
    [headers.custoTotal]: r.custoTotal,
    [headers.lucro]: r.lucro,
    [headers.media]: r.media,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Relatório");
  XLSX.writeFile(wb, `ficha-gestor-${numeroPedido}.xlsx`);
}
