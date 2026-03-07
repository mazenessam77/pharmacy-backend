'use client';

import { redirect } from 'next/navigation';

export default function PharmacyProfileRedirect() {
  redirect('/pharmacy/settings');
}
