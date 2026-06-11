'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
<<<<<<< HEAD

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/landing');
  }, [router]);
=======
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
>>>>>>> 0d7a0786a3e6820d8214f24ae51d599406c45777

  return null;
}
