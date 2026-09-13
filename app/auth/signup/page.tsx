'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UtensilsCrossed, Mail, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();

  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      setEmail(cleanEmail);
      setStep('otp');

      toast.success('OTP sent to your email');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');

    if (code.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      });

      if (error) throw error;

      setStep('success');
      toast.success('Welcome to FoodDash!');

      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1200);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleResendOtp = async () => {
    setOtp(['', '', '', '', '', '']);
    await handleSendOtp();
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

          {step === 'email' && (
            <>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-7 w-7 text-primary" />
                </div>

                <h1 className="text-2xl font-bold">
                  Welcome to FoodDash
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your email to create your FoodDash account
                </p>
              </div>

              <div className="space-y-4">
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

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? 'Sending OTP...' : 'Continue with Email'}
                </Button>
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                We will send a secure 6-digit verification code to your email.
              </p>
            </>
          )}

          {step === 'otp' && (
            <>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-7 w-7 text-primary" />
                </div>

                <h1 className="text-2xl font-bold">
                  Verify your email
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the 6-digit code sent to
                </p>

                <p className="mt-1 text-sm font-medium">
                  {email}
                </p>
              </div>

              <div className="mb-6 flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) =>
                      handleOtpChange(index, e.target.value)
                    }
                    onKeyDown={(e) =>
                      handleOtpKeyDown(index, e)
                    }
                    className="h-12 w-12 rounded-lg border border-input bg-background text-center text-xl font-bold focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ))}
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify & Create Account'}
              </Button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="mt-4 w-full text-sm font-medium text-primary hover:underline disabled:opacity-50"
              >
                Resend OTP
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setOtp(['', '', '', '', '', '']);
                }}
                className="mt-3 flex w-full items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Change email
              </button>
            </>
          )}

          {step === 'success' && (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <Check className="h-10 w-10 text-green-600" />
              </div>

              <h1 className="text-2xl font-bold">
                Welcome to FoodDash!
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Your account is ready. Happy ordering!
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
          <Link
            href="/"
            className="font-medium text-primary hover:underline"
          >
            Go to Home
          </Link>
        </p>

      </div>
    </div>
  );
}
