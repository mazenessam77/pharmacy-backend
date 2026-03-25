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
import { EGYPTIAN_GOVERNORATES } from '@/lib/governorates';
import { ArrowRight } from 'lucide-react';

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
        payload.governorate = data.governorate;
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
      <h2 className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">Join us</h2>
      <h3 className="text-[28px] font-light uppercase tracking-wide mb-8">Create Account</h3>

      {/* Role Selector — sliding pill */}
      <div className="relative flex bg-neutral-100 rounded-xl overflow-hidden mb-8">
        {/* sliding black indicator */}
        <div
          className={`absolute inset-y-0 w-1/2 bg-black transition-transform duration-300 ease-out ${
            role === 'pharmacy' ? 'translate-x-full' : 'translate-x-0'
          }`}
        />
        <button
          type="button"
          onClick={() => handleRoleChange('patient')}
          className={`relative z-10 flex-1 py-3 text-[11px] uppercase tracking-widest transition-colors duration-200 ${
            role === 'patient' ? 'text-white' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Patient
        </button>
        <button
          type="button"
          onClick={() => handleRoleChange('pharmacy')}
          className={`relative z-10 flex-1 py-3 text-[11px] uppercase tracking-widest transition-colors duration-200 ${
            role === 'pharmacy' ? 'text-white' : 'text-neutral-500 hover:text-neutral-800'
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

        {/* Pharmacy-specific fields — fades in when selected */}
        {role === 'pharmacy' && (
          <div className="space-y-5 pt-6 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-neutral-200" />
              <p className="text-[11px] uppercase tracking-widest text-neutral-400 shrink-0">
                Pharmacy Details
              </p>
              <div className="flex-1 h-px bg-neutral-200" />
            </div>

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

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-neutral-500 mb-2">
                Governorate
              </label>
              <div className="relative">
                <select
                  {...register('governorate' as any)}
                  className="peer w-full py-2.5 bg-transparent text-[14px] focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">Select governorate</option>
                  {EGYPTIAN_GOVERNORATES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-neutral-200" />
                <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-black scale-x-0 peer-focus:scale-x-100 transition-transform duration-300 origin-left" />
              </div>
              {(errors as any).governorate && (
                <p className="mt-1.5 text-[11px] text-red-500 font-medium">
                  {(errors as any).governorate.message}
                </p>
              )}
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
          <Button type="submit" isLoading={isLoading} className="w-full group" size="lg">
            Create Account
            {!isLoading && (
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            )}
          </Button>
        </div>
      </form>

      <div className="mt-10 text-center">
        <p className="text-[11px] uppercase tracking-widest text-neutral-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-black hover:opacity-60 transition-opacity duration-200 underline underline-offset-4"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
