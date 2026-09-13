import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });

const allowedRoles = ['customer', 'restaurant', 'delivery', 'admin'] as const;
const allowedStatuses = ['active', 'pending', 'suspended', 'inactive'] as const;

type Role = (typeof allowedRoles)[number];
type Status = (typeof allowedStatuses)[number];

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`${name} is not configured in Supabase Edge Functions`);
  return value;
}

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);

  let createdUserId: string | null = null;
  let adminClient: ReturnType<typeof createClient> | null = null;

  try {
    // 1. Environment
    const supabaseUrl = requiredEnv('SUPABASE_URL');
    const anonKey = requiredEnv('SUPABASE_ANON_KEY');
    const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');

    // 2. Require the caller's Supabase access token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ ok: false, error: 'Unauthorized' }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data: callerData, error: callerError } = await userClient.auth.getUser();
    if (callerError || !callerData.user) {
      return json({ ok: false, error: 'Unauthorized' }, 401);
    }

    // 3. Service-role client (never expose this key to the browser)
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    // 4. Verify the caller is an admin in the database
    const { data: roleRow, error: roleError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', callerData.user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError) throw new Error(`Admin role check failed: ${roleError.message}`);
    if (!roleRow) return json({ ok: false, error: 'Admin access required' }, 403);

    // 5. Validate request
    const body = await req.json();
    const email = cleanString(body?.email).toLowerCase();
    const password = typeof body?.password === 'string' ? body.password : '';
    const name = cleanString(body?.name);
    const phone = cleanString(body?.phone);
    const role = cleanString(body?.role) as Role;
    const requestedStatus = cleanString(body?.status) as Status;

    if (!email || !password || !name) {
      return json({ ok: false, error: 'Name, email and password are required' }, 400);
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return json({ ok: false, error: 'Please enter a valid email address' }, 400);
    }

    if (password.length < 8) {
      return json({ ok: false, error: 'Password must be at least 8 characters' }, 400);
    }

    if (!allowedRoles.includes(role)) {
      return json({ ok: false, error: 'Invalid account role' }, 400);
    }

    const status: Status = allowedStatuses.includes(requestedStatus)
      ? requestedStatus
      : role === 'restaurant'
        ? 'pending'
        : 'active';

    // Restaurants must not be active before admin approval.
    const profileStatus: Status = role === 'restaurant' ? 'pending' : status;

    // 6. Prevent duplicate email before creating Auth user
    const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) throw new Error(`Unable to check existing accounts: ${listError.message}`);

    const emailExists = existingUsers.users.some(
      (u) => (u.email || '').toLowerCase() === email,
    );

    if (emailExists) {
      return json({ ok: false, error: 'An account with this email already exists' }, 409);
    }

    // 7. Create Supabase Auth account
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone, role },
    });

    if (createError || !created.user) {
      throw new Error(createError?.message || 'Auth user creation failed');
    }

    createdUserId = created.user.id;

    // The database trigger may already have created these rows. Update them instead of
    // relying on an ON CONFLICT constraint that may differ between projects.
    const now = new Date().toISOString();

    const { data: existingProfile, error: profileLookupError } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', createdUserId)
      .maybeSingle();

    if (profileLookupError) throw new Error(`Profile lookup failed: ${profileLookupError.message}`);

    const profileValues = {
      id: createdUserId,
      name,
      email,
      phone,
      role,
      status: profileStatus,
      updated_at: now,
    };

    if (existingProfile) {
      const { error } = await adminClient
        .from('profiles')
        .update({ name, email, phone, role, status: profileStatus, updated_at: now })
        .eq('id', createdUserId);
      if (error) throw new Error(`Profile update failed: ${error.message}`);
    } else {
      const { error } = await adminClient.from('profiles').insert({
        ...profileValues,
        created_at: now,
      });
      if (error) throw new Error(`Profile creation failed: ${error.message}`);
    }

    // Role row: the migration uses (user_id, role) as the primary key.
    const { data: existingRole, error: roleLookupError } = await adminClient
      .from('user_roles')
      .select('user_id')
      .eq('user_id', createdUserId)
      .eq('role', role)
      .maybeSingle();

    if (roleLookupError) throw new Error(`Role lookup failed: ${roleLookupError.message}`);

    if (!existingRole) {
      const { error } = await adminClient.from('user_roles').insert({
        user_id: createdUserId,
        role,
      });
      if (error) throw new Error(`Role creation failed: ${error.message}`);
    }

    // 8. Create the partner record
    if (role === 'restaurant') {
      const { data: existingRestaurant, error: restaurantLookupError } = await adminClient
        .from('restaurants')
        .select('id')
        .eq('owner_id', createdUserId)
        .maybeSingle();

      if (restaurantLookupError) {
        throw new Error(`Restaurant lookup failed: ${restaurantLookupError.message}`);
      }

      if (existingRestaurant) {
        const { error } = await adminClient
          .from('restaurants')
          .update({
            owner_email: email,
            name,
            status: profileStatus === 'active' ? 'approved' : 'pending',
            updated_at: now,
          })
          .eq('id', existingRestaurant.id);
        if (error) throw new Error(`Restaurant update failed: ${error.message}`);
      } else {
        const { error } = await adminClient.from('restaurants').insert({
          owner_id: createdUserId,
          owner_email: email,
          name,
          status: profileStatus === 'active' ? 'approved' : 'pending',
        });
        if (error) throw new Error(`Restaurant creation failed: ${error.message}`);
      }
    }

    if (role === 'delivery') {
      const { data: existingPartner, error: partnerLookupError } = await adminClient
        .from('delivery_partners')
        .select('id')
        .eq('user_id', createdUserId)
        .maybeSingle();

      if (partnerLookupError) {
        throw new Error(`Delivery partner lookup failed: ${partnerLookupError.message}`);
      }

      if (existingPartner) {
        const { error } = await adminClient
          .from('delivery_partners')
          .update({ name, email, phone, updated_at: now })
          .eq('id', existingPartner.id);
        if (error) throw new Error(`Delivery partner update failed: ${error.message}`);
      } else {
        const { error } = await adminClient.from('delivery_partners').insert({
          user_id: createdUserId,
          name,
          email,
          phone,
          status: 'offline',
        });
        if (error) throw new Error(`Delivery partner creation failed: ${error.message}`);
      }
    }

    return json({
      ok: true,
      user_id: createdUserId,
      email,
      role,
      status: profileStatus,
      message: 'Account created successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';

    // If anything after Auth creation fails, remove the Auth user so we do not leave
    // a half-created account behind.
    if (createdUserId && adminClient) {
      try {
        await adminClient.auth.admin.deleteUser(createdUserId);
      } catch (cleanupError) {
        console.error('Account cleanup failed:', cleanupError);
      }
    }

    console.error('admin-create-user error:', message);
    return json({ ok: false, error: message }, 400);
  }
});
