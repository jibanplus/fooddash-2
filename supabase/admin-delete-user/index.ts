import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) throw new Error('Unauthorized');

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleRow) throw new Error('Admin access required');

    const body = await req.json();
    const { user_id, email, partner_type, partner_id } = body;

    if (!['restaurant', 'delivery'].includes(partner_type)) {
      throw new Error('Invalid partner type');
    }

    let targetId = user_id || null;

    if (!targetId && email) {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) throw error;
      const found = data.users.find((u) => u.email?.toLowerCase() === String(email).toLowerCase());
      targetId = found?.id || null;
    }

    if (partner_type === 'restaurant') {
      if (partner_id) await admin.from('restaurants').delete().eq('id', partner_id);
      if (targetId) await admin.from('restaurants').delete().eq('owner_id', targetId);
    }

    if (partner_type === 'delivery') {
      if (partner_id) await admin.from('delivery_partners').delete().eq('id', partner_id);
      if (targetId) await admin.from('delivery_partners').delete().eq('user_id', targetId);
    }

    if (targetId) {
      await admin.from('user_roles').delete().eq('user_id', targetId);
      await admin.from('profiles').delete().eq('id', targetId);

      const { error } = await admin.auth.admin.deleteUser(targetId);
      if (error && !error.message.toLowerCase().includes('not found')) throw error;
    }

    return new Response(JSON.stringify({ ok: true, user_id: targetId }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
