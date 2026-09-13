'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  UtensilsCrossed, CheckCircle2, Clock, ChefHat, Package,
  Bike, MapPin, Phone, IndianRupee, ArrowLeft, Star, Navigation
} from 'lucide-react';
import { mockOrders, orderStatusFlow } from '@/lib/mock-data';
import type { OrderStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';

export default function TrackOrder() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id') || 'FD-2026-001';
  const [order, setOrder] = useState(mockOrders.find((o) => o.orderId === orderId) || mockOrders[0]);
  const [currentStep, setCurrentStep] = useState<number>(
    orderStatusFlow.findIndex((s) => s.status === order.status)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentStep < orderStatusFlow.length - 1) {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        const newStatus = orderStatusFlow[nextStep].status as OrderStatus;
        setOrder((prev) => ({ ...prev, status: newStatus }));
        toast.success(orderStatusFlow[nextStep].label);
      } else {
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-secondary/20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">FoodDash</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Track Your Order</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Order <span className="font-semibold text-foreground">{order.orderId}</span> · {order.restaurantName}
          </p>
        </div>

        {/* Status Timeline */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-0">
              {orderStatusFlow.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                const isPending = index > currentStep;

                return (
                  <div key={step.status} className="flex gap-4">
                    {/* Timeline marker */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                          isCompleted
                            ? 'bg-success text-success-foreground'
                            : isCurrent
                            ? 'bg-primary text-primary-foreground animate-pulse'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : isCurrent ? (
                          step.status === 'placed' ? <Clock className="h-5 w-5" /> :
                          step.status === 'accepted' ? <CheckCircle2 className="h-5 w-5" /> :
                          step.status === 'preparing' ? <ChefHat className="h-5 w-5" /> :
                          step.status === 'ready' ? <Package className="h-5 w-5" /> :
                          step.status === 'picked_up' ? <Bike className="h-5 w-5" /> :
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border-2 border-muted-foreground" />
                        )}
                      </div>
                      {index < orderStatusFlow.length - 1 && (
                        <div
                          className={`my-1 w-0.5 flex-1 ${
                            isCompleted ? 'bg-success' : 'bg-border'
                          }`}
                          style={{ minHeight: '2rem' }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 pb-6 ${isPending ? 'opacity-50' : ''}`}>
                      <p className={`font-semibold ${isCurrent ? 'text-primary' : ''}`}>
                        {step.label}
                      </p>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      {isCurrent && (
                        <Badge className="mt-2 animate-pulse">In Progress</Badge>
                      )}
                      {isCompleted && (
                        <p className="mt-1 text-xs text-success">
                          <CheckCircle2 className="mr-1 inline h-3 w-3" /> Completed
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {currentStep === orderStatusFlow.length - 1 && (
              <div className="mt-4 rounded-lg bg-success/10 p-4 text-center">
                <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-success" />
                <p className="text-lg font-bold text-success">Order Delivered!</p>
                <p className="text-sm text-muted-foreground">Enjoy your meal from {order.restaurantName}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-bold">Order Details</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div>
                    <span className="font-medium">{item.quantity}× {item.menuItem.name}</span>
                    {item.addons.length > 0 && (
                      <span className="text-muted-foreground"> ({item.addons.map((a) => a.name).join(', ')})</span>
                    )}
                  </div>
                  <span className="font-medium">₹{item.total}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1.5 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span>₹{order.deliveryFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxes</span>
                <span>₹{order.tax}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span>Total</span>
                <span className="text-primary">₹{order.total}</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <IndianRupee className="h-4 w-4 text-success" />
              <span className="text-success font-medium">Paid via {order.paymentMethod}</span>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Info */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-bold">Delivery Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Delivery Address</p>
                  <p className="text-muted-foreground">{order.deliveryAddress}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Customer</p>
                  <p className="text-muted-foreground">{order.customerName} · {order.customerPhone}</p>
                </div>
              </div>
              {order.deliveryPartnerName && (
                <div className="flex items-start gap-3">
                  <Bike className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">Delivery Partner</p>
                    <p className="text-muted-foreground">{order.deliveryPartnerName}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => toast.info('Calling support...')}>
            <Phone className="mr-1.5 h-4 w-4" /> Contact Support
          </Button>
          {order.deliveryPartnerName && (
            <Button className="flex-1" onClick={() => toast.info('Opening Google Maps...')}>
              <Navigation className="mr-1.5 h-4 w-4" /> Track on Map
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
