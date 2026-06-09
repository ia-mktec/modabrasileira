# Plano: Auditoria do Dashboard + Exportação

## Objetivo
Permitir que qualquer número do Dashboard seja auditado linha-a-linha, via:
1. Filtro de período (data inicial / data final) aplicado aos KPIs e gráficos.
2. Botão **"Exportar dados"** que gera uma planilha XLSX com uma aba por indicador, contendo as linhas que compõem cada número.

## Mudanças na UI (`src/pages/Dashboard.tsx`)

### Filtro de data
- Adicionar dois `DatePicker` (Início / Fim) no `PageHeader`, com presets rápidos: "Mês atual", "Últimos 30 dias", "Últimos 6 meses", "Tudo".
- Default: **mês atual** (mantém comportamento atual de "Produção do Mês").
- Filtro aplicado a:
  - **Produção do Mês** → vira "Produção no Período" (soma `quantidade_pecas` de OCs concluídas com `data_corte` no intervalo).
  - **Peças Expedidas** → soma das grades de expedição cujas OCs foram expedidas no intervalo (`expedicao.created_at` ou `data_expedicao`).
  - **Ordens em Aberto** → expedidas no intervalo sem recebimento.
  - **Produção por Mês** (gráfico) → respeita o intervalo (ou últimos N meses dentro dele).
  - **Status das Ordens** (pizza) e **Últimas Ordens** → respeitam o intervalo.
- **Tecido em Estoque** e **Aviamentos Cadastrados** ignoram o filtro (são snapshots atuais) — exibir badge "snapshot" nesses cards.

### Botão "Exportar dados"
- Posicionado no `PageHeader` ao lado dos filtros.
- Ao clicar: gera XLSX no browser via `xlsx` (SheetJS) e dispara download `auditoria-dashboard_{inicio}_{fim}.xlsx`.

## Conteúdo da planilha de auditoria

| Aba | Conteúdo | Colunas |
|---|---|---|
| **Resumo** | Valores consolidados de cada KPI + período auditado | Indicador, Valor, Fonte, Fórmula |
| **Produção no Período** | OCs concluídas no intervalo | Nº OC, Modelo, Tecido, Cor, Qtd Peças, Data Corte, Status |
| **Peças Expedidas** | Grades de expedição no intervalo | Nº OC, Modelo, Cliente, PP, P, M, G, GG, G1, G2, G3, Total, Data Expedição |
| **Ordens em Aberto** | Expedidas sem recebimento | Nº OC, Modelo, Cliente, Data Expedição, Dias em Aberto |
| **Status das Ordens** | Todas as OCs com etapa calculada | Nº OC, Modelo, Cliente, Data Corte, Etapa (Corte/Expedição/Oficina/Acabamento/Entregue) |
| **Tecido em Estoque** | Snapshot atual | Tecido, Cor, Estoque (kg), Estoque (mt — se aplicável) |
| **Aviamentos** | Snapshot atual | Código, Descrição, Tipo, Estoque |

Cada aba inclui no rodapé a **fórmula/regra exata** usada (ex.: `SUM(quantidade_pecas) WHERE status='concluido' AND data_corte BETWEEN X AND Y`).

## Detalhes técnicos
- Adicionar dependência **`xlsx`** (SheetJS) — leve, roda 100% client-side.
- Reusar `fetchAllRows` (em `src/lib/fetch-all-rows.ts`) para garantir que >1000 linhas sejam puxadas.
- Buscar dados extras necessários para auditoria sob demanda (ao clicar exportar), não no load inicial — mantém Dashboard rápido. Reaproveitar caches já em `state` quando possível.
- Coluna "mt" do card "Tecido em Estoque" continua puxando `estoque_kg` (comportamento atual preservado); a aba de auditoria deixa explícito que o campo é `kg`.
- Tipagem: criar helper `buildAuditWorkbook(filters, datasets)` em novo arquivo `src/lib/dashboard-audit.ts` para isolar a lógica de montagem do XLSX.

## Arquivos
- **Editar**: `src/pages/Dashboard.tsx` (filtros, botão, refilter dos memos)
- **Criar**: `src/lib/dashboard-audit.ts` (montagem XLSX)
- **Instalar**: `xlsx`

## Fora de escopo
- Corrigir o label "mt" vs `estoque_kg` (apenas documentar na auditoria).
- Nova página de auditoria interna.
- Permissões diferenciadas para o botão (qualquer um que vê o Dashboard pode exportar).

Confirme para eu implementar — ou diga se quer ajustar período default, abas adicionais, ou trocar o XLSX por CSV.