# Plano: ajustes no Dashboard

Mudanças apenas em `src/pages/Dashboard.tsx` (e `src/lib/dashboard-audit.ts` para refletir os novos KPIs na auditoria exportada).

## 1. KPIs (cards do topo)

Remover **Aviamentos Cadastrados**. Reordenar para:

| Card | Regra |
|---|---|
| **Quantidade de Pedidos no Período** (novo) | `count(*)` em `modelo_pedidos` com `data_pedido` dentro do intervalo |
| **Produção Cortada no Período** (novo) | Soma de `quantidade_pecas` em `ordens_corte` com `status='concluido'` e `data_corte` no intervalo (é o que hoje é chamado de "Produção no Período") |
| **Produção no Período** (redefinido) | Soma de peças **finalizadas** = OCs cuja etapa atual é **Acabamento concluído** ou **Entregue ao cliente**. Critério: somar `quantidade_pecas` das OCs em que existe `recebimento.status='concluido'` **ou** registro em `entrega_cliente`, considerando a data do evento que finalizou (data do recebimento concluído ou `data_entrega`) dentro do intervalo. Quando ambos existirem, prevalece a data mais recente (entrega). |
| **Tecido em Estoque** | Mantém (snapshot) |
| **Ordens em Aberto** | Mantém (expedidas sem recebimento, no período) |
| **Peças Expedidas** | Mantém |

## 2. Etapas no fluxo (`getEtapa`) — corrigir "Últimas Ordens de Corte" e pizza

Hoje qualquer OC com linha em `expedicao` já vira "Expedição"/"Oficina". Falta distinguir o estado real. Nova precedência (do mais avançado pro mais inicial):

1. **Entregue ao cliente** — existe registro em `entrega_cliente` para a OC.
2. **Acabamento** — existe `recebimento` com `status='concluido'` (peças voltaram da oficina e foram aprovadas no acabamento) e ainda não foi entregue.
3. **Recebimento** — existe `recebimento` com `status` diferente de `concluido` (em conferência/parcial).
4. **Oficina de Costura** — existe `expedicao` com `status='concluido'` (saiu para a oficina) e ainda não há recebimento.
5. **Expedição** — existe `expedicao` com `status` diferente de `concluido` (em preparação para sair).
6. **Corte concluído** — OC com `status='concluido'` sem expedição.
7. **Corte** — demais casos (em andamento).

Isto faz a OC 26743, que tem expedição registrada mas ainda não saiu, aparecer corretamente como **Expedição** em vez de pular para Oficina.

Adicionar set auxiliar `expedicaoConcluidaSet` (já existe como `oficinaSet`) e novo `recebimentoConcluidoSet` derivado de `recebimento.status`.

A pizza **Status das Ordens** e a tabela **Últimas Ordens de Corte** passam a usar essa mesma função, então ambas refletem a etapa real.

## 3. Buscar dados adicionais

- Já buscamos `recebimento` e `entrega_cliente`. Adicionar fetch de `modelo_pedidos` (campos: `numero_pedido, data_pedido, created_at`) para o novo KPI de pedidos no período.
- Passar a usar `recebimento.status` (já vem no select; só não estava sendo lido).

## 4. Auditoria (`src/lib/dashboard-audit.ts`)

- Substituir aba **Produção no Período** por duas abas:
  - **Produção Cortada no Período** — OCs cortadas (regra atual).
  - **Produção Finalizada no Período** — OCs com acabamento concluído ou entregues, mostrando a data de finalização usada.
- Nova aba **Pedidos no Período** — lista de `modelo_pedidos` filtrados por `data_pedido`.
- Remover aba **Aviamentos** (card foi excluído). Manter snapshot de Tecidos.
- Atualizar aba **Status das Ordens** para usar a nova precedência (com a etapa "Recebimento" como categoria adicional).
- Atualizar **Resumo** com os novos KPIs e fórmulas.

## Fora de escopo

- Não mexer em layout/estilo dos cards além da remoção/adição.
- Não alterar gráfico "Produção por Mês" (continua baseado em `data_corte` de OCs concluídas — é a visão histórica de corte).
- Não tocar em permissões nem em outras telas.
