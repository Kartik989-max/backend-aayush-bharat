'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { account } from '@/lib/appwrite';
import { Loader2 } from 'lucide-react';
import Sidebar from '@/components/sidebar/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isActive = true;

    const checkAuth = async () => {
      console.log('🔒 Dashboard Layout: Checking authentication...');

      try {
        // Attempt to get the session
        const session = await account.getSession('current');
        console.log('✅ Dashboard Layout: Session found:', session.$id);
        
        // Verify user exists
        const user = await account.get();
        console.log('✅ Dashboard Layout: User verified:', user.email);
        
        if (isActive) {
          setIsLoading(false);
          setAuthChecked(true);
        }
      } catch (error) {
        console.error('❌ Dashboard Layout: No valid session:', error);
        
        if (isActive) {
          // Use router for navigation instead of window.location for better Next.js integration
          router.push('/login');
        }
      }
    };

    checkAuth();

    return () => {
      isActive = false;
    };
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 pl-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
