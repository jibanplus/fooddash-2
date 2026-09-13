

import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, Plus, Trash2, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getRestaurant, getRestaurants, setRestaurants } from '@/lib/platform-store';
import type { MenuItem, Restaurant } from '@/lib/types';

const emptyDraft = { name: '', price: '', description: '', category: 'Main Course', offer: '', image: '' };

export function MenuManager({
  restaurants,
  restaurantId,
  admin = false,
}: {
  restaurants?: Restaurant[];
  restaurantId?: string;
  admin?: boolean;
}) {
  const availableRestaurants = useMemo(
    () => restaurants ?? getRestaurants(),
    [restaurants]
  );
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(restaurantId || '');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [draft, setDraft] = useState(emptyDraft);

  useEffect(() => {
    if (restaurantId) setSelectedRestaurantId(restaurantId);
    else if (!selectedRestaurantId && availableRestaurants[0]) setSelectedRestaurantId(availableRestaurants[0].id);
  }, [restaurantId, availableRestaurants, selectedRestaurantId]);

  useEffect(() => {
    const r = selectedRestaurantId ? getRestaurant(selectedRestaurantId) : undefined;
    setItems(r?.menu || []);
  }, [selectedRestaurantId]);

  const save = (next: MenuItem[]) => {
    if (!selectedRestaurantId) return;
    const all = getRestaurants();
    setRestaurants(all.map((r) => r.id === selectedRestaurantId ? { ...r, menu: next } : r));
    setItems(next);
  };

  const selectImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please select an image');
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || '');
      setDraft((d) => ({ ...d, image: value }));
      setImagePreview(value);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    setImagePreview('');
  };

  const addOrUpdate = () => {
    if (!selectedRestaurantId) return toast.error('Please select a restaurant');
    if (!draft.name.trim() || !Number(draft.price)) return toast.error('Name and price are required');

    if (editingId) {
      save(items.map((item) => item.id === editingId ? {
        ...item,
        name: draft.name.trim(),
        price: Number(draft.price),
        description: draft.description,
        category: draft.category,
        offer: draft.offer,
        image: draft.image || item.image,
      } : item));
      toast.success('Menu item updated');
    } else {
      const item: MenuItem = {
        id: `m-${Date.now()}`,
        name: draft.name.trim(),
        price: Number(draft.price),
        description: draft.description,
        image: draft.image || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
        category: draft.category || 'Main Course',
        isVeg: false,
        offer: draft.offer,
      };
      save([...items, item]);
      toast.success('Menu item added');
    }
    resetForm();
  };

  const editItem = (item: MenuItem) => {
    setEditingId(item.id);
    setDraft({
      name: item.name,
      price: String(item.price),
      description: item.description || '',
      category: item.category || 'Main Course',
      offer: item.offer || '',
      image: item.image || '',
    });
    setImagePreview(item.image || '');
  };

  const remove = (id: string) => {
    if (!window.confirm('Delete this food item?')) return;
    save(items.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
    toast.success('Menu item removed');
  };

  return (
    <div className="rounded-xl border p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Food Menu Manager</h3>
          <p className="text-xs text-muted-foreground">Manage food for one selected restaurant</p>
        </div>
        <Badge variant="outline">{items.length} items</Badge>
      </div>

      {admin && (
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">Restaurant *</label>
          <select
            value={selectedRestaurantId}
            onChange={(e) => { setSelectedRestaurantId(e.target.value); resetForm(); }}
            className="h-10 w-full rounded-md border bg-background px-3"
          >
            <option value="">Select approved restaurant</option>
            {availableRestaurants.filter((r) => r.status === 'approved').map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      )}

      {!selectedRestaurantId ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Select a restaurant to manage its menu.
        </div>
      ) : (
        <>
          <div className="grid gap-3 rounded-lg bg-secondary/40 p-3 sm:grid-cols-2">
            <Input placeholder="Food name *" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <Input type="number" min="0" placeholder="Price ₹ *" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
            <Input placeholder="Category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
            <Input placeholder="Offer (e.g. 20% OFF)" value={draft.offer} onChange={(e) => setDraft({ ...draft, offer: e.target.value })} />
            <Textarea placeholder="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="sm:col-span-2" />

            <div className="sm:col-span-2 flex flex-wrap items-start gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm">
                <ImagePlus className="h-4 w-4" />
                {draft.image ? 'Change photo' : 'Upload photo'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => selectImage(e.target.files?.[0])} />
              </label>

              {imagePreview && (
                <div className="relative h-20 w-20 overflow-hidden rounded-lg border bg-background">
                  <img src={imagePreview} alt="Food preview" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => { setImagePreview(''); setDraft({ ...draft, image: '' }); }} className="absolute right-1 top-1 rounded-full bg-background/90 p-1">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="sm:col-span-2 flex gap-2">
              <Button onClick={addOrUpdate}>
                {editingId ? <Pencil className="mr-1 h-4 w-4" /> : <Plus className="mr-1 h-4 w-4" />}
                {editingId ? 'Update food' : 'Add food'}
              </Button>
              {editingId && <Button variant="outline" onClick={resetForm}>Cancel</Button>}
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {items.length === 0 && <p className="col-span-full py-6 text-center text-sm text-muted-foreground">No food items yet.</p>}
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-lg border p-3">
                <img src={item.image} className="h-20 w-20 rounded-lg object-cover" alt={item.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2"><p className="font-semibold">{item.name}</p><span className="font-bold">₹{item.price}</span></div>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2"><Badge variant="outline">{item.category}</Badge>{item.isBestseller && <Badge>Bestseller</Badge>}{item.offer && <Badge variant="secondary">{item.offer}</Badge>}</div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="icon" variant="ghost" onClick={() => editItem(item)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
