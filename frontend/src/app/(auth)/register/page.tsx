'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { registerSchema, RegisterFormData } from '@/lib/validations';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { EGYPTIAN_GOVERNORATES } from '@/lib/governorates';
import { ArrowRight } from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

export default function RegisterPage() {
  const { t } = useTranslation('auth');
  const { register: registerUser, googleLogin, isLoading } = useAuthStore();
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
        payload.address = data.address;
        payload.governorate = data.governorate;
        payload.workingHours = { open: data.workingHoursOpen, close: data.workingHoursClose };
      }

      await registerUser(payload);
      toast.success(t('register.createdToast'));
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || t('register.failed'));
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;
    try {
      await googleLogin(credentialResponse.credential);
      toast.success(t('register.createdToast'));
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || t('register.googleError'));
    }
  };

  return (
    <div>
      <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-1">{t('register.eyebrow')}</h2>
      <h3 className="text-[32px] font-black tracking-tight mb-6">{t('register.submit')}</h3>

      {/* Google button — patients only */}
      <div className="mb-2">
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error(t('register.googleError'))}
            theme="outline"
            size="large"
            text="signup_with"
            shape="rectangular"
            width="360"
          />
        </div>
        <p className="text-center text-[10px] uppercase tracking-widest text-neutral-400 mt-2">
          {t('register.googleNote')}
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-neutral-200" />
        <span className="text-[10px] uppercase tracking-widest text-neutral-400">{t('register.orWithEmail')}</span>
        <div className="flex-1 h-px bg-neutral-200" />
      </div>

      {/* Role Selector — sliding pill */}
      <div className="relative flex bg-neutral-100 rounded-full overflow-hidden mb-8 p-1">
        {/* sliding gradient indicator */}
        <div
          className={`absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-blue-600 to-sky-500 shadow-md shadow-blue-500/30 transition-transform duration-300 ease-out ${
            role === 'pharmacy' ? 'translate-x-[calc(100%+4px)] rtl:-translate-x-[calc(100%+4px)]' : 'translate-x-0'
          }`}
        />
        <button
          type="button"
          onClick={() => handleRoleChange('patient')}
          className={`relative z-10 flex-1 py-3 text-[11px] uppercase tracking-widest transition-colors duration-200 ${
            role === 'patient' ? 'text-white' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          {t('register.rolePatient')}
        </button>
        <button
          type="button"
          onClick={() => handleRoleChange('pharmacy')}
          className={`relative z-10 flex-1 py-3 text-[11px] uppercase tracking-widest transition-colors duration-200 ${
            role === 'pharmacy' ? 'text-white' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          {t('register.rolePharmacy')}
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <input type="hidden" {...register('role')} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            label={t('register.name')}
            placeholder={t('register.namePlaceholder')}
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label={t('register.phone')}
            placeholder={t('register.phonePlaceholder')}
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        <Input
          label={t('register.email')}
          type="email"
          placeholder={t('register.emailPlaceholder')}
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            label={t('register.password')}
            type="password"
            placeholder={t('register.passwordMin')}
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label={t('register.confirmPassword')}
            type="password"
            placeholder={t('register.confirmPasswordRepeat')}
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
                {t('register.pharmacyDetails')}
              </p>
              <div className="flex-1 h-px bg-neutral-200" />
            </div>

            <Input
              label={t('register.pharmacyName')}
              placeholder={t('register.pharmacyNamePlaceholder')}
              error={(errors as any).pharmacyName?.message}
              {...register('pharmacyName' as any)}
            />

            <Input
              label={t('register.address')}
              placeholder={t('register.addressPlaceholder')}
              error={(errors as any).address?.message}
              {...register('address' as any)}
            />

            <div>
              <label className="block text-[11px] uppercase tracking-widest text-neutral-500 mb-2">
                {t('register.governorate')}
              </label>
              <div className="relative">
                <select
                  {...register('governorate' as any)}
                  className="peer w-full py-2.5 bg-transparent text-[14px] focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">{t('register.selectGovernorate')}</option>
                  {EGYPTIAN_GOVERNORATES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <div className="absolute bottom-0 start-0 end-0 h-px bg-neutral-200" />
                <div className="absolute bottom-0 start-0 end-0 h-[1.5px] bg-blue-600 scale-x-0 peer-focus:scale-x-100 transition-transform duration-300 origin-left rtl:origin-right" />
              </div>
              {(errors as any).governorate && (
                <p className="mt-1.5 text-[11px] text-rose-600 font-medium">
                  {(errors as any).governorate.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label={t('register.openingTime')}
                type="time"
                error={(errors as any).workingHoursOpen?.message}
                {...register('workingHoursOpen' as any)}
              />
              <Input
                label={t('register.closingTime')}
                type="time"
                error={(errors as any).workingHoursClose?.message}
                {...register('workingHoursClose' as any)}
              />
            </div>
          </div>
        )}

        <div className="pt-4">
          <Button type="submit" variant="indigo" isLoading={isLoading} className="w-full group" size="lg">
            {t('register.submit')}
            {!isLoading && (
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180" />
            )}
          </Button>
        </div>
      </form>

      <div className="mt-8 text-center">
        <p className="text-[11px] uppercase tracking-widest text-neutral-400">
          {t('register.haveAccount')}{' '}
          <Link
            href="/login"
            className="font-bold text-blue-600 hover:text-blue-700 transition-colors duration-200"
          >
            {t('register.signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
