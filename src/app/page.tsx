'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { account } from '@/lib/appwrite';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to get the current session
        await account.get();
        router.push('/dashboard');
      } catch (error) {
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-dark-100">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </main>
  );
}
