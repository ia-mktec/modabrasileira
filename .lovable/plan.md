## Objetivo
Garantir que a tela de Ordem de Corte (detalhe da OC) possa ser rolada horizontalmente quando o conteúdo ultrapassar a largura da viewport.

## Alteração
- No arquivo `src/pages/FichaGestorPage.tsx`, adicionar a classe Tailwind `overflow-x-auto` ao container principal da página (`<div className="p-4 md:p-6 space-y-4 ...">`).

Isso permite que o usuário visualize todo o conteúdo da página em telas menores ou quando tabelas largas extrapolarem os limites da tela.