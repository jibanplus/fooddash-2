import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // --------------------------------------------------
    // 1. Check logged-in admin
    // --------------------------------------------------
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      throw new Error('Unauthorized');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error('Supabase environment variables are missing');
    }

    const userClient = createClient(
      supabaseUrl,
      anonKey,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const {
      data: { user: caller },
      error: callerError,
    } = await userClient.auth.getUser();

    if (callerError || !caller) {
      throw new Error('Unauthorized');
    }

    // Service-role client
    const admin = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    // --------------------------------------------------
    // 2. Verify caller is Admin
    // --------------------------------------------------
    const { data: roleRow, error: roleCheckError } =
      await admin
        .from('user_roles')
        .select('role')
        .eq('user_id', caller.id)
        .eq('role', 'admin')
        .maybeSingle();

    if (roleCheckError) {
      throw roleCheckError;
    }

    if (!roleRow) {
      throw new Error('Admin access required');
    }

    // --------------------------------------------------
    // 3. Read request
    // --------------------------------------------------
    const body = await req.json();

    const email = String(body.email || '')
      .trim()
      .toLowerCase();

    const password = String(body.password || '');

    const name = String(body.name || '').trim();

    const phone = String(body.phone || '').trim();

    const role = String(body.role || '').trim();

    const status =
      body.status ||
      (role === 'restaurant' ? 'pending' : 'active');

    if (!email || !password || !name) {
      throw new Error(
        'Name, email and password are required'
      );
    }

    if (
      ![
        'customer',
        'restaurant',
        'delivery',
        'admin',
      ].includes(role)
    ) {
      throw new Error('Invalid account role');
    }

    if (password.length < 8) {
      throw new Error(
        'Password must be at least 8 characters'
      );
    }

    // --------------------------------------------------
    // 4. Create Supabase Auth user
    // --------------------------------------------------
    const {
      data: created,
      error: createError,
    } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        phone,
        role,
      },
    });

    if (createError || !created.user) {
      throw createError ||
        new Error('Auth user creation failed');
    }

    const userId = created.user.id;

    // --------------------------------------------------
    // 5. Create / update profile
    // IMPORTANT:
    // Do NOT use upsert/onConflict because the existing
    // FoodDash DB may not have the expected constraint.
    // --------------------------------------------------

    const {
      data: existingProfile,
      error: profileLookupError,
    } = await admin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (profileLookupError) {
      throw profileLookupError;
    }

    if (existingProfile) {
      const { error } = await admin
        .from('profiles')
        .update({
          email,
          full_name: name,
          phone,
          role,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }
    } else {
      const { error } = await admin
        .from('profiles')
        .insert({
          id: userId,
          email,
          full_name: name,
          phone,
          role,
          status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }
    }

    // --------------------------------------------------
    // 6. Add user role
    // IMPORTANT:
    // No upsert / no onConflict.
    // --------------------------------------------------

    const {
      data: existingRole,
      error: existingRoleError,
    } = await admin
      .from('user_roles')
      .select('user_id')
      .eq('user_id', userId)
      .eq('role', role)
      .maybeSingle();

    if (existingRoleError) {
      throw existingRoleError;
    }

    if (!existingRole) {
      const { error } = await admin
        .from('user_roles')
        .insert({
          user_id: userId,
          role,
        });

      if (error) {
        throw error;
      }
    }

    // --------------------------------------------------
    // 7. Restaurant account
    // --------------------------------------------------

    if (role === 'restaurant') {
      const {
        data: existingRestaurant,
        error: restaurantLookupError,
      } = await admin
        .from('restaurants')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle();

      if (restaurantLookupError) {
        throw restaurantLookupError;
      }

      if (!existingRestaurant) {
        const { error } = await admin
          .from('restaurants')
          .insert({
            owner_id: userId,
            owner_email: email,
            name,
            status:
              status === 'active'
                ? 'approved'
                : 'pending',
          });

        if (error) {
          throw error;
        }
      }
    }

    // --------------------------------------------------
    // 8. Delivery Partner
    // --------------------------------------------------

    if (role === 'delivery') {
      const {
        data: existingPartner,
        error: partnerLookupError,
      } = await admin
        .from('delivery_partners')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (partnerLookupError) {
        throw partnerLookupError;
      }

      if (!existingPartner) {
        const { error } = await admin
          .from('delivery_partners')
          .insert({
            user_id: userId,
            name,
            email,
            phone,
            status: 'offline',
          });

        if (error) {
          throw error;
        }
      }
    }

    // --------------------------------------------------
    // 9. Success
    // --------------------------------------------------

    return new Response(
      JSON.stringify({
        ok: true,
        user_id: userId,
        email,
        role,
        message: 'Account created successfully',
      }),
      {
        status: 200,
        headers: {
          ...cors,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : 'Unknown error';

    console.error('admin-create-user error:', message);

    return new Response(
      JSON.stringify({
        ok: false,
        error: message,
      }),
      {
        status: 400,
        headers: {
          ...cors,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
