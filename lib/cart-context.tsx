'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { CartItem, MenuItem } from './types';

interface CartContextValue {
  items: CartItem[];
  addItem: (menuItem: MenuItem, quantity: number, addons: { name: string; price: number }[]) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalItems: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback(
    (menuItem: MenuItem, quantity: number, addons: { name: string; price: number }[]) => {
      const addonTotal = addons.reduce((sum, a) => sum + a.price, 0);
      const total = (menuItem.price + addonTotal) * quantity;
      const id = `${menuItem.id}-${Date.now()}`;
      setItems((prev) => [...prev, { id, menuItem, quantity, addons, total }]);
      setIsOpen(true);
    },
    []
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const addonTotal = item.addons.reduce((sum, a) => sum + a.price, 0);
          return { ...item, quantity, total: (item.menuItem.price + addonTotal) * quantity };
        }
        return item;
      })
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);
  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, subtotal, totalItems, isOpen, setIsOpen }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
