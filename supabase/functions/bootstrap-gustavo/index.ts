import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async () => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  const email = "gustavo@mktec.local";
  const password = "Mktec@2026";

  const { data: existing } = await admin.auth.admin.listUsers();
  const found = existing.users.find((u) => u.email === email);
  let userId = found?.id;

  if (!userId) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Gustavo" },
    });
    if (error || !created.user) {
      return new Response(JSON.stringify({ error: error?.message }), { status: 500 });
    }
    userId = created.user.id;
  }

  await admin.from("user_roles").insert({ user_id: userId, role: "servicos" }).select();

  return new Response(JSON.stringify({ user_id: userId, email, password }), { headers: { "Content-Type": "application/json" } });
});
