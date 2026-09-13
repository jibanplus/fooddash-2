'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UtensilsCrossed, Mail, User, Lock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'form' | 'check-email' | 'success'>('form');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      toast.error('Please enter a name');
      return;
    }

    if (cleanName.length < 3) {
      toast.error('Name must be at least 2 characters');
      return;
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);

      const redirectTo = `${window.location.origin}/auth/signup`;

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            name: cleanName,
            role: 'customer',
          },
        },
      });

      if (error) throw error;

      // When email confirmation is enabled, Supabase sends a confirmation link.
      if (!data.session) {
        setName(cleanName);
        setEmail(cleanEmail);
        setStep('check-email');
        toast.success('Confirmation link sent to your email');
      } else {
        setStep('success');
        toast.success('Account created successfully');
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 1000);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Unable to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-accent via-background to-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold">FoodDash</span>
        </Link>

        <div className="rounded-2xl border bg-card p-8 shadow-lg animate-slide-up">
          {step === 'form' && (
            <>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-7 w-7 text-primary" />
                </div>

                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign up to order food on FoodDash
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Name
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="h-11 text-base"
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-11 text-base"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      className="h-11 pr-10 text-base"
                      autoComplete="new-password"
                    />
                    <Lock className="pointer-events-none absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>



                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSignup}
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                A confirmation link will be sent to your email. Click the link
                to activate your account.
              </p>
            </>
          )}

          {step === 'check-email' && (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-10 w-10 text-primary" />
              </div>

              <h1 className="text-2xl font-bold">Check your email</h1>

              <p className="mt-3 text-sm text-muted-foreground">
                We sent a confirmation link to
              </p>
              <p className="mt-1 font-medium">{email}</p>

              <p className="mt-4 text-sm text-muted-foreground">
                Open the email and click <strong>Confirm your email</strong>.
                Your FoodDash account will then be activated.
              </p>

              <Button
                variant="outline"
                className="mt-6 w-full"
                onClick={() => setStep('form')}
              >
                Back to Sign Up
              </Button>
            </div>
          )}

          {step === 'success' && (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <Check className="h-10 w-10 text-green-600" />
              </div>

              <h1 className="text-2xl font-bold">Account Activated!</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Welcome to FoodDash, {name}.
              </p>

              <Button
                className="mt-6 w-full"
                size="lg"
                onClick={() => router.push('/')}
              >
                Start Ordering
              </Button>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/" className="font-medium text-primary hover:underline">
            Go to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
