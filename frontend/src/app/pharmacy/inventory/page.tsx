'use client';

import { useEffect, useState } from 'react';
import { inventoryService } from '@/lib/services/inventoryService';
import { InventoryItem } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { ListSkeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Upload, Package } from 'lucide-react';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState({ medicineName: '', genericName: '', price: '', quantity: '' });

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getAll({ search: search || undefined, limit: 100 });
      setItems(res.data.data?.inventory || res.data.data || []);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [search]);

  const openAdd = () => {
    setForm({ medicineName: '', genericName: '', price: '', quantity: '' });
    setEditItem(null);
    setAddModal(true);
  };

  const openEdit = (item: InventoryItem) => {
    setForm({
      medicineName: item.medicineName,
      genericName: item.genericName || '',
      price: item.price.toString(),
      quantity: item.quantity.toString(),
    });
    setEditItem(item);
    setAddModal(true);
  };

  const handleSave = async () => {
    try {
      if (editItem) {
        await inventoryService.update(editItem._id, {
          medicineName: form.medicineName,
          price: parseFloat(form.price),
          quantity: parseInt(form.quantity),
        });
        toast.success('Item updated');
      } else {
        await inventoryService.add({
          medicineName: form.medicineName,
          genericName: form.genericName || undefined,
          price: parseFloat(form.price),
          quantity: parseInt(form.quantity),
        });
        toast.success('Item added');
      }
      setAddModal(false);
      fetchInventory();
    } catch {
      toast.error('Save failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await inventoryService.delete(id);
      setItems(items.filter((i) => i._id !== id));
      toast.success('Item removed');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await inventoryService.bulkImport(file);
      toast.success('Import successful');
      fetchInventory();
    } catch {
      toast.error('Import failed');
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">Stock</p>
          <h1 className="text-[28px] font-light uppercase tracking-wide">Inventory</h1>
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input type="file" accept=".csv" onChange={handleBulkImport} className="hidden" />
            <Button variant="outline" size="sm" className="pointer-events-none">
              <Upload className="w-3 h-3" />
              Import CSV
            </Button>
          </label>
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-3 h-3" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search inventory..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {loading ? (
        <ListSkeleton count={5} />
      ) : items.length === 0 ? (
        <div className="border border-neutral-200 p-16 text-center">
          <Package className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
          <p className="text-[12px] text-neutral-400">No inventory items</p>
        </div>
      ) : (
        <div className="border border-neutral-200">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-neutral-200 bg-neutral-50">
            <div className="col-span-4 text-[10px] uppercase tracking-widest text-neutral-400">Medicine</div>
            <div className="col-span-2 text-[10px] uppercase tracking-widest text-neutral-400">Price</div>
            <div className="col-span-2 text-[10px] uppercase tracking-widest text-neutral-400">Quantity</div>
            <div className="col-span-2 text-[10px] uppercase tracking-widest text-neutral-400">Status</div>
            <div className="col-span-2 text-[10px] uppercase tracking-widest text-neutral-400 text-right">Actions</div>
          </div>
          {items.map((item) => (
            <div key={item._id} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-neutral-100 items-center">
              <div className="col-span-4">
                <p className="text-[13px]">{item.medicineName}</p>
                {item.genericName && (
                  <p className="text-[11px] text-neutral-400">{item.genericName}</p>
                )}
              </div>
              <div className="col-span-2 text-[13px]">${item.price}</div>
              <div className="col-span-2 text-[13px]">{item.quantity}</div>
              <div className="col-span-2">
                <span className={`text-[10px] uppercase tracking-widest ${item.isAvailable ? 'text-neutral-900' : 'text-neutral-400'}`}>
                  {item.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <button onClick={() => openEdit(item)} className="text-neutral-400 hover:text-black transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(item._id)} className="text-neutral-400 hover:text-black transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title={editItem ? 'Edit Item' : 'Add Item'}>
        <div className="space-y-4">
          <Input
            label="Medicine Name"
            value={form.medicineName}
            onChange={(e) => setForm({ ...form, medicineName: e.target.value })}
          />
          {!editItem && (
            <Input
              label="Generic Name (Optional)"
              value={form.genericName}
              onChange={(e) => setForm({ ...form, genericName: e.target.value })}
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price"
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <Input
              label="Quantity"
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </div>
          <div className="pt-2">
            <Button onClick={handleSave} className="w-full">
              {editItem ? 'Update' : 'Add Item'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
