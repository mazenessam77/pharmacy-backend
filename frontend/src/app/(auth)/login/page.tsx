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
import { AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoginError(null);
    try {
      await login(data);
      toast.success('Welcome back');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Invalid email or password.';
      setLoginError(msg);
    }
  };

  return (
    <div>
      <h2 className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">Welcome back</h2>
      <h3 className="text-[28px] font-light uppercase tracking-wide mb-10">Sign In</h3>

      {/* Inline error banner */}
      {loginError && (
        <div className="flex items-start gap-3 border-l-2 border-red-500 bg-red-50 pl-4 py-2.5 mb-6">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-[12px] text-red-600 font-medium">{loginError}</p>
        </div>
      )}

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
            className="absolute right-0 top-7 text-neutral-400 hover:text-black transition-colors duration-200 active:scale-90"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" className="w-3.5 h-3.5 border-neutral-300 accent-black" />
            <span className="text-[11px] uppercase tracking-widest text-neutral-500 group-hover:text-black transition-colors duration-200">
              Remember me
            </span>
          </label>
          <Link
            href="/forgot-password"
            className="text-[11px] uppercase tracking-widest text-neutral-500 hover:text-black transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-black after:transition-all after:duration-300 hover:after:w-full"
          >
            Forgot password?
          </Link>
        </div>

        <div className="pt-4">
          <Button type="submit" isLoading={isLoading} className="w-full group" size="lg">
            Sign In
            {!isLoading && (
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            )}
          </Button>
        </div>
      </form>

      <div className="mt-10 text-center">
        <p className="text-[11px] uppercase tracking-widest text-neutral-400">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-black hover:opacity-60 transition-opacity duration-200 underline underline-offset-4"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
