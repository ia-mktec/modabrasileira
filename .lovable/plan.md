## Plano: Tradução PT / EN / 中文 em todo o sistema

### 1. Biblioteca e configuração
- Adicionar `react-i18next` + `i18next` + `i18next-browser-languagedetector`.
- Criar `src/i18n/index.ts` inicializando com:
  - Idiomas: `pt` (padrão / fallback), `en`, `zh`.
  - Detecção via `localStorage` (`i18nextLng`), fallback para `pt`.
  - `interpolation.escapeValue: false`.
- Importar `src/i18n/index.ts` em `src/main.tsx` antes do `<App />`.

### 2. Estrutura de arquivos de tradução
```text
src/i18n/
  index.ts
  locales/
    pt.json      # textos originais (fonte da verdade)
    en.json      # inglês
    zh.json      # chinês simplificado
```
Organização por namespaces dentro do JSON:
```text
common.*       # botões, ações, status genéricos, datas, vazio
auth.*         # login, esqueci senha, reset
sidebar.*      # itens do menu lateral
dashboard.*    # KPIs, gráficos, etapas (Corte, Expedição, Oficina, Recebimento, Acabamento, Entregue)
pedidos.*      # listagem, ficha, histórico, kanban
modelos.*      # cadastro de modelos, aviamentos, gradação
corte.*        # ordens de corte
expedicao.*    # expedição
recebimento.*  # recebimento
entrega.*      # entrega ao cliente
estoque.*      # tecidos e aviamentos
cadastros.*    # cadastros gerais, usuários
reports.*      # relatórios de produção e clientes
toasts.*       # mensagens de sucesso/erro
errors.*       # mensagens de erro e validação
```

### 3. Seletor de idioma
- Novo componente `src/components/layout/LanguageSwitcher.tsx`:
  - Dropdown compacto com `PT` / `EN` / `中文` e ícone `Languages` (lucide-react).
  - Em modo `collapsed` da sidebar, mostra apenas o ícone com tooltip.
  - Altera `i18n.language` e persiste em `localStorage`.
- Inserir no topo da `src/components/layout/AppSidebar.tsx`, logo abaixo do logo.

### 4. Telas a refatorar (substituir strings por `t("...")`)
Toda a UI. Páginas:
- `src/pages/`: `LoginPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `Dashboard`, `PedidosPage`, `FichaPedidoPage`, `PedidoImpressaoPage`, `ModelosPage`, `CortePage`, `ExpedicaoPage`, `RecebimentoPage`, `EntregaClientePage`, `EstoqueTecidosPage`, `TecidosPage`, `AviamentosPage`, `CadastroPage`, `GerenciarUsuariosPage`, `RelatorioProducaoPage`, `RelatorioClientesPage`, `FluxoCaixaPage`, `FichaZiperPage`, `NotFound`.
- Componentes em `src/components/layout/*` e `src/components/shared/*` (`PageHeader`, `StatusBadge`, `ViewOnlyBanner`, `PedidoHistoricoDialog`, `PedidoTimeline`, etc.).
- Toasts (`saving-toast`, mensagens espalhadas).
- `StatusBadge`: mapear `statusLabels` para chaves de tradução em vez de strings PT.

### 5. Itens fora de escopo (permanecem como estão)
- Conteúdo gerado pelo usuário no banco (nomes de clientes, modelos, observações, números de pedido).
- Planilha de auditoria exportada em `src/lib/dashboard-audit.ts` (relatório técnico em PT).
- Configurações do Supabase, e-mails transacionais e templates de auth.
- Etapas internas em código (`status_kanban`, valores em enum) seguem em PT; apenas os rótulos exibidos são traduzidos.

### 6. Convenções de tradução
- Chinês: simplificado (`zh-CN`).
- Datas/números: manter `formatDateBR` por enquanto (o usuário pode pedir localização de datas depois).
- Termos do setor têxtil: respeitar a memória de Terminologia já existente para PT; EN e ZH usarão equivalentes padrão do setor (ex.: "Cutting Order", "裁剪单").

### 7. Validação
- Alternar idioma e verificar visualmente:
  - Sidebar, Dashboard, Pedidos (lista + ficha), Corte, Expedição, Recebimento, Entrega, Estoque, Cadastros, Relatórios, Login.
- Verificar que a escolha persiste após recarregar.
- Conferir que não há chaves faltando (i18next mostra a chave em vez do texto).
- Build sem erros TypeScript.

### Observações
- Refatoração ampla — muitos arquivos serão tocados, mas só para trocar strings por `t("chave")`. Nenhuma lógica de negócio muda.
- Traduções iniciais serão geradas pela IA; ajustes finos de terminologia podem ser feitos depois editando os JSONs.
