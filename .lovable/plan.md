## Ajustes na página `/ficha-gestor/:numero` (FichaGestorPage)

Todas as alterações são visuais/apresentação no arquivo `src/pages/FichaGestorPage.tsx` e nas traduções em `src/i18n/locales/{pt,en,zh}.json`.

### 1. Cabeçalho de cada OC
Trocar o cabeçalho do bloco da OC de:
`Ordem de Corte: <numero>   <status>`
para:
`Ordem de Corte - <numero>` (status permanece à direita).

### 2. Quadro inicial do pedido
Remover o campo **Cor** (`pedido.cor`) do bloco de cabeçalho do pedido.

### 3. Campos editáveis em amarelo claro
Aplicar fundo amarelo claro (`bg-yellow-100` + foco visível) em todos os inputs editáveis da página:
- Preço unitário dos aviamentos
- Serviços: Entretelagem, Acabamento, Tecido
- Preço de Venda (tabela resultado)
- Comissão % (tabela resultado)

Para impressão (`print:`), manter os valores legíveis mas remover o fundo amarelo.

### 4. Campos de metragem sem casas decimais
Na tabela de **Tecidos vinculados**, a coluna **Metragem** (e o total ao final) passa a ser exibida como número inteiro (sem casas decimais). Demais campos (consumo por peça, perda %) permanecem como estão.

### 5. Grade de Expedição/Corte consolidada por oficina
Reformular a tabela quando existem expedições:
- Remover a coluna **Cor**.
- Consolidar uma única linha por **oficina + expedição** somando todas as cores em cada tamanho.
- Manter: Oficina, Data Saída, PP…G3, Total, Preço/Peça, Subtotal.
- Linhas de total expedido e saldo permanecem.

Quando não há expedições, a grade de corte também passa a ser consolidada (somando cores), exibindo apenas a linha de tamanhos + total (sem coluna Cor).

### 6. Tabela de Aviamentos
- Remover as colunas **Tamanho** e **Cor**.
- Manter: Tipo, Descrição, Partes, Preço Un. (editável amarelo), Subtotal.
- O valor unitário continua sendo lido de `aviamentos_pedido.preco_unitario` (valor cadastrado no pedido) e editável inline — comportamento atual, apenas com novo destaque amarelo.

### 7. Renomear título do relatório
Trocar `fichaGestor.report.title` de **"Relatório por Ordem de Corte"** para **"Resultado da Ordem de Corte"** nos três idiomas (pt/en/zh):
- pt: `Resultado da Ordem de Corte`
- en: `Cut Order Result`
- zh: `裁剪订单结果`

### Detalhes técnicos
- Arquivo principal: `src/pages/FichaGestorPage.tsx` (edições nas seções: header do pedido, header de cada OC card, tabela de tecidos, tabela grade expedição, tabela grade corte, tabela aviamentos, inputs de serviço e da tabela resultado).
- i18n: atualizar somente a chave `fichaGestor.report.title` em pt/en/zh.
- Sem alterações de schema, lógica de cálculo ou regras de negócio.
- Sem alterações na listagem (`FichaGestorListPage`).
