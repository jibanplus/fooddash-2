'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  UtensilsCrossed,
  ShoppingCart,
  MapPin,
  User,
  LogOut,
} from 'lucide-react';

import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';

export function SiteHeader({ location }: { location?: string }) {
  const { totalItems, setIsOpen } = useCart();

  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

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

        <div className="flex items-center gap-3">

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

          {user ? (
            <>
              <Link href="/orders/track">
                <Button variant="ghost" size="sm">
                  Orders
                </Button>
              </Link>

              <div className="hidden text-right sm:block">
                <p className="text-xs text-muted-foreground">
                  Logged in
                </p>
                <p className="text-sm font-medium">
                  {user.phoneNumber || 'User'}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="mr-1.5 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <Link href="/auth/signup">
              <Button variant="outline" size="sm">
                <User className="mr-1.5 h-4 w-4" />
                Sign Up
              </Button>
            </Link>
          )}

        </div>
      </div>
    </header>
  );
}
