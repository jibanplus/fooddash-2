'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return toast.error('Enter a valid email address');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success('Password reset link sent');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-accent via-background to-background px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><UtensilsCrossed className="h-6 w-6" /></div><span className="text-2xl font-bold">FoodDash</span></Link>
        {!sent ? <>
          <h1 className="text-2xl font-bold">Forgot Password?</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your registered email. We will send a secure password reset link.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div><label className="mb-1.5 block text-sm font-medium">Email</label><div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-10" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /></div></div>
            <Button className="w-full" size="lg" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</Button>
          </form>
        </> : <div className="py-6 text-center"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"><Mail className="h-8 w-8 text-primary" /></div><h1 className="text-2xl font-bold">Check your email</h1><p className="mt-3 text-sm text-muted-foreground">A password reset link has been sent to</p><p className="mt-1 font-medium">{email}</p><Button className="mt-6 w-full" onClick={() => router.push('/auth/login')}>Back to Login</Button></div>}
        {!sent && <p className="mt-6 text-center text-sm text-muted-foreground"><Link href="/auth/login" className="font-medium text-primary hover:underline">Back to Login</Link></p>}
      </div>
    </div>
  );
}
