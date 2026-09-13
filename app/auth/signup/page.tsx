'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UtensilsCrossed,
  Phone,
  ArrowLeft,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Link from 'next/link';

import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

export default function SignupPage() {
  const router = useRouter();

  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        {
          size: 'invisible',
          callback: () => {},
        }
      );
    }

    return () => {
      // Keep verifier available between OTP attempts.
    };
  }, []);

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setLoading(true);

      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          'recaptcha-container',
          {
            size: 'invisible',
            callback: () => {},
          }
        );
      }

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        `+91${phone}`,
        window.recaptchaVerifier
      );

      window.confirmationResult = confirmationResult;

      setStep('otp');
      toast.success('OTP sent to your phone');
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.message || 'Failed to send OTP. Please try again.'
      );

      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch {}
        window.recaptchaVerifier = undefined;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    if (!window.confirmationResult) {
      toast.error('Please request a new OTP');
      return;
    }

    try {
      setLoading(true);

      await window.confirmationResult.confirm(otpString);

      setStep('success');
      toast.success('Account created successfully!');
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.code === 'auth/invalid-verification-code'
          ? 'Invalid OTP. Please try again.'
          : error?.message || 'OTP verification failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp(['', '', '', '', '', '']);
    await handleSendOtp();
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
    e: React.KeyboardEvent
  ) => {
    if (
      e.key === 'Backspace' &&
      !otp[index] &&
      index > 0
    ) {
      document.getElementById(`otp-${index - 1}`)?.focus();
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

          {step === 'phone' && (
            <>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Phone className="h-7 w-7 text-primary" />
                </div>

                <h1 className="text-2xl font-bold">
                  Create your account
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  Sign up with your phone number to start ordering
                </p>
              </div>

              <div className="space-y-4">

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Phone Number
                  </label>

                  <div className="flex gap-2">
                    <div className="flex h-11 w-16 items-center justify-center rounded-md border border-input bg-muted text-sm font-medium">
                      +91
                    </div>

                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) =>
                        setPhone(
                          e.target.value
                            .replace(/\D/g, '')
                            .slice(0, 10)
                        )
                      }
                      placeholder="98765 43210"
                      className="h-11 flex-1 text-base"
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </Button>

              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                By signing up you agree to our Terms & Privacy Policy
              </p>
            </>
          )}

          {step === 'otp' && (
            <>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <ShieldCheck className="h-7 w-7 text-primary" />
                </div>

                <h1 className="text-2xl font-bold">
                  Verify your number
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the 6-digit code sent to +91 {phone}
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
                {loading
                  ? 'Verifying...'
                  : 'Verify & Create Account'}
              </Button>

              <div className="mt-4 text-center">
                <button
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>

              <button
                onClick={() => {
                  setStep('phone');
                  setOtp(['', '', '', '', '', '']);
                }}
                className="mt-2 flex w-full items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Change number
              </button>
            </>
          )}

          {step === 'success' && (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                <Check className="h-10 w-10 text-success" />
              </div>

              <h1 className="text-2xl font-bold">
                Welcome to FoodDash!
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Your account has been created successfully.
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

        <div id="recaptcha-container" />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/"
            className="font-medium text-primary hover:underline"
          >
            Go to home
          </Link>
        </p>

      </div>
    </div>
  );
}
