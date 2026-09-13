'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  UtensilsCrossed,
  ShoppingCart,
  MapPin,
  User,
  LogOut,
  Headphones,
  ClipboardList,
  Receipt,
} from 'lucide-react';

import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

export function SiteHeader({ location }: { location?: string }) {
  const { totalItems, setIsOpen } = useCart();

  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) {
        setUser(data.user ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo + Location */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <UtensilsCrossed className="h-5 w-5" />
            </div>

            <span className="text-xl font-bold">
              FoodDash
            </span>
          </Link>

          {location && (
            <div className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
              <MapPin className="h-4 w-4 text-primary" />

              <span className="font-medium text-foreground">
                {location}
              </span>
            </div>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">

          {/* =========================
              LOGGED OUT
             ========================= */}
          {!user && (
            <>
              {/* Login */}
              <Link href="/auth/login">
                <Button
                  variant="ghost"
                  size="sm"
                >
                  Login
                </Button>
              </Link>

              {/* Sign Up */}
              <Link href="/auth/signup">
                <Button
                  variant="outline"
                  size="sm"
                >
                  <User className="mr-1.5 h-4 w-4" />
                  Sign Up
                </Button>
              </Link>
            </>
          )}

          {/* =========================
              LOGGED IN
             ========================= */}
          {user && (
            <>
              {/* Cart */}
              <Button
                variant="ghost"
                size="sm"
                className="relative"
                onClick={() => setIsOpen(true)}
              >
                <ShoppingCart className="h-5 w-5" />

                {totalItems > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {totalItems}
                  </span>
                )}
              </Button>

              {/* Orders */}
              <Link href="/orders/track">
                <Button
                  variant="ghost"
                  size="sm"
                >
                  <ClipboardList className="mr-1.5 h-4 w-4" />
                  Orders
                </Button>
              </Link>

              {/* Transactions */}
              <Link href="/transactions">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex"
                >
                  <Receipt className="mr-1.5 h-4 w-4" />
                  Transactions
                </Button>
              </Link>

              {/* Help */}
              <Link href="/support">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex"
                >
                  <Headphones className="mr-1.5 h-4 w-4" />
                  Help
                </Button>
              </Link>

              {/* Logout */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="mr-1.5 h-4 w-4" />
                Logout
              </Button>
            </>
          )}

        </div>
      </div>
    </header>
  );
}
