'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/validations';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      toast.success('Welcome back');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Login failed');
    }
  };

  return (
    <div>
      <h2 className="text-[11px] uppercase tracking-widest text-neutral-500 mb-1">Welcome back</h2>
      <h3 className="text-[28px] font-light uppercase tracking-wide mb-10">Sign In</h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-0 top-7 text-[11px] uppercase tracking-widest text-neutral-400 hover:text-black transition-colors"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="w-3.5 h-3.5 border-neutral-300 accent-black" />
            <span className="text-[11px] uppercase tracking-widest text-neutral-500">Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-[11px] uppercase tracking-widest text-neutral-500 hover:text-black transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <div className="pt-4">
          <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
            Sign In
          </Button>
        </div>
      </form>

      <div className="mt-10 text-center">
        <p className="text-[11px] uppercase tracking-widest text-neutral-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-black hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
