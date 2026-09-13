'use client';

import { useEffect, useState } from 'react';
import { Headphones, Send, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { addSupportReply, addSupportTicket, getSupportTickets, updateSupportTicket, subscribeStore, type SupportTicket } from '@/lib/platform-store';

export function SupportDesk({ role, userId }: { role: 'customer'|'restaurant'|'delivery'|'admin'; userId: string }) {
  const [open, setOpen] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState<Record<string,string>>({});
  const refresh = () => setTickets(getSupportTickets().filter(t => role === 'admin' || t.openedById === userId || t.againstId === userId));
  useEffect(() => { refresh(); return subscribeStore(refresh); }, [role, userId]);

  const create = () => {
    if (!subject.trim() || !message.trim()) return toast.error('Subject and message are required');
    addSupportTicket({ id: `TKT-${Date.now()}`, subject, message, openedBy: role, openedById: userId, status: 'open', createdAt: new Date().toISOString(), replies: [] });
    setSubject(''); setMessage(''); refresh(); toast.success('Support ticket opened');
  };
  const send = (id: string) => {
    const text = reply[id]?.trim(); if (!text) return;
    addSupportReply(id, { id: `R-${Date.now()}`, by: role === 'admin' ? 'Admin' : role, role, text, at: new Date().toISOString() });
    setReply({...reply, [id]: ''}); refresh();
  };
  const setStatus = (id: string, status: SupportTicket['status']) => { if (role !== 'admin') return; updateSupportTicket(id, {status}); refresh(); };

  return <>
    <Button variant="outline" size="sm" onClick={() => setOpen(true)}><Headphones className="mr-1 h-4 w-4" /> Support Desk</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Support Desk · Admin controls final status</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          {role !== 'admin' && <div className="grid gap-2 rounded-xl border p-4"><p className="font-semibold">Open a ticket</p><Input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} /><Textarea placeholder="Describe the issue and who it concerns" value={message} onChange={e => setMessage(e.target.value)} /><Button onClick={create}><Send className="mr-2 h-4 w-4" /> Send to admin</Button></div>}
          <div className="space-y-3">{tickets.map(t => <div key={t.id} className="rounded-xl border p-4">
            <div className="flex flex-wrap justify-between gap-2"><div><p className="font-semibold">{t.subject}</p><p className="text-sm text-muted-foreground">{t.message}</p><p className="text-xs text-muted-foreground mt-1">Opened by: {t.openedBy} · {new Date(t.createdAt).toLocaleString()}</p></div><Badge variant={t.status === 'resolved' || t.status === 'closed' ? 'default' : t.status === 'in_review' ? 'secondary' : 'outline'}>{t.status.replace('_',' ')}</Badge></div>
            <div className="mt-3 space-y-2">{t.replies.map(r => <div key={r.id} className="rounded-lg bg-secondary/50 p-2 text-sm"><b>{r.by}</b> · {r.role}: {r.text}</div>)}</div>
            <div className="mt-3 flex gap-2"><Input placeholder="Reply..." value={reply[t.id] || ''} onChange={e => setReply({...reply, [t.id]: e.target.value})} /><Button size="sm" onClick={() => send(t.id)}><MessageCircle className="h-4 w-4" /></Button></div>
            {role === 'admin' && <div className="mt-2 flex gap-2"><span className="text-xs text-muted-foreground self-center">Admin-only status:</span>{(['open','in_review','resolved','closed'] as SupportTicket['status'][]).map(s => <Button key={s} size="sm" variant={t.status === s ? 'default' : 'outline'} onClick={() => setStatus(t.id,s)}>{s.replace('_',' ')}</Button>)}</div>}
          </div>)}</div>
          {!tickets.length && <p className="py-8 text-center text-sm text-muted-foreground">No tickets.</p>}
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
