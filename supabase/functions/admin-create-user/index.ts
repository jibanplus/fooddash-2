import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) throw new Error('Unauthorized');

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: roleRow } = await admin.from('user_roles').select('role').eq('user_id', caller.id).eq('role', 'admin').maybeSingle();
    if (!roleRow) throw new Error('Admin access required');

    const body = await req.json();
    const { email, password, name, phone = '', role, status = role === 'restaurant' ? 'pending' : 'active' } = body;
    if (!email || !password || !name || !['customer','restaurant','delivery','admin'].includes(role)) throw new Error('Missing/invalid account fields');
    if (password.length < 8) throw new Error('Password must be at least 8 characters');

    const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name, phone, role } });
    if (createError || !created.user) throw createError || new Error('Auth user creation failed');

    const { error: profileError } = await admin.from('profiles').upsert({ id: created.user.id, name, email, phone, role, status }, { onConflict: 'id' });
    if (profileError) throw profileError;
    const { error: roleError } = await admin.from('user_roles').upsert({ user_id: created.user.id, role }, { onConflict: 'user_id,role' });
    if (roleError) throw roleError;

    if (role === 'restaurant') await admin.from('restaurants').insert({ owner_id: created.user.id, owner_email: email, name, status: status === 'active' ? 'approved' : 'pending' });
    if (role === 'delivery') await admin.from('delivery_partners').insert({ user_id: created.user.id, name, email, phone, status: 'offline' });

    return new Response(JSON.stringify({ ok: true, user_id: created.user.id, email }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : 'Unknown error' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
