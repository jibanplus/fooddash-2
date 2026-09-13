'use client';

import { useEffect, useMemo, useState } from 'react';
import { Wallet, Landmark, CreditCard, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { addTransaction, addWithdrawal, getTransactions, getWithdrawals, subscribeStore } from '@/lib/platform-store';
import type { WithdrawalMethod, WalletTransaction } from '@/lib/types';

const tag = (t: WalletTransaction['type']) => t === 'credit' ? 'Credit' : t === 'debit' ? 'Debit' : t === 'withdrawal' ? 'Withdrawal' : 'Refund';

export function WalletPanel({ userId, userType, initialBalance = 0 }: { userId: string; userType: 'restaurant'|'delivery'; initialBalance?: number }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<WithdrawalMethod>('upi');
  const [upiId, setUpiId] = useState('');
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState(getWithdrawals());

  const refresh = () => {
    setTransactions(getTransactions().filter(t => t.userId === userId && t.userType === userType));
    setWithdrawals(getWithdrawals().filter(w => w.userId === userId && w.userType === userType));
  };
  useEffect(() => { refresh(); return subscribeStore(refresh); }, [userId, userType]);

  const net = useMemo(() => transactions.reduce((s, t) => s + (t.type === 'debit' || t.type === 'withdrawal' ? -t.amount : t.amount), initialBalance), [transactions, initialBalance]);
  const request = () => {
    const n = Number(amount);
    if (!n || n <= 0 || n > net) return toast.error('Enter a valid amount within wallet balance');
    const id = `WD-${Date.now()}`;
    addWithdrawal({ id, userId, userType, amount: n, method, upiId: method === 'upi' ? upiId : undefined, status: 'pending', requestedAt: new Date().toISOString() });
    addTransaction({ id: `TX-${id}`, userId, userType, type: 'withdrawal', amount: n, balance: net - n, description: `Withdrawal request • ${method.toUpperCase()} • ${id}`, createdAt: new Date().toISOString() });
    setAmount(''); setOpen(false); refresh(); toast.success(`Withdrawal request ${id} submitted`);
  };

  return <>
    <Button variant="outline" size="sm" onClick={() => setOpen(true)}><Wallet className="mr-1 h-4 w-4" /> Wallet</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Wallet, Withdrawals & Transaction History</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="rounded-xl bg-primary/10 p-5 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Available balance</p><p className="text-3xl font-bold text-primary">₹{Math.max(0, net).toLocaleString('en-IN')}</p></div>
            <Wallet className="h-10 w-10 text-primary" />
          </div>
          <div className="grid gap-3 rounded-xl border p-4">
            <p className="font-semibold">Request withdrawal</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <Input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
              <select value={method} onChange={e => setMethod(e.target.value as WithdrawalMethod)} className="h-10 rounded-md border px-3"><option value="upi">UPI</option><option value="bank">Bank</option></select>
              <Input placeholder="UPI ID (for UPI)" value={upiId} onChange={e => setUpiId(e.target.value)} />
            </div>
            <Button onClick={request}><ArrowDownToLine className="mr-2 h-4 w-4" /> Submit withdrawal</Button>
          </div>
          <div>
            <p className="mb-2 font-semibold">Ledger</p>
            <div className="space-y-2">{transactions.length === 0 && <p className="text-sm text-muted-foreground">No transactions yet.</p>}
              {transactions.map(t => <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
                <div><p className="font-medium">{t.description}</p><p className="text-xs text-muted-foreground">{t.orderId || '—'} · {new Date(t.createdAt).toLocaleString()}</p></div>
                <div className="text-right"><Badge variant={t.type === 'credit' ? 'default' : t.type === 'refund' ? 'secondary' : 'destructive'}>{tag(t.type)}</Badge><p className={`font-semibold ${t.type === 'credit' || t.type === 'refund' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'debit' || t.type === 'withdrawal' ? '-' : '+'}₹{t.amount.toLocaleString('en-IN')}</p></div>
              </div>)}
            </div>
          </div>
          <div><p className="mb-2 font-semibold">Withdrawal history</p>{withdrawals.map(w => <div key={w.id} className="flex justify-between rounded-lg border p-3"><span>{w.id} · {w.method.toUpperCase()}</span><span>₹{w.amount.toLocaleString('en-IN')} <Badge variant="outline">{w.status}</Badge></span></div>)}</div>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
