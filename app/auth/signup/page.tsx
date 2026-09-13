"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Check } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "check-email" | "success">("form");

  const handleSignup = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      alert("Please enter your name.");
      return;
    }

    if (!cleanEmail || !cleanEmail.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/signup`,
          data: {
            name: cleanName,
            username: cleanName,
            role: "customer",
          },
        },
      });

      if (error) {
        alert(error.message);
        return;
      }

      if (data.session) {
        setStep("success");
      } else {
        setStep("check-email");
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/20 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-card p-8 shadow-lg">
          {step === "form" && (
            <>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-7 w-7 text-primary" />
                </div>

                <h1 className="text-2xl font-bold">
                  Create your account
                </h1>

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
                    className="h-11"
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-11 pl-10"
                      autoComplete="email"
                    />
                  </div>
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
                      className="h-11 pr-10"
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
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                A confirmation link will be sent to your email. Click the
                link to activate your account.
              </p>
            </>
          )}

          {step === "check-email" && (
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
                onClick={() => setStep("form")}
              >
                Back to Sign Up
              </Button>
            </div>
          )}

          {step === "success" && (
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
                onClick={() => router.push("/")}
              >
                Start Ordering
              </Button>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-primary hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
