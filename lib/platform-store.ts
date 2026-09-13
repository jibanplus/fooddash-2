'use client';

import { mockOrders, mockRestaurants, mockDeliveryPartners } from './mock-data';
import type { Order, Restaurant, DeliveryPartner, WalletTransaction, WithdrawalRequest } from './types';

const KEYS = {
  restaurants: 'fooddash:restaurants',
  delivery: 'fooddash:delivery',
  transactions: 'fooddash:transactions',
  withdrawals: 'fooddash:withdrawals',
  support: 'fooddash:support',
  orders: 'fooddash:orders',
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function write<T>(key: string, value: T) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new StorageEvent('storage', { key }));
  }
}

export function getRestaurants(): Restaurant[] {
  return read(KEYS.restaurants, mockRestaurants);
}
export function setRestaurants(value: Restaurant[]) { write(KEYS.restaurants, value); }
export function setRestaurantStatus(id: string, status: Restaurant['status']) {
  setRestaurants(getRestaurants().map(r => r.id === id ? { ...r, status } : r));
}
export function getRestaurant(id = 'r1') { const list=getRestaurants(); return list.find(r => r.id === id); }

export function getDeliveryPartners(): DeliveryPartner[] { return read(KEYS.delivery, mockDeliveryPartners); }
export function setDeliveryPartners(value: DeliveryPartner[]) { write(KEYS.delivery, value); }
export function setDeliveryStatus(id: string, status: DeliveryPartner['status']) {
  setDeliveryPartners(getDeliveryPartners().map(p => p.id === id ? { ...p, status } : p));
}

export function getOrders(): Order[] { return read(KEYS.orders, mockOrders); }
export function setOrders(value: Order[]) { write(KEYS.orders, value); }

export function getTransactions(): WalletTransaction[] {
  const existing = read<WalletTransaction[]>(KEYS.transactions, []);
  if (existing.length) return existing;
  const seed: WalletTransaction[] = [];
  for (const o of mockOrders) {
    if (o.paymentStatus === 'paid') {
      const restaurantCredit = Math.max(0, o.subtotal - o.commissionAmount);
      seed.push({ id: `tx-r-${o.id}`, userId: o.restaurantId, userType: 'restaurant', type: o.status === 'cancelled' ? 'refund' : 'credit', amount: restaurantCredit, balance: 0, description: o.status === 'cancelled' ? 'Order refund / reversal' : 'Order settlement credit', orderId: o.orderId, createdAt: o.placedAt });
      if (o.deliveryPartnerId) seed.push({ id: `tx-d-${o.id}`, userId: o.deliveryPartnerId, userType: 'delivery', type: o.status === 'cancelled' ? 'refund' : 'credit', amount: o.status === 'cancelled' ? 0 : Math.round(o.deliveryFee), balance: 0, description: o.status === 'cancelled' ? 'Cancelled delivery reversal' : 'Delivery earning', orderId: o.orderId, createdAt: o.placedAt });
    }
  }
  write(KEYS.transactions, seed);
  return seed;
}
export function addTransaction(tx: WalletTransaction) { write(KEYS.transactions, [tx, ...getTransactions()]); }

export function getWithdrawals(): WithdrawalRequest[] { return read(KEYS.withdrawals, []); }
export function addWithdrawal(w: WithdrawalRequest) { write(KEYS.withdrawals, [w, ...getWithdrawals()]); }

export type SupportStatus = 'open' | 'in_review' | 'resolved' | 'closed';
export interface SupportTicket {
  id: string; subject: string; message: string; openedBy: 'customer'|'restaurant'|'delivery'|'admin';
  openedById: string; against?: 'customer'|'restaurant'|'delivery'|'admin'; againstId?: string;
  status: SupportStatus; createdAt: string; replies: { id: string; by: string; role: string; text: string; at: string }[];
}
export function getSupportTickets(): SupportTicket[] { return read(KEYS.support, []); }
export function setSupportTickets(v: SupportTicket[]) { write(KEYS.support, v); }
export function addSupportTicket(t: SupportTicket) { setSupportTickets([t, ...getSupportTickets()]); }
export function updateSupportTicket(id: string, patch: Partial<SupportTicket>) {
  setSupportTickets(getSupportTickets().map(t => t.id === id ? { ...t, ...patch } : t));
}
export function addSupportReply(id: string, reply: SupportTicket['replies'][number]) {
  setSupportTickets(getSupportTickets().map(t => t.id === id ? { ...t, replies: [...t.replies, reply] } : t));
}
export function subscribeStore(cb: () => void) {
  if (typeof window === 'undefined') return () => {};
  const fn = () => cb();
  window.addEventListener('storage', fn);
  return () => window.removeEventListener('storage', fn);
}
