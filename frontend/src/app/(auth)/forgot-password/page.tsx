'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/lib/validations';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await forgotPassword(data.email);
      setSent(true);
      toast.success('Reset link sent');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-12 h-px bg-black mx-auto mb-8" />
        <h2 className="text-[28px] font-light uppercase tracking-wide mb-3">Check Your Email</h2>
        <p className="text-[12px] text-neutral-500 leading-relaxed mb-10 max-w-xs mx-auto">
          If an account exists with that email, we&apos;ve sent a password reset link.
        </p>
        <Link href="/login">
          <Button variant="outline">
            Back to Sign In
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-[11px] uppercase tracking-widest text-neutral-500 mb-1">Account recovery</h2>
      <h3 className="text-[28px] font-light uppercase tracking-wide mb-3">Forgot Password</h3>
      <p className="text-[12px] text-neutral-400 mb-10">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="pt-4">
          <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
            Send Reset Link
          </Button>
        </div>
      </form>

      <div className="mt-10 text-center">
        <Link
          href="/login"
          className="text-[11px] uppercase tracking-widest text-neutral-400 hover:text-black transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
