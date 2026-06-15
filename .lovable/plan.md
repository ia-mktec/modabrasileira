## Objetivo

Na tela **Estoque de Tecidos** (`/estoque-tecidos`), adicionar uma coluna **Ação** com botão **Detalhar** em cada linha. Ao clicar, abre um pop-up listando as ordens de corte que alocaram aquele tecido (cliente + tipo + cor).

## Como o sistema sabe quem alocou

Nas entradas de `tecido_entradas` com `status = 'Alocado'`, os campos `ordem_corte1` e `ordem_corte2` guardam o número da ordem de corte (ex.: `26770`). Cruzando esses números com `ordens_corte.numero`, recuperamos modelo, data, cortador e status.

## Estrutura do pop-up

Cabeçalho com a identificação do tecido:
- Cliente • Tipo de tecido • Cor • Composição

Tabela de ordens alocadas:

```text
OC      Modelo    Data Corte    Metragem (mt)   Status OC      Ação
26770   CH 032    03/06/2026         150,00      Em Andamento   [Abrir]
24949   ZK 1272   28/03/2024         148,00      Concluído      [Abrir]
```

Linha de total: soma da metragem alocada.

Botão **Abrir** na linha → navega para `/corte` e carrega a OC (mesma rota de busca já existente). Pop-up fecha.

## Comportamento

- Se a linha de estoque não tiver alocações (`alocado = 0`), o botão **Detalhar** fica desabilitado com tooltip "Sem alocações".
- Busca de ordens é feita no momento de abrir o diálogo (uma única query filtrando `tecido_entradas` por cliente_id + nome_tecido + cor + status = 'Alocado', depois `ordens_corte` pelos números encontrados).
- Estado de carregamento mostra spinner pequeno dentro do diálogo.
- Mensagem "Nenhuma ordem encontrada" quando os números em `ordem_corte1/2` não baterem com nenhuma OC.

## Detalhes técnicos

Arquivos:
- **`src/pages/EstoqueTecidosPage.tsx`** — adicionar coluna **Ação**, botão **Detalhar** com ícone `Eye`, controlar `selectedRow` e abrir `<Dialog>`.
- **`src/components/shared/DetalhesAlocacaoDialog.tsx`** (novo) — componente do diálogo. Recebe `{ open, onClose, cliente_id, cliente_nome, tecido, cor, composicao }`. Faz a busca interna usando `supabase`.

Query (resumo):
1. `tecido_entradas` filtrando por `cliente_id`, `nome_tecido`, `cor` e `status ILIKE 'aloc%'` → coleta `ordem_corte1` + `ordem_corte2` + `metragem_total`.
2. `ordens_corte` com `.in('numero', [...])` → traz `numero, modelo_ref, data_corte, status, id`.
3. Junta no cliente para montar a tabela.

Navegação ao clicar **Abrir**: `navigate('/corte?oc=' + numero)` — a tela de Corte já tem busca por número (`searchTerm`). Se preferir abrir já carregada, posso ajustar `CortePage` para ler `?oc=` do query string em um passo extra (opcional, posso incluir no plano se desejar).

## Fora do escopo

- Edição/cancelamento de alocação a partir do pop-up.
- Histórico de mudança de status da alocação.
