## Objetivo
Na tela de Modelos, além do botão "Trocar Imagem" que já existe nas fotos da Frente e Costas, adicionar também um botão "Excluir Imagem" para permitir remover a foto sem precisar substituí-la.

## Escopo
Arquivo: `src/pages/ModelosPage.tsx`

Aplicar em:
- Card **Imagem do Modelo (Frente)** — controlado por `modelImage` / `setModelImage`
- Card **Imagem do Modelo (Costas)** — controlado por `modelImageCostas` / `setModelImageCostas`

(As fotos do cliente já possuem botão de excluir com ícone `X`, então não precisam de mudança.)

## Comportamento
1. Junto ao botão "Trocar Imagem" (canto inferior direito da imagem), adicionar um botão "Excluir" com ícone de lixeira, em estilo destrutivo.
2. Ao clicar, abrir um `AlertDialog` de confirmação ("Tem certeza que deseja excluir esta imagem?") para evitar exclusão acidental.
3. Ao confirmar:
   - Limpar o estado (`setModelImage(null)` ou `setModelImageCostas(null)`).
   - Exibir toast "Imagem removida. Salve o modelo para confirmar a exclusão."
4. A remoção só persiste no banco quando o usuário clicar em **Salvar**, seguindo o padrão atual da tela (o payload já envia `imagem_url: modelImage || null`).

## Observação
Não vou apagar o arquivo do bucket de Storage — apenas remover a referência no registro do modelo. Isso preserva o histórico e evita quebrar outros lugares que possam referenciar a mesma URL.
