import Link from 'next/link';
import { UtensilsCrossed, Bike, ShieldCheck, Store } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="border-t bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">FoodDash</span>
            </div>
            <p className="text-sm text-background/60">
              Your favourite food, delivered fast. Partner with us, ride with us, or manage the platform.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-background/50">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-background/80 transition-colors hover:text-primary">Home</Link></li>
              <li><Link href="/auth/signup" className="text-background/80 transition-colors hover:text-primary">Sign Up</Link></li>
              <li><Link href="/orders/track" className="text-background/80 transition-colors hover:text-primary">Track Order</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-background/50">For Partners</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/restaurant/login" className="flex items-center gap-2 text-background/80 transition-colors hover:text-primary">
                  <Store className="h-4 w-4" /> Partner with Us
                </Link>
              </li>
              <li>
                <Link href="/delivery/login" className="flex items-center gap-2 text-background/80 transition-colors hover:text-primary">
                  <Bike className="h-4 w-4" /> Ride with Us
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="flex items-center gap-2 text-background/80 transition-colors hover:text-primary">
                  <ShieldCheck className="h-4 w-4" /> Internal Portal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-background/50">Support</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-background/80">help@fooddash.com</li>
              <li className="text-background/80">+91 1800-FOOD-FAST</li>
              <li className="text-background/80">Available 24/7</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-background/10 pt-6 sm:flex-row">
          <p className="text-xs text-background/50">© 2026 FoodDash. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-background/50">
            <Link href="/" className="transition-colors hover:text-primary">Privacy</Link>
            <Link href="/" className="transition-colors hover:text-primary">Terms</Link>
            <Link href="/" className="transition-colors hover:text-primary">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
