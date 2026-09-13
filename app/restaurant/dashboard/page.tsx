'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  UtensilsCrossed, Store, Clock, CheckCircle2, ChefHat, Bell,
  TrendingUp, IndianRupee, Package, ArrowLeft, LogOut, Star, Wallet,
  ArrowRight, Landmark, CreditCard
} from 'lucide-react';
import { mockOrders, mockRestaurants } from '@/lib/mock-data';
import type { Order, OrderStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { WalletPanel } from '@/components/wallet-panel';
import { SupportDesk } from '@/components/support-desk';
import { MenuManager } from '@/components/menu-manager';
import { getRestaurant, setRestaurants, getRestaurants, subscribeStore, getOrders, setOrders as persistOrders, addTransaction } from '@/lib/platform-store';

const restaurant = mockRestaurants[0];

export default function RestaurantDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(
    mockOrders.filter((o) => o.restaurantId === 'r1')
  );
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
  });
  const [upiId, setUpiId] = useState('');
  const [walletBalance] = useState(45200); // Demo starting balance
  const [restaurantOnline, setRestaurantOnline] = useState(true);
  useEffect(() => { const refresh=()=>{ const r=getRestaurant('r1'); if(!r) return; setRestaurantOnline(r.isOnline !== false); setOrders(getOrders().filter(o=>o.restaurantId==='r1')); }; refresh(); return subscribeStore(refresh); }, []);

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) => {
      const next = prev.map((o) => {
        if (o.id === orderId) {
          const updated = { ...o, status };
          if (status === 'accepted') updated.acceptedAt = new Date().toISOString();
          if (status === 'ready') updated.readyAt = new Date().toISOString();
          if (status === 'cancelled' && o.paymentStatus === 'paid') {
            addTransaction({id:`TX-REV-${o.orderId}-${Date.now()}`,userId:o.restaurantId,userType:'restaurant',type:'refund',amount:Math.max(0,o.subtotal-o.commissionAmount),balance:0,description:'Order cancelled • settlement reverted',orderId:o.orderId,createdAt:new Date().toISOString()});
          }
          return updated;
        }
        return o;
      });
      persistOrders(next); return next;
    });
    const labels: Record<OrderStatus, string> = {
      placed: 'placed',
      accepted: 'accepted',
      preparing: 'marked as preparing',
      ready: 'marked as ready for pickup',
      picked_up: 'picked up',
      delivered: 'delivered',
      cancelled: 'cancelled',
    };
    toast.success(`Order ${labels[status]}`);
  };

  const newOrders = orders.filter((o) => o.status === 'placed');
  const activeOrders = orders.filter((o) => ['accepted', 'preparing', 'ready'].includes(o.status));
  const completedOrders = orders.filter((o) => ['delivered', 'cancelled'].includes(o.status));

  const todayRevenue = completedOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const todayOrders = orders.length;
  const avgRating = restaurant.rating;

  const handleWithdrawal = () => {
    toast.success('Withdrawal request submitted successfully');
    setWalletDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">{restaurant.name}</p>
              <p className="text-xs text-muted-foreground">Restaurant Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { const next=!restaurantOnline; setRestaurantOnline(next); const r=getRestaurant('r1'); if(!r) return; const updated={...r,isOnline:next}; const all=getRestaurants(); setRestaurants(all.map((x:any)=>x.id==='r1'?{...x,isOnline:next}:x)); toast.success(next?'Restaurant is Online':'Restaurant is Offline'); }} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${restaurantOnline?'border-success bg-success/10 text-success':'border-muted bg-muted text-muted-foreground'}`}><span className={`h-2 w-2 rounded-full ${restaurantOnline?'bg-success':'bg-muted-foreground'}`}/>{restaurantOnline?'Online':'Offline'}</button>
            <WalletPanel userId="r1" userType="restaurant" initialBalance={walletBalance} />
            <SupportDesk role="restaurant" userId="r1" />
            <Button variant="ghost" size="sm" onClick={() => router.push('/restaurant/login')}>
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                <IndianRupee className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">₹{todayRevenue}</p>
                <p className="text-xs text-muted-foreground">Today's Revenue</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10">
                <Package className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayOrders}</p>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-success/10">
                <Bell className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{newOrders.length}</p>
                <p className="text-xs text-muted-foreground">New Orders</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-warning/10">
                <Star className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgRating}</p>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-500/10">
                <Wallet className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">₹{walletBalance.toLocaleString('en-IN')}</p>
                <p className="text-xs text-muted-foreground">Wallet Balance</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6"><MenuManager restaurantId="r1" /></div>

        {restaurantOnline ? null : <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">Restaurant is offline. New orders should not be accepted until you switch Online.</div>}

        {/* Orders */}
        <Tabs defaultValue="new" className="w-full">
          <TabsList className="mb-4 grid w-full grid-cols-3">
            <TabsTrigger value="new" className="gap-1.5">
              <Bell className="h-4 w-4" /> New ({newOrders.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-1.5">
              <ChefHat className="h-4 w-4" /> Active ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Completed ({completedOrders.length})
            </TabsTrigger>
          </TabsList>

          {/* New Orders */}
          <TabsContent value="new" className="space-y-4">
            {newOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-lg font-semibold">No new orders</p>
                  <p className="text-sm text-muted-foreground">New orders will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              newOrders.map((order) => (
                <OrderCard key={order.id} order={order} variant="new" onAction={updateOrderStatus} />
              ))
            )}
          </TabsContent>

          {/* Active Orders */}
          <TabsContent value="active" className="space-y-4">
            {activeOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ChefHat className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-lg font-semibold">No active orders</p>
                  <p className="text-sm text-muted-foreground">Accepted orders will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              activeOrders.map((order) => (
                <OrderCard key={order.id} order={order} variant="active" onAction={updateOrderStatus} />
              ))
            )}
          </TabsContent>

          {/* Completed Orders */}
          <TabsContent value="completed" className="space-y-4">
            {completedOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-lg font-semibold">No completed orders yet</p>
                </CardContent>
              </Card>
            ) : (
              completedOrders.map((order) => (
                <OrderCard key={order.id} order={order} variant="completed" onAction={updateOrderStatus} />
              ))
            )}
          </TabsContent>
        </Tabs>
        <Card className="mt-6"><CardHeader><CardTitle>Order & Transaction History</CardTitle></CardHeader><CardContent><div className="space-y-2">{orders.map(o=><div key={o.id} className="flex justify-between rounded-lg border p-3 text-sm"><span><b>{o.orderId}</b> · {o.restaurantName} · <Badge variant={o.status==='cancelled'?'destructive':'outline'}>{o.status}</Badge></span><span className="font-semibold">₹{o.total}</span></div>)}</div></CardContent></Card>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  variant,
  onAction,
}: {
  order: Order;
  variant: 'new' | 'active' | 'completed';
  onAction: (orderId: string, status: OrderStatus) => void;
}) {
  const statusBadge = (status: OrderStatus) => {
    const map: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      placed: { label: 'New', variant: 'default' },
      accepted: { label: 'Accepted', variant: 'secondary' },
      preparing: { label: 'Preparing', variant: 'secondary' },
      ready: { label: 'Ready', variant: 'default' },
      picked_up: { label: 'Picked Up', variant: 'secondary' },
      delivered: { label: 'Delivered', variant: 'secondary' },
      cancelled: { label: 'Cancelled', variant: 'destructive' },
    };
    return map[status];
  };

  const badge = statusBadge(order.status);

  return (
    <Card className="animate-fade-in">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{order.orderId}</span>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{order.customerName} · {order.customerPhone}</p>
            <p className="text-xs text-muted-foreground">{order.deliveryAddress}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary">₹{order.total}</p>
            <p className="text-xs text-muted-foreground">{order.paymentMethod}</p>
          </div>
        </div>

        <div className="mt-3 border-t pt-3">
          <p className="mb-2 text-sm font-medium">Order Items:</p>
          <div className="space-y-1">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.quantity}× {item.menuItem.name}
                  {item.addons.length > 0 && (
                    <span className="text-muted-foreground"> ({item.addons.map((a) => a.name).join(', ')})</span>
                  )}
                </span>
                <span className="font-medium">₹{item.total}</span>
              </div>
            ))}
          </div>
        </div>

        {variant === 'new' && (
          <div className="mt-4 flex gap-2">
            <Button
              className="flex-1"
              onClick={() => onAction(order.id, 'accepted')}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" /> Accept Order
            </Button>
            <Button
              variant="outline"
              onClick={() => onAction(order.id, 'cancelled')}
            >
              Reject
            </Button>
          </div>
        )}

        {variant === 'active' && order.status === 'accepted' && (
          <div className="mt-4">
            <Button className="w-full" onClick={() => onAction(order.id, 'preparing')}>
              <ChefHat className="mr-1.5 h-4 w-4" /> Start Preparing
            </Button>
          </div>
        )}

        {variant === 'active' && order.status === 'preparing' && (
          <div className="mt-4">
            <Button className="w-full" onClick={() => onAction(order.id, 'ready')}>
              <CheckCircle2 className="mr-1.5 h-4 w-4" /> Mark as Ready
            </Button>
          </div>
        )}

        {variant === 'active' && order.status === 'ready' && (
          <div className="mt-4 rounded-lg bg-success/10 p-3 text-center text-sm font-medium text-success">
            <Bell className="mr-1.5 inline h-4 w-4" /> Waiting for delivery partner pickup
          </div>
        )}
      </CardContent>
    </Card>
  );
}
