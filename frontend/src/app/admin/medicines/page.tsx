'use client';

import { useEffect, useState } from 'react';
import { medicineService } from '@/lib/services/medicineService';
import { adminService } from '@/lib/services/adminService';
import { Medicine } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';
import { ListSkeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Pill } from 'lucide-react';

export default function AdminMedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<Medicine | null>(null);
  const [form, setForm] = useState({ name: '', genericName: '', category: '', description: '', requiresPrescription: false });

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const res = await medicineService.getAll({ search: search || undefined, limit: 100 });
      setMedicines(res.data.data?.medicines || res.data.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [search]);

  const openAdd = () => {
    setForm({ name: '', genericName: '', category: '', description: '', requiresPrescription: false });
    setEditItem(null);
    setModal(true);
  };

  const openEdit = (med: Medicine) => {
    setForm({
      name: med.name,
      genericName: med.genericName || '',
      category: med.category || '',
      description: med.description || '',
      requiresPrescription: med.requiresPrescription,
    });
    setEditItem(med);
    setModal(true);
  };

  const handleSave = async () => {
    try {
      if (editItem) {
        await adminService.updateMedicine(editItem._id, form);
        toast.success('Medicine updated');
      } else {
        await adminService.createMedicine(form);
        toast.success('Medicine created');
      }
      setModal(false);
      fetchMedicines();
    } catch {
      toast.error('Save failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminService.deleteMedicine(id);
      setMedicines(medicines.filter((m) => m._id !== id));
      toast.success('Medicine removed');
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">Catalog</p>
          <h1 className="text-[28px] font-light uppercase tracking-wide">Medicines</h1>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-3 h-3" />
          Add Medicine
        </Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search medicines..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <ListSkeleton count={5} />
      ) : medicines.length === 0 ? (
        <div className="border border-neutral-200 p-16 text-center">
          <Pill className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
          <p className="text-[12px] text-neutral-400">No medicines found</p>
        </div>
      ) : (
        <div className="border border-neutral-200">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-neutral-200 bg-neutral-50">
            <div className="col-span-3 text-[10px] uppercase tracking-widest text-neutral-400">Name</div>
            <div className="col-span-3 text-[10px] uppercase tracking-widest text-neutral-400">Generic</div>
            <div className="col-span-2 text-[10px] uppercase tracking-widest text-neutral-400">Category</div>
            <div className="col-span-2 text-[10px] uppercase tracking-widest text-neutral-400">Rx Required</div>
            <div className="col-span-2 text-[10px] uppercase tracking-widest text-neutral-400 text-right">Actions</div>
          </div>
          {medicines.map((med) => (
            <div key={med._id} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-neutral-100 items-center">
              <div className="col-span-3 text-[13px]">{med.name}</div>
              <div className="col-span-3 text-[13px] text-neutral-500">{med.genericName || '—'}</div>
              <div className="col-span-2 text-[12px] text-neutral-500">{med.category || '—'}</div>
              <div className="col-span-2 text-[11px] uppercase tracking-widest">
                {med.requiresPrescription ? 'Yes' : 'No'}
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <button onClick={() => openEdit(med)} className="text-neutral-400 hover:text-black transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(med._id)} className="text-neutral-400 hover:text-black transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editItem ? 'Edit Medicine' : 'Add Medicine'}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Generic Name" value={form.genericName} onChange={(e) => setForm({ ...form, genericName: e.target.value })} />
          <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.requiresPrescription}
              onChange={(e) => setForm({ ...form, requiresPrescription: e.target.checked })}
              className="w-3.5 h-3.5 accent-black"
            />
            <span className="text-[11px] uppercase tracking-widest text-neutral-500">Requires Prescription</span>
          </label>
          <div className="pt-2">
            <Button onClick={handleSave} className="w-full">{editItem ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
