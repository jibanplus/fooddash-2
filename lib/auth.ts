import { supabase } from './supabase';
import type { UserRole } from './types';

export async function signInForRole(email: string, password: string, expectedRole: UserRole) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(error?.message || 'Invalid login credentials');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, status, name, email')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    throw new Error('Account profile is not configured. Ask admin to complete the account setup.');
  }
  if (profile.role !== expectedRole) {
    await supabase.auth.signOut();
    throw new Error(`This account is registered as ${profile.role}. Please use the correct portal.`);
  }
  if (profile.status === 'suspended' || profile.status === 'inactive') {
    await supabase.auth.signOut();
    throw new Error('Account is suspended/inactive by admin. Login is blocked until admin changes the status.');
  }
  if (expectedRole === 'restaurant' && profile.status !== 'active') {
    await supabase.auth.signOut();
    throw new Error('Restaurant is not approved yet. Admin approval is required before login.');
  }
  return { user: data.user, profile };
}

export async function sendAdminResetEmail(email: string) {
  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/reset-password`
    : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw new Error(error.message);
}

export async function adminCreateAccount(input: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRole;
  status?: 'active' | 'pending' | 'suspended' | 'inactive';
}) {
  const email = input.email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw new Error('Please enter a valid email address, for example name@example.com');
  }

  const { data, error } = await supabase.functions.invoke('admin-create-user', {
    body: { ...input, email },
  });
  if (error) throw new Error(error.message || 'Unable to create account');
  if (!data?.ok) throw new Error(data?.error || 'Unable to create account');
  return data;
}
