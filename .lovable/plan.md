Atualmente o sistema possui apenas o fluxo de recuperação de senha (esqueci a senha via email). Não existe uma forma para o usuário logado alterar sua própria senha diretamente dentro do aplicativo.

O plano é adicionar essa funcionalidade de forma simples e integrada à interface existente:

1. **AuthContext** — Adicionar a função `updatePassword` expondo `supabase.auth.updateUser({ password })` para que componentes possam chamá-la.

2. **Página de Alterar Senha** — Criar uma nova rota `/alterar-senha` com um formulário contendo:
   - Senha atual (obrigatória)
   - Nova senha (mínimo 6 caracteres)
   - Confirmação da nova senha
   - Validação de coincidência e comprimento mínimo
   - Feedback visual de sucesso/erro via toast
   - Layout consistente com as demais páginas internas (não usar card centralizado de login, mas sim uma página com header e container como as outras telas do sistema)

3. **Acesso via Sidebar** — Adicionar um link "Alterar Senha" na área inferior do sidebar, próximo ao botão de logout e ao email do usuário logado, usando o ícone `Lock` do lucide-react. Garantir que o link respeite o estado `collapsed` da sidebar.

4. **Roteamento** — Registrar a nova rota `/alterar-senha` dentro do `<ProtectedRoute>` e `<AppLayout>` em `App.tsx`, para que apenas usuários autenticados possam acessá-la.

5. **Validações** — Verificar que a nova senha e confirmação coincidem antes de enviar ao Supabase. Caso a senha atual esteja incorreta, o Supabase retornará erro adequado que será exibido ao usuário.

Sem alterações no banco de dados ou backend necessárias — a funcionalidade usa a API de autenticação do Supabase (`auth.updateUser`) já disponível.