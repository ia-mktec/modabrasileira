## Objetivo

Incluir 4 novas colunas na exportação Excel do **Relatório de Produção** (`/relatorio-producao` → botão "Exportar Excel"):

1. **Qtd Peças Cortadas** — vem de `ordens_corte.quantidade_pecas` (OC vinculada ao pedido)
2. **Data Envio Oficina** — `expedicao.data_saida` (mais recente da OC)
3. **Nome da Oficina** — `expedicao.oficina_nome`
4. **Data Recebimento Oficina** — `recebimento.data_recebimento` (mais recente)

Quando um pedido tiver várias OCs/expedições/recebimentos, é usado o registro mais recente por etapa. Quando a etapa ainda não ocorreu, a célula fica vazia.

## Alterações em `src/pages/RelatorioProducaoPage.tsx`

**1. Ampliar os fetches** (`useEffect` em torno da linha 232):
- `ordens_corte` → adicionar `quantidade_pecas` ao `select`.
- `expedicao` → adicionar `data_saida, oficina_nome` ao `select` e à interface `ExpedicaoRow`.
- `recebimento` → já traz `data_recebimento` (ok).

**2. Construir 3 mapas auxiliares** (via `useMemo`, junto aos demais):
- `qtdCortadaByPedido: Record<string, number>` — soma de `quantidade_pecas` das OCs do pedido.
- `expByPedido: Record<string, { data_saida, oficina_nome }>` — última expedição (por `updated_at`) entre as OCs do pedido.
- `recByPedido: Record<string, { data_recebimento }>` — último recebimento (por `data_recebimento || updated_at`).

**3. Atualizar `exportExcel`** (linha 462): incluir as 4 chaves novas em cada `rows.push({...})`, formatando datas com `formatDateBR`, e adicionar 4 entradas em `ws["!cols"]`.

Ordem final das colunas no Excel:

```text
Fase | Nº Pedido | Nº Ordem de Corte | Referência | Cliente | Tecido | Cor
    | Data do Pedido | Qtd Peças Cortadas | Data Envio Oficina | Nome da Oficina
    | Data Recebimento Oficina | Status Kanban
```

## Fora de escopo

- Não altera a UI do kanban nem a exportação em PDF.
- Não toca em outras telas/relatórios.