## Ficha do Produto (Gestor) — visão completa + custos + relatório

Nova página `/ficha-gestor` (lista) + `/ficha-gestor/:numero_pedido` (ficha) que consolida tudo do pedido em um layout A4 imprimível, com **quadro de serviços** editáveis, **relatório por coluna** exportável e i18n PT/EN/ZH.

### 1. Acesso
- Item de menu **"Ficha do Gestor"** (`ClipboardList`/`FileText`), permissão padrão admin/gestor.
- `/ficha-gestor`: lista de pedidos com busca (nº pedido, OC, cliente, modelo) → abre a ficha.
- `/ficha-gestor/:numero_pedido`: ficha completa + botões **Imprimir/PDF** e **Exportar XLSX** (relatório).

### 2. Seções da ficha (por pedido)

**Cabeçalho do pedido:** nº, cliente, modelo (ref + descrição + imagem do bucket `modelos`), tecido base, cor, data, status, consumo unitário, observações.

**Para cada OC (`ordens_corte.numero_pedido = pedido`):**

a) **Dados da ordem de corte** — nº, datas, cortador, enfestador, enfestos, perda %, consumo/peça, qtd peças, status, observações.

b) **Tecido vinculado + rolos** — `tecido_entradas` com `ordem_corte1 = OC.numero OR ordem_corte2 = OC.numero`. Colunas: nome, composição, cor, data entrada, **qtde de rolos**, metragem, unidade + totais.

c) **Grade — linha por oficina**:
- Com expedições: `Oficina | Data saída | Cor | PP…G3 | Total | Preço peça | Subtotal` (uma linha por expedição×cor a partir de `grade_expedicao`), com linha de **Total expedido** e **Saldo vs. cortado** (cobre saídas parciais).
- Sem expedição: cair em `grade_corte` (`Cor | PP…G3 | Total`) com aviso "Aguardando expedição".

d) **Entrada na oficina (recebimentos)** — por `recebimento`: oficina, data envio, recebimento, sem defeitos, defeitos, 2ª qualidade, total a pagar, status.

e) **Aviamentos do modelo com preços** — fonte `aviamentos_pedido` (preço já existe), fallback `modelo_aviamentos`. Colunas: `Tipo | Descrição | Tamanho | Cor | Partes/peça | Qtd total | Preço un. | Subtotal`. Preço editável inline → `update` em `aviamentos_pedido` (cria a linha quando vier do fallback). Botão "Restaurar do cadastro" puxa `aviamentos.preco_un`.

### 3. Quadro de Serviços (novo, editável por pedido)

Card com três campos numéricos por OC (ou por pedido, ver §5):
- **Entretelagem** — só aparece quando `modelos.entretela = true` no modelo do pedido. Mostra também `entretela_descricao` e `entretela_consumo_peca` como referência.
- **Acabamento** — sempre visível.
- **Tecido (serviço)** — sempre visível (custo de processamento/lavagem/etc., separado do tecido em si).

Cada campo é R$/peça, editável, com debounce + toast e total calculado (`valor × qtdPeças`).

### 4. Relatório por coluna (tabela ao final + export XLSX)

Uma linha por OC do pedido, com as colunas exatamente nesta ordem:

| Coluna | Origem |
|---|---|
| Ordem de Corte | `ordens_corte.numero` |
| Cliente | `modelo_pedidos.cliente` |
| Referência | `modelo_pedidos.modelo_ref` |
| Modelo | `modelos.descricao` |
| Custo Oficina/peça | média ponderada de `expedicao.preco_peca` (fallback 0) |
| Custo Aviamentos/peça | Σ(`preco_unitario × partes_qtde`) dos aviamentos do pedido |
| Acabamento/peça | campo editável (serviços) |
| Custo Total/peça | oficina + aviamentos + acabamento + entretelagem + tecido serviço |
| Data de Entrega | última `recebimento.data_recebimento` da OC (ou — se pendente) |
| Preço de Venda | **editável** (novo campo) |
| Quantidade | total expedido se houver; senão total cortado |
| Valor Total (Faturamento) | preço venda × quantidade |
| Tecido (montante) | `consumo_por_peca × quantidade` (em mt) + custo se houver; mostra a metragem da OC |
| Custo de Fabricação (Total) | Custo Oficina/peça × quantidade |
| Aviamentos (Total) | Custo Aviamentos/peça × quantidade |
| Comissão | **editável** em % → valor = faturamento × % |
| Acabamento (Total) | Acabamento/peça × quantidade |
| Custo Total | Σ dos custos acima (incluindo comissão e tecido serviço) |
| Lucro | Faturamento − Custo Total |
| Média | Lucro / quantidade |

- Linha de **totais do pedido** ao final.
- Botão **Exportar XLSX** gera a planilha com as mesmas colunas (via lib já usada no projeto para o Dashboard de auditoria).

### 5. Persistência dos campos editáveis novos

Nova tabela `public.ficha_gestor_custos` (1 linha por OC), via migration:

```
ordem_corte_id uuid PK FK → ordens_corte(id) ON DELETE CASCADE
numero_pedido text NOT NULL
custo_entretelagem numeric(10,2) DEFAULT 0
custo_acabamento numeric(10,2) DEFAULT 0
custo_tecido_servico numeric(10,2) DEFAULT 0
preco_venda numeric(10,2) DEFAULT 0
comissao_percent numeric(5,2) DEFAULT 0
created_at / updated_at + trigger update_updated_at_column
```

GRANTS para `authenticated` e `service_role`, RLS habilitado, políticas "Authenticated can read/insert/update/delete" (mesmo padrão das demais tabelas do projeto). Sem `anon`.

### 6. Internacionalização

Todas as strings da página (rótulos das seções, colunas da tabela, status, botões, toasts) entram em `src/i18n/locales/pt.json`, `en.json` e `zh.json` sob a chave `fichaGestor.*`. Item de sidebar via `sidebar.fichaGestor`.

### 7. Arquivos a criar/editar

**Criar**
- `src/pages/FichaGestorListPage.tsx` — lista de pedidos + busca.
- `src/pages/FichaGestorPage.tsx` — ficha completa + quadro de serviços + relatório + impressão + export.
- (helper) `src/lib/ficha-gestor-export.ts` — geração do XLSX.

**Editar**
- `src/App.tsx` — registrar `/ficha-gestor` e `/ficha-gestor/:numero_pedido`.
- `src/components/layout/AppSidebar.tsx` — novo item de menu.
- `src/i18n/locales/{pt,en,zh}.json` — chaves `fichaGestor.*` e `sidebar.fichaGestor`.
- `src/lib/permissions.ts` (se necessário) — permissão da rota.

**Migration**
- Criar tabela `ficha_gestor_custos` com GRANTs + RLS + políticas + trigger.

### 8. Detalhes técnicos
- Buscas em paralelo via `Promise.all` + `fetchAllRows` (padrão do projeto), evita limite de 1000.
- Imagem do modelo via `supabase.storage.from('modelos').getPublicUrl(...)`.
- Edição de preços/serviços com debounce ~500ms, toast de "Salvo" e tratamento de erro.
- Impressão A4: `@media print` esconde sidebar/botões, `break-inside-avoid` por OC, fundo branco.
- Export XLSX: `xlsx` (lib já usada em `dashboard-audit.ts`).

### Fora de escopo
- Edição de campos da OC, expedição ou recebimento (somente leitura aqui).
- Histórico de alterações de preço/comissão.
- Múltiplos cenários de simulação de preço.