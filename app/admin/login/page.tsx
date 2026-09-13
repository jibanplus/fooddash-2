'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UtensilsCrossed, ShieldCheck, Lock, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Link from 'next/link';
import { signInForRole, sendAdminResetEmail } from '@/lib/auth';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please enter your credentials'); return; }
    setLoading(true);
    try {
      await signInForRole(email.trim(), password, 'admin');
      toast.success('Welcome, Admin!');
      router.push('/admin/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-accent via-background to-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold">FoodDash</span>
        </Link>

        <div className="rounded-2xl border bg-card p-8 shadow-lg animate-slide-up">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Admin Portal</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Internal access — authorized personnel only
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@fooddash.com"
                  className="h-11 pl-10"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 pl-10"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={async () => {
                if (!email) { toast.error('Enter your registered email first.'); return; }
                try { await sendAdminResetEmail(email.trim()); toast.success('Password reset email sent.'); }
                catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to send reset email'); }
              }} className="text-xs font-medium text-primary hover:underline">Forgot password?</button>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

        </div>

        <button
          onClick={() => router.push('/')}
          className="mt-6 flex w-full items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </button>
      </div>
    </div>
  );
}
