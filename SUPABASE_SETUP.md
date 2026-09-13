# FoodDash Supabase Auth setup

## 1. Run the SQL
Run `supabase/migrations/20260913_auth_and_partner_security.sql` in the Supabase SQL Editor.

## 2. Create the first admin
Create an Auth user in Supabase Dashboard → Authentication → Users using the admin email/password you want.
Then run:

```sql
insert into public.profiles (id, name, email, role, status)
select id, coalesce(raw_user_meta_data->>'name','Admin'), email, 'admin'::public.app_role, 'active'::public.account_status
from auth.users
where lower(email) = lower('YOUR_ADMIN_EMAIL')
on conflict (id) do update set role='admin'::public.app_role, status='active'::public.account_status;

insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role from auth.users
where lower(email) = lower('YOUR_ADMIN_EMAIL')
on conflict do nothing;
```

Replace `YOUR_ADMIN_EMAIL` before running.

## 3. Deploy the admin-create-user Edge Function
The Admin → Add Restaurant / Add Delivery Partner form now creates the actual Supabase Auth account through `admin-create-user`.

Deploy the function with the Supabase CLI from the project root:

```bash
supabase functions deploy admin-create-user
```

The function uses `SUPABASE_SERVICE_ROLE_KEY` only on the server. **Never** put the service-role key in `.env.local`, `NEXT_PUBLIC_*`, or browser code.

## 4. Configure password reset email
In Supabase Authentication → URL Configuration, add your production URL and:

`https://YOUR_DOMAIN/auth/reset-password`

The Admin → Reset Password action sends a secure Supabase recovery email to the user's registered email.

## 5. Password security
Passwords are intentionally **not viewable by Admin**. Supabase Auth does not expose plaintext passwords. The dashboard therefore shows the registered email and provides **Reset Password** instead of revealing a password. This is the safe way to recover access.

## 6. Role enforcement
The login pages now verify:
- Admin portal → `admin`
- Restaurant portal → `restaurant` + approved/active status
- Delivery portal → `delivery`

A restaurant marked suspended is changed to `profiles.status = suspended` by the admin RPC, so it stays blocked until Admin approves it again.
