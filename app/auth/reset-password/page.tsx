'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setReady(!!session));
    return () => listener.subscription.unsubscribe();
  }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('Password must be at least 8 characters.');
    if (password !== confirm) return toast.error('Passwords do not match.');
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success('Password updated successfully.'); router.push('/auth/login');
  };
  return <div className="flex min-h-screen items-center justify-center bg-secondary/20 px-4"><form onSubmit={submit} className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg">
    <div className="mb-6 flex items-center justify-center gap-2"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><UtensilsCrossed className="h-6 w-6" /></div><span className="text-2xl font-bold">FoodDash</span></div>
    <h1 className="text-xl font-bold">Set a new password</h1><p className="mt-1 text-sm text-muted-foreground">Use the secure reset link sent to the registered email.</p>
    {!ready && <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm">Open this page from the password-reset email.</p>}
    <div className="mt-5 space-y-4"><div><label className="mb-1 block text-sm font-medium">New password</label><div className="relative"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-10" type="password" value={password} onChange={e => setPassword(e.target.value)} /></div></div><div><label className="mb-1 block text-sm font-medium">Confirm password</label><Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} /></div><Button className="w-full" disabled={loading || !ready}>{loading ? 'Updating…' : 'Update password'}</Button></div>
  </form></div>;
}
