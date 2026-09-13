'use client';

import { useState, useMemo } from 'react';
import { Star, Clock, Search, MapPin, Plus, Check, Leaf, Flame, ArrowRight } from 'lucide-react';
import { CartProvider, useCart } from '@/lib/cart-context';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { CartDrawer } from '@/components/cart-drawer';
import { mockRestaurants } from '@/lib/mock-data';
import type { Restaurant, MenuItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SupportDesk } from '@/components/support-desk';
import { getRestaurants, getOrders, setOrders, addTransaction, getTransactions, subscribeStore } from '@/lib/platform-store';
import { toast } from 'sonner';

function MarketplaceContent() {
  const router = useRouter();
  const { addItem, items: cartItems, subtotal: cartSubtotal, clearCart } = useCart();
  const [location, setLocation] = useState('Koramangala, Bangalore');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'address' | 'payment' | 'success'>('address');
  const [address, setAddress] = useState('');
  const [orderId, setOrderId] = useState('');
  const [restaurants, setRestaurants] = useState(mockRestaurants);
  const [customerOrders, setCustomerOrders] = useState(getOrders().filter(o=>o.customerName==='Priya Sharma'));
  const [customerTransactions, setCustomerTransactions] = useState(getTransactions().filter(t=>t.userId==='customer-demo'));
  useEffect(() => { const refresh=()=>{setRestaurants(getRestaurants());setCustomerOrders(getOrders().filter(o=>o.customerName==='Priya Sharma'));setCustomerTransactions(getTransactions().filter(t=>t.userId==='customer-demo'));}; refresh(); return subscribeStore(refresh); }, []);

  const approvedRestaurants = useMemo(
    () => restaurants.filter((r) => r.status === 'approved'),
    []
  );

  const filteredRestaurants = useMemo(() => {
    if (!searchQuery) return approvedRestaurants;
    return approvedRestaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [approvedRestaurants, searchQuery]);

  const handleAddItem = () => {
    if (!selectedMenuItem) return;
    const addons = (selectedMenuItem.addons || []).filter((a) =>
      selectedAddons.includes(a.name)
    );
    addItem(selectedMenuItem, quantity, addons);
    toast.success(`${quantity}× ${selectedMenuItem.name} added to cart`);
    setSelectedMenuItem(null);
    setSelectedAddons([]);
    setQuantity(1);
  };

  const handleCheckout = () => {
    setCheckoutOpen(true);
    setCheckoutStep('address');
  };

  const handlePlaceOrder = () => {
    const id = `FD-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
    const restaurantId = selectedRestaurant?.id || 'r1';
    const subtotal = cartSubtotal;
    const order = { id: `o-${Date.now()}`, orderId: id, customerName: 'Priya Sharma', customerPhone: '+91 90000 00000', deliveryAddress: address || 'Saved address', restaurantId, restaurantName: selectedRestaurant?.name || 'FoodDash Restaurant', items: cartItems, subtotal, deliveryFee: 40, tax: 25, total: subtotal+40+25, status: 'placed' as const, placedAt: new Date().toISOString(), paymentMethod: 'UPI', paymentStatus: 'paid' as const, commissionAmount: Math.round(subtotal*0.15) };
    const next=[...getOrders(), order]; setOrders(next); setCustomerOrders(next.filter(o=>o.customerName==='Priya Sharma'));
    addTransaction({id:`TX-C-${id}`,userId:'customer-demo',userType:'customer',type:'debit',amount:order.total,balance:0,description:'Customer payment · order placed',orderId:id,createdAt:new Date().toISOString()});
    addTransaction({id:`TX-${id}`,userId:'r1',userType:'restaurant',type:'credit',amount:subtotal-order.commissionAmount,balance:0,description:'Order settlement credit',orderId:id,createdAt:new Date().toISOString()});
    setOrderId(id); clearCart(); setCheckoutStep('success'); toast.success('Payment successful · Order placed');
  };

  return (
    <>
      <SiteHeader location={location} />
      <div className="mx-auto flex max-w-7xl justify-end px-4 pt-4 sm:px-6 lg:px-8"><SupportDesk role="customer" userId="customer-demo" /></div>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-accent via-background to-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div className="space-y-6 animate-slide-up">
              <Badge variant="secondary" className="rounded-full px-4 py-1.5 text-sm">
                <span className="mr-1.5 flex h-2 w-2 rounded-full bg-success" />
                200+ restaurants near you
              </Badge>
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Delicious food,
                <br />
                <span className="text-primary">delivered to your door</span>
              </h1>
              <p className="max-w-md text-lg text-muted-foreground">
                Order from your favourite restaurants and track your delivery in real time.
                Fast, fresh, and always on time.
              </p>

              {/* Location Bar */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter your location"
                    className="h-12 pl-10 text-base"
                  />
                </div>
                <Button size="lg" className="h-12" onClick={() => toast.success('Location updated')}>
                  Find Food
                </Button>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                <img
                  src="https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Food"
                  className="aspect-square w-full rounded-2xl object-cover shadow-lg"
                />
                <img
                  src="https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Pizza"
                  className="mt-8 aspect-square w-full rounded-2xl object-cover shadow-lg"
                />
                <img
                  src="https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Butter Chicken"
                  className="aspect-square w-full rounded-2xl object-cover shadow-lg"
                />
                <img
                  src="https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Sushi"
                  className="mt-8 aspect-square w-full rounded-2xl object-cover shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for restaurants or cuisines..."
              className="h-12 pl-10 text-base"
            />
          </div>
        </div>
      </section>

      {/* Restaurant Grid */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-2xl font-bold">Restaurants near you</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRestaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="group cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-lg animate-fade-in"
              onClick={() => setSelectedRestaurant(restaurant)}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={restaurant.coverImage}
                  alt={restaurant.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-success px-2 py-1 text-sm font-bold text-success-foreground">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {restaurant.rating}
                </div>
                {restaurant.menu.some((m) => m.isBestseller) && (
                  <div className="absolute right-2 top-2">
                    <Badge className="bg-primary text-primary-foreground">Bestseller</Badge>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold leading-tight">{restaurant.name}</h3>
                <p className="text-sm text-muted-foreground">{restaurant.cuisine}</p>
                <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" /> {restaurant.deliveryTime}
                  </span>
                  <span>₹{restaurant.priceForTwo} for two</span>
                </div>
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {restaurant.location}
                </p>
              </div>
            </div>
          ))}
        </div>
        {filteredRestaurants.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-lg font-semibold">No restaurants found</p>
            <p className="text-sm text-muted-foreground">Try a different search term.</p>
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="border-t bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-2xl font-bold">How it works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: '01', title: 'Browse & Select', desc: 'Choose from 200+ verified restaurants near you' },
              { step: '02', title: 'Order & Pay', desc: 'Add items to cart and pay securely via Paytm UPI' },
              { step: '03', title: 'Track & Enjoy', desc: 'Follow your order in real time until it arrives' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                  {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><div className="rounded-xl border bg-card p-5"><h2 className="mb-3 text-xl font-bold">My Order & Transaction History</h2>{customerOrders.length ? <div className="space-y-2">{customerOrders.slice().reverse().map(o=><div key={o.id} className="flex justify-between rounded-lg border p-3 text-sm"><span><b>{o.orderId}</b> · {o.restaurantName} · <Badge variant={o.status==='cancelled'?'destructive':'outline'}>{o.status}</Badge></span><span className="font-semibold">₹{o.total} · {o.paymentStatus}</span></div>)}</div> : <p className="text-sm text-muted-foreground">No orders yet.</p>}<h3 className="mt-5 mb-2 font-semibold">Payment Transactions</h3>{customerTransactions.map(t=><div key={t.id} className="flex justify-between border-b py-2 text-sm"><span>{t.description} · {t.orderId}</span><span className="font-semibold text-red-600">-₹{t.amount}</span></div>)}</div></section>
      <SiteFooter />

      {/* Restaurant Menu Modal */}
      {selectedRestaurant && (
        <Dialog open={!!selectedRestaurant} onOpenChange={(open) => !open && setSelectedRestaurant(null)}>
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden p-0">
            <div className="relative h-40 overflow-hidden">
              <img
                src={selectedRestaurant.coverImage}
                alt={selectedRestaurant.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-6 text-white">
                <h2 className="text-2xl font-bold">{selectedRestaurant.name}</h2>
                <p className="text-sm opacity-90">{selectedRestaurant.cuisine}</p>
                <div className="mt-1 flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-current" /> {selectedRestaurant.rating}
                  </span>
                  <span>•</span>
                  <span>{selectedRestaurant.deliveryTime}</span>
                  <span>•</span>
                  <span>₹{selectedRestaurant.priceForTwo} for two</span>
                </div>
              </div>
            </div>
            <div className="max-h-[calc(85vh-10rem)] overflow-y-auto p-6">
              {Object.entries(
                selectedRestaurant.menu.reduce((acc, item) => {
                  if (!acc[item.category]) acc[item.category] = [];
                  acc[item.category].push(item);
                  return acc;
                }, {} as Record<string, MenuItem[]>)
              ).map(([category, items]) => (
                <div key={category} className="mb-6">
                  <h3 className="mb-3 text-lg font-bold">{category}</h3>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4 rounded-lg border p-3 transition-colors hover:bg-accent/50">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-20 w-20 rounded-md object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-start gap-2">
                            <span className={`mt-0.5 inline-block h-3 w-3 shrink-0 rounded-sm border ${item.isVeg ? 'border-success' : 'border-destructive'}`}>
                              {item.isVeg ? (
                                <Leaf className="h-full w-full p-0.5 text-success" />
                              ) : (
                                <Flame className="h-full w-full p-0.5 text-destructive" />
                              )}
                            </span>
                            <div>
                              <p className="font-semibold leading-tight">{item.name}</p>
                              {item.isBestseller && (
                                <Badge variant="secondary" className="mt-1 text-xs">Bestseller</Badge>
                              )}
                            </div>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="font-bold text-primary">₹{item.price}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedMenuItem(item);
                                setSelectedAddons([]);
                                setQuantity(1);
                              }}
                            >
                              <Plus className="mr-1 h-4 w-4" /> Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Menu Item Add Modal (with addons) */}
      {selectedMenuItem && (
        <Dialog open={!!selectedMenuItem} onOpenChange={(open) => !open && setSelectedMenuItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <img
                src={selectedMenuItem.image}
                alt={selectedMenuItem.name}
                className="mb-3 h-40 w-full rounded-lg object-cover"
              />
              <DialogTitle className="flex items-center gap-2">
                <span className={`inline-block h-4 w-4 rounded-sm border ${selectedMenuItem.isVeg ? 'border-success' : 'border-destructive'}`}>
                  {selectedMenuItem.isVeg ? (
                    <Leaf className="h-full w-full p-0.5 text-success" />
                  ) : (
                    <Flame className="h-full w-full p-0.5 text-destructive" />
                  )}
                </span>
                {selectedMenuItem.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">{selectedMenuItem.description}</p>
              <p className="text-lg font-bold text-primary">₹{selectedMenuItem.price}</p>
            </DialogHeader>

            {selectedMenuItem.addons && selectedMenuItem.addons.length > 0 && (
              <div className="space-y-2 py-2">
                <p className="text-sm font-semibold">Customize your order</p>
                {selectedMenuItem.addons.map((addon) => (
                  <label key={addon.name} className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-accent/50">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedAddons.includes(addon.name)}
                        onCheckedChange={(checked) => {
                          setSelectedAddons((prev) =>
                            checked ? [...prev, addon.name] : prev.filter((a) => a !== addon.name)
                          );
                        }}
                      />
                      <span className="text-sm">{addon.name}</span>
                    </div>
                    <span className="text-sm font-medium">+₹{addon.price}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border"
                >
                  -
                </button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border"
                >
                  +
                </button>
              </div>
              <Button onClick={handleAddItem} className="flex-1 ml-4">
                Add to Cart · ₹{(selectedMenuItem.price + (selectedMenuItem.addons || []).filter((a) => selectedAddons.includes(a.name)).reduce((s, a) => s + a.price, 0)) * quantity}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Checkout Modal */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-md">
          {checkoutStep === 'address' && (
            <>
              <DialogHeader>
                <DialogTitle>Delivery Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Full Name</label>
                  <Input placeholder="Enter your name" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Phone Number</label>
                  <Input placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Delivery Address</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Flat / House no, Building, Street, Area"
                    className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
              <Button
                className="w-full"
                disabled={!address.trim()}
                onClick={() => setCheckoutStep('payment')}
              >
                Continue to Payment
              </Button>
            </>
          )}

          {checkoutStep === 'payment' && (
            <>
              <DialogHeader>
                <DialogTitle>Payment Method</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="flex items-center gap-3 rounded-lg border-2 border-primary bg-accent/50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    U
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Paytm UPI</p>
                    <p className="text-xs text-muted-foreground">Pay instantly via UPI</p>
                  </div>
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <div className="rounded-lg border p-4 opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <span className="text-sm font-bold">C</span>
                    </div>
                    <div>
                      <p className="font-semibold">Credit / Debit Card</p>
                      <p className="text-xs text-muted-foreground">Coming soon</p>
                    </div>
                  </div>
                </div>
              </div>
              <Button className="w-full" size="lg" onClick={handlePlaceOrder}>
                Pay & Place Order
              </Button>
            </>
          )}

          {checkoutStep === 'success' && (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                <Check className="h-10 w-10 text-success" />
              </div>
              <h2 className="text-2xl font-bold">Order Placed!</h2>
              <p className="mt-2 text-muted-foreground">
                Your order <span className="font-semibold text-foreground">{orderId}</span> has been placed successfully.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">You can track your order in real time.</p>
              <div className="mt-6 flex flex-col gap-2">
                <Button onClick={() => router.push(`/orders/track?id=${orderId}`)}>
                  Track Your Order <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => setCheckoutOpen(false)}>
                  Continue Browsing
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CartDrawer onCheckout={handleCheckout} />
    </>
  );
}

export default function Home() {
  return (
    <CartProvider>
      <MarketplaceContent />
    </CartProvider>
  );
}
