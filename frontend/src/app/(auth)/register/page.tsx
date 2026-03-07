'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormData } from '@/lib/validations';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register: registerUser, isLoading } = useAuthStore();
  const [role, setRole] = useState<'patient' | 'pharmacy'>('patient');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'patient' },
  });

  const handleRoleChange = (newRole: 'patient' | 'pharmacy') => {
    setRole(newRole);
    setValue('role', newRole);
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const payload: any = {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: data.role,
      };

      if (data.role === 'pharmacy') {
        payload.pharmacyName = data.pharmacyName;
        payload.license = data.license;
        payload.address = data.address;
        payload.location = { lat: data.lat, lng: data.lng };
        payload.workingHours = { open: data.workingHoursOpen, close: data.workingHoursClose };
      }

      await registerUser(payload);
      toast.success('Account created');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Registration failed');
    }
  };

  return (
    <div>
      <h2 className="text-[11px] uppercase tracking-widest text-neutral-500 mb-1">Join us</h2>
      <h3 className="text-[28px] font-light uppercase tracking-wide mb-8">Create Account</h3>

      {/* Role Selector */}
      <div className="flex border border-black mb-8">
        <button
          type="button"
          onClick={() => handleRoleChange('patient')}
          className={`flex-1 py-3 text-[11px] uppercase tracking-widest transition-colors duration-300 ${
            role === 'patient'
              ? 'bg-black text-white'
              : 'bg-white text-black hover:bg-neutral-50'
          }`}
        >
          Patient
        </button>
        <button
          type="button"
          onClick={() => handleRoleChange('pharmacy')}
          className={`flex-1 py-3 text-[11px] uppercase tracking-widest transition-colors duration-300 border-l border-black ${
            role === 'pharmacy'
              ? 'bg-black text-white'
              : 'bg-white text-black hover:bg-neutral-50'
          }`}
        >
          Pharmacy
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <input type="hidden" {...register('role')} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            label="Full Name"
            placeholder="John Doe"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Phone"
            placeholder="+20xxxxxxxxxx"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            label="Password"
            type="password"
            placeholder="Min 6 characters"
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Repeat password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>

        {/* Pharmacy-specific fields */}
        {role === 'pharmacy' && (
          <div className="space-y-5 pt-6">
            <div className="w-full h-px bg-neutral-200" />
            <p className="text-[11px] uppercase tracking-widest text-neutral-400">Pharmacy Details</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Pharmacy Name"
                placeholder="My Pharmacy"
                error={(errors as any).pharmacyName?.message}
                {...register('pharmacyName' as any)}
              />
              <Input
                label="License Number"
                placeholder="PH-2024-XXX"
                error={(errors as any).license?.message}
                {...register('license' as any)}
              />
            </div>

            <Input
              label="Address"
              placeholder="Street, City"
              error={(errors as any).address?.message}
              {...register('address' as any)}
            />

            <div className="grid grid-cols-2 gap-5">
              <Input
                label="Latitude"
                type="number"
                step="any"
                placeholder="30.0444"
                error={(errors as any).lat?.message}
                {...register('lat' as any, { valueAsNumber: true })}
              />
              <Input
                label="Longitude"
                type="number"
                step="any"
                placeholder="31.2357"
                error={(errors as any).lng?.message}
                {...register('lng' as any, { valueAsNumber: true })}
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <Input
                label="Opening Time"
                type="time"
                error={(errors as any).workingHoursOpen?.message}
                {...register('workingHoursOpen' as any)}
              />
              <Input
                label="Closing Time"
                type="time"
                error={(errors as any).workingHoursClose?.message}
                {...register('workingHoursClose' as any)}
              />
            </div>
          </div>
        )}

        <div className="pt-4">
          <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
            Create Account
          </Button>
        </div>
      </form>

      <div className="mt-10 text-center">
        <p className="text-[11px] uppercase tracking-widest text-neutral-400">
          Already have an account?{' '}
          <Link href="/login" className="text-black hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
