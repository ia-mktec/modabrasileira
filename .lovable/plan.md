## Problema

Quando uma ordem de corte já foi expedida 100%, ao clicar em "Imprimir Ficha" a ficha sai com quantidades zeradas, porque a impressão usa o formulário "Quantidade a Enviar" (`qtdEnviar`), que fica vazio quando o saldo é zero. Isso impede a reimpressão da ficha para incluir informações ou redirecionar para outra oficina.

## Solução

Ao abrir um registro de expedição existente pelo histórico, o grid deve ser pré-preenchido com as quantidades daquela saída, permitindo imprimir novamente (e editar campos como oficina/observações antes de reimprimir).

### Comportamento

1. Abrir registro pelo histórico → o grid de "Quantidade" carrega automaticamente as quantidades por cor/tamanho salvas naquele registro.
2. Saldo por célula passa a considerar que as peças daquele registro em edição estão "disponíveis" para ele mesmo — os inputs deixam de ficar bloqueados em zero.
3. "Imprimir Ficha" gera a ficha com as quantidades corretas, pronta para reimpressão.
4. Se o usuário alterar oficina, observações ou quantidades e salvar, o registro é atualizado (comportamento já existente via `editingExpedicaoId`), sem duplicar saída.
5. Nova saída parcial (quando ainda há saldo) continua funcionando exatamente como hoje.

## Detalhes técnicos

Arquivo único: `src/pages/ExpedicaoPage.tsx`.

- Em `loadRegistroExpedicao`, após carregar `editingExpedicaoGrade`, mapear cada linha de `gradeRows` pela cor e preencher `qtdEnviar[tam]` com os valores `pp_exp / p_exp / m_exp / g_exp / gg_exp / g1_exp / g2_exp / g3_exp` da expedição aberta.
- Criar helper `enviadoNesteRegistro(row, tam)` a partir de `editingExpedicaoGrade`.
- Ajustar `saldoCell` para: `max(0, produzida − enviada_anterior + enviadoNesteRegistro)`. Assim o `max` dos inputs libera as quantidades daquele registro para edição/reimpressão.
- Nenhuma mudança em schema, RLS, edge functions ou em outras telas.

## Fora do escopo

- Sem botão separado "Reimprimir": a reimpressão é abrir o registro no histórico e clicar em Imprimir Ficha.
- Sem mudanças no fluxo de nova saída parcial nem no layout de impressão.
