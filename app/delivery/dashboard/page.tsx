'use client';

import { useState, useEffect } from 'react';
import {
  UtensilsCrossed, Bike, Package, MapPin, Navigation, CheckCircle2,
  IndianRupee, Star, Truck, LogOut, Clock, Phone, ArrowRight, Wallet,
  Landmark, CreditCard
} from 'lucide-react';
import { mockOrders, mockDeliveryPartners } from '@/lib/mock-data';
import type { Order, OrderStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { WalletPanel } from '@/components/wallet-panel';
import { SupportDesk } from '@/components/support-desk';
import { getDeliveryPartners, setDeliveryStatus, subscribeStore, getOrders, setOrders as persistOrders, addTransaction } from '@/lib/platform-store';

const partner = mockDeliveryPartners[0];

export default function DeliveryDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [online, setOnline] = useState(true);
  useEffect(() => { const refresh=()=>{ const p=getDeliveryPartners().find(x=>x.id===partner.id) || partner; setOnline(p.status !== 'offline'); setOrders(getOrders()); }; refresh(); return subscribeStore(refresh); }, []);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
  });
  const [upiId, setUpiId] = useState('');
  const [walletBalance] = useState(partner.earnings); // Using earnings as wallet balance

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) => {
      const next = prev.map((o) => {
        if (o.id === orderId) {
          const updated = { ...o, status, deliveryPartnerId: partner.id, deliveryPartnerName: partner.name };
          if (status === 'picked_up') updated.pickedUpAt = new Date().toISOString();
          if (status === 'delivered') { updated.deliveredAt = new Date().toISOString(); if (o.paymentStatus === 'paid') addTransaction({id:`TX-D-${o.orderId}-${Date.now()}`,userId:partner.id,userType:'delivery',type:'credit',amount:o.deliveryFee,balance:0,description:'Delivery completed • earning credited',orderId:o.orderId,createdAt:new Date().toISOString()}); }
          return updated;
        }
        return o;
      });
      persistOrders(next);
      if (status === 'picked_up') setDeliveryStatus(partner.id, 'on_delivery');
      if (status === 'delivered') setDeliveryStatus(partner.id, 'available');
      return next;
    });
    const labels: Record<OrderStatus, string> = {
      placed: 'accepted',
      accepted: 'accepted',
      preparing: 'updated',
      ready: 'updated',
      picked_up: 'picked up',
      delivered: 'delivered',
      cancelled: 'cancelled',
    };
    toast.success(`Order ${labels[status]}`);
  };

  const availableOrders = online ? orders.filter((o) => o.status === 'ready' && !o.deliveryPartnerId) : [];
  const activeOrders = orders.filter(
    (o) => ['picked_up'].includes(o.status) && o.deliveryPartnerId === partner.id
  );
  const completedOrders = orders.filter(
    (o) => o.status === 'delivered' && o.deliveryPartnerId === partner.id
  );

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
              <p className="text-sm font-bold leading-tight">{partner.name}</p>
              <p className="text-xs text-muted-foreground">Delivery Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { const current=getDeliveryPartners().find(p=>p.id===partner.id) || partner; if(current.status==='on_delivery' && online){ toast.error('Finish the active delivery before going offline'); return; } const next=!online; setOnline(next); setDeliveryStatus(partner.id,next?'available':'offline'); toast.success(next?'You are now online':'You are now offline'); }} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${online?'border-success bg-success/10 text-success':'border-muted bg-muted text-muted-foreground'}`}><span className={`h-2 w-2 rounded-full ${online?'bg-success':'bg-muted-foreground'}`}/>{online?'Online':'Offline'}</button>
            <WalletPanel userId={partner.id} userType="delivery" initialBalance={partner.earnings} />
            <SupportDesk role="delivery" userId={partner.id} />
            <Button variant="ghost" size="sm" onClick={() => router.push('/delivery/login')}>
              <LogOut className="h-4 w-4" />
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
                <p className="text-2xl font-bold">₹{partner.earnings.toLocaleString('en-IN')}</p>
                <p className="text-xs text-muted-foreground">Total Earnings</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10">
                <Package className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{partner.totalDeliveries}</p>
                <p className="text-xs text-muted-foreground">Total Deliveries</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-warning/10">
                <Star className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{partner.rating}</p>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedOrders.length}</p>
                <p className="text-xs text-muted-foreground">Today's Deliveries</p>
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

        {/* Orders */}
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="mb-4 grid w-full grid-cols-3">
            <TabsTrigger value="available" className="gap-1.5">
              <Bike className="h-4 w-4" /> Available ({availableOrders.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-1.5">
              <Truck className="h-4 w-4" /> Active ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Completed ({completedOrders.length})
            </TabsTrigger>
          </TabsList>

          {/* Available Orders */}
          <TabsContent value="available" className="space-y-4">
            {!online ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bike className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-lg font-semibold">You are offline</p>
                  <p className="text-sm text-muted-foreground">Go online to see available deliveries.</p>
                </CardContent>
              </Card>
            ) : availableOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-lg font-semibold">No orders available</p>
                  <p className="text-sm text-muted-foreground">Ready orders will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              availableOrders.map((order) => (
                <DeliveryOrderCard
                  key={order.id}
                  order={order}
                  variant="available"
                  onAction={updateOrderStatus}
                />
              ))
            )}
          </TabsContent>

          {/* Active Orders */}
          <TabsContent value="active" className="space-y-4">
            {activeOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Truck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-lg font-semibold">No active deliveries</p>
                  <p className="text-sm text-muted-foreground">Pick up an order to start delivering.</p>
                </CardContent>
              </Card>
            ) : (
              activeOrders.map((order) => (
                <DeliveryOrderCard
                  key={order.id}
                  order={order}
                  variant="active"
                  onAction={updateOrderStatus}
                />
              ))
            )}
          </TabsContent>

          {/* Completed Orders */}
          <TabsContent value="completed" className="space-y-4">
            {completedOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-lg font-semibold">No completed deliveries yet</p>
                </CardContent>
              </Card>
            ) : (
              completedOrders.map((order) => (
                <DeliveryOrderCard
                  key={order.id}
                  order={order}
                  variant="completed"
                  onAction={updateOrderStatus}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
        <Card className="mt-6"><CardContent className="pt-6"><h3 className="mb-3 font-semibold">Order & Transaction History</h3><div className="space-y-2">{orders.filter(o=>o.deliveryPartnerId===partner.id).map(o=><div key={o.id} className="flex justify-between rounded-lg border p-3 text-sm"><span><b>{o.orderId}</b> · <Badge variant={o.status==='cancelled'?'destructive':'outline'}>{o.status}</Badge></span><span className="font-semibold">₹{o.deliveryFee}</span></div>)}</div></CardContent></Card>
      </div>
    </div>
  );
}

function DeliveryOrderCard({
  order,
  variant,
  onAction,
}: {
  order: Order;
  variant: 'available' | 'active' | 'completed';
  onAction: (orderId: string, status: OrderStatus) => void;
}) {
  return (
    <Card className="animate-fade-in">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{order.orderId}</span>
              <Badge variant="secondary">{order.restaurantName}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{order.customerName} · {order.customerPhone}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary">₹{order.deliveryFee + 30}</p>
            <p className="text-xs text-muted-foreground">Delivery Earnings</p>
          </div>
        </div>

        {/* Route */}
        <div className="mt-4 space-y-3 rounded-lg bg-secondary/50 p-3">
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <UtensilsCrossed className="h-4 w-4 text-primary" />
              </div>
              <div className="my-1 h-6 w-0.5 border-l border-dashed border-muted-foreground/30" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                <MapPin className="h-4 w-4 text-success" />
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">PICKUP</p>
                <p className="text-sm font-medium">{order.restaurantName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">DROP</p>
                <p className="text-sm font-medium">{order.deliveryAddress}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items Summary */}
        <div className="mt-3 border-t pt-3">
          <p className="text-sm text-muted-foreground">
            {order.items.length} item{order.items.length > 1 ? 's' : ''} · ₹{order.total}
          </p>
        </div>

        {/* Actions */}
        {variant === 'available' && (
          <div className="mt-4">
            <Button className="w-full" onClick={() => onAction(order.id, 'picked_up')}>
              <Bike className="mr-1.5 h-4 w-4" /> Accept Delivery
            </Button>
          </div>
        )}

        {variant === 'active' && order.status === 'picked_up' && (
          <div className="mt-4 space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => toast.info('Opening Google Maps navigation...')}
              >
                <Navigation className="mr-1.5 h-4 w-4" /> Navigate
              </Button>
              <Button
                className="flex-1"
                onClick={() => onAction(order.id, 'delivered')}
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Mark Delivered
              </Button>
            </div>
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> Picked up at {new Date(order.pickedUpAt || Date.now()).toLocaleTimeString()}
            </div>
          </div>
        )}

        {variant === 'completed' && (
          <div className="mt-3 flex items-center gap-2 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" /> Delivered successfully
          </div>
        )}
      </CardContent>
    </Card>
  );
}
