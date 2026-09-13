'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) return toast.error('Enter email and password');
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (!data.user) return toast.error('Unable to login');
    toast.success('Login successful');
    router.push('/');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-accent via-background to-background px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><UtensilsCrossed className="h-6 w-6" /></div>
          <span className="text-2xl font-bold">FoodDash</span>
        </Link>
        <h1 className="text-center text-2xl font-bold">Login</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Login to your FoodDash account</p>
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-10" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /></div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Password</label>
            <div className="relative"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-10" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" /></div>
          </div>
          <div className="text-right"><Link href="/auth/forgot-password" className="text-sm font-medium text-primary hover:underline">Forgot Password?</Link></div>
          <Button className="w-full" size="lg" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">Don't have an account? <Link href="/auth/signup" className="font-medium text-primary hover:underline">Sign Up</Link></p>
      </div>
    </div>
  );
}
