'use client';

import { useEffect, useState } from 'react';
import { ImagePlus, Plus, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getRestaurant, getRestaurants, setRestaurants } from '@/lib/platform-store';
import type { MenuItem } from '@/lib/types';

export function MenuManager({ restaurantId, admin = false }: { restaurantId: string; admin?: boolean }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [draft, setDraft] = useState({ name:'', price:'', description:'', category:'Main Course', offer:'', image:'' });
  const load=()=>{ const r=getRestaurant(restaurantId); setItems(r?.menu || []); };
  useEffect(load, [restaurantId]);
  const save=(next:MenuItem[])=>{
    setRestaurants(getRestaurants().map(r=>r.id===restaurantId?{...r,menu:next}:r));
    setItems(next);
  };
  const add=()=>{
    if(!draft.name.trim() || !Number(draft.price)) return toast.error('Name and price are required');
    const item:MenuItem={id:`m-${Date.now()}`,name:draft.name,price:Number(draft.price),description:draft.description,image:draft.image || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',category:draft.category,isVeg:false,offer:draft.offer};
    save([...items,item]); setDraft({name:'',price:'',description:'',category:'Main Course',offer:'',image:''}); toast.success('Menu item saved');
  };
  const remove=(id:string)=>{save(items.filter(i=>i.id!==id));toast.success('Menu item removed')};
  return <div className="rounded-xl border p-4">
    <div className="mb-4 flex items-center justify-between"><div><h3 className="font-semibold">Food Menu Manager</h3><p className="text-xs text-muted-foreground">Photo, name, price, description, category & offer</p></div><Badge variant="outline">{items.length} items</Badge></div>
    <div className="grid gap-3 rounded-lg bg-secondary/40 p-3 sm:grid-cols-2">
      <Input placeholder="Food name *" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/>
      <Input type="number" placeholder="Price ₹ *" value={draft.price} onChange={e=>setDraft({...draft,price:e.target.value})}/>
      <Input placeholder="Category" value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}/>
      <Input placeholder="Offer (e.g. 20% OFF)" value={draft.offer} onChange={e=>setDraft({...draft,offer:e.target.value})}/>
      <Textarea placeholder="Description" value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})} className="sm:col-span-2"/>
      <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
        <label className="flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm"><ImagePlus className="h-4 w-4"/>{draft.image?'Photo selected':'Upload photo'}<input type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f){const reader=new FileReader(); reader.onload=()=>setDraft({...draft,image:String(reader.result||'')}); reader.readAsDataURL(f)}}}/></label>
        <Button onClick={add}><Plus className="mr-1 h-4 w-4"/>Add food</Button>
      </div>
    </div>
    <div className="mt-4 grid gap-3 md:grid-cols-2">{items.map(item=><div key={item.id} className="flex gap-3 rounded-lg border p-3">
      <img src={item.image} className="h-20 w-20 rounded-lg object-cover" alt={item.name}/>
      <div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><p className="font-semibold">{item.name}</p><span className="font-bold">₹{item.price}</span></div><p className="text-xs text-muted-foreground">{item.description}</p><div className="mt-2 flex gap-2"><Badge variant="outline">{item.category}</Badge>{item.isBestseller&&<Badge>Bestseller</Badge>}{item.offer&&<Badge variant="secondary">{item.offer}</Badge>}</div></div>
      <Button size="icon" variant="ghost" onClick={()=>remove(item.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
    </div>)}</div>
  </div>;
}