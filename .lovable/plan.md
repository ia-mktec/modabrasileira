## Plano: Tradução das telas de Relatórios

Dashboard já está traduzido. Esta fase cobre apenas as duas páginas de relatórios; demais módulos ficam para depois conforme combinado.

### 1. Telas no escopo
- `src/pages/RelatorioProducaoPage.tsx` (Fluxo de Produção)
- `src/pages/RelatorioClientesPage.tsx` (Relatório de Clientes)

### 2. Conteúdo a traduzir em cada tela
- Título e descrição da página (`PageHeader`).
- Filtros (datas, presets, selects de cliente/modelo/status, busca).
- Botões: Exportar, Limpar filtros, Aplicar.
- Cabeçalhos de tabelas e colunas.
- Estados vazios ("Sem dados", "Nenhum registro encontrado").
- Labels de KPIs/cartões resumo.
- Rótulos de etapas/status (reaproveitando `dashboard.etapa.*` e `status.*` já existentes).
- Tooltips e legendas de gráficos (eixos, séries).
- Mensagens de toast (sucesso/erro de exportação).

### 3. Estrutura de chaves nos JSONs
Adicionar novo namespace `reports` em `pt.json` / `en.json` / `zh.json`:
```text
reports.producao.title
reports.producao.description
reports.producao.filters.*
reports.producao.columns.*
reports.producao.kpis.*
reports.producao.empty
reports.clientes.title
reports.clientes.description
reports.clientes.filters.*
reports.clientes.columns.*
reports.clientes.kpis.*
reports.clientes.empty
reports.common.export
reports.common.clearFilters
reports.common.applyFilters
```
Chaves genéricas já existentes (`common.*`, `status.*`, `dashboard.etapa.*`) serão reutilizadas em vez de duplicadas.

### 4. Refatoração
- Importar `useTranslation` em cada página.
- Substituir todas as strings PT visíveis por `t("reports.<chave>")`.
- Conteúdo gerado pelo usuário (nomes de clientes, modelos, observações, números) permanece como está.
- Datas continuam formatadas com `formatDateBR` (localização de datas fica para fase futura).
- Planilhas exportadas (XLSX) continuam em PT — relatório técnico interno.

### 5. Fora de escopo
- Demais páginas (Pedidos, Corte, Expedição, Recebimento, Acabamento, Cadastros, Estoque, Modelos, etc.).
- Toasts globais fora dessas duas telas.
- Conteúdo do banco e arquivos exportados.

### 6. Validação
- Trocar idioma no seletor da sidebar e abrir cada relatório.
- Conferir que filtros, colunas, KPIs e estados vazios mudam.
- Confirmar que nenhum texto PT remanescente aparece nessas duas telas.
- Build sem erros de TypeScript.
