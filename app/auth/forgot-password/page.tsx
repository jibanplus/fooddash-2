"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (error) {
        alert(error.message);
        return;
      }

      setSent(true);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to send reset email."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/20 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-card p-8 shadow-lg">
          {!sent ? (
            <>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-7 w-7 text-primary" />
                </div>

                <h1 className="text-2xl font-bold">
                  Forgot Password?
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your email and we'll send you a password reset link.
                </p>
              </div>

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Email Address
                  </label>

                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-11"
                    autoComplete="email"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm">
                <Link
                  href="/auth/login"
                  className="font-medium text-primary hover:underline"
                >
                  ← Back to Login
                </Link>
              </p>
            </>
          ) : (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-10 w-10 text-primary" />
              </div>

              <h1 className="text-2xl font-bold">
                Check your email
              </h1>

              <p className="mt-3 text-sm text-muted-foreground">
                We sent a password reset link to
              </p>

              <p className="mt-1 font-medium">{email}</p>

              <p className="mt-4 text-sm text-muted-foreground">
                Open the email and click the reset link to create a new
                password.
              </p>

              <Link href="/auth/login">
                <Button variant="outline" className="mt-6 w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
