'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootIndexRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-darkBg flex items-center justify-center">
      <div className="h-8 w-8 rounded-lg bg-indigo-600 animate-pulse" />
    </div>
  );
}
