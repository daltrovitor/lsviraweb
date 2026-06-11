'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function HomePage() {
  const router = useRouter();
  const { user, loading, isApproved } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user && isApproved) {
        router.replace('/dashboard');
      } else {
        router.replace('/landing');
      }
    }
  }, [user, loading, isApproved, router]);

  return null;
}
