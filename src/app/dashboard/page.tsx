'use client';

import { useEffect, useState } from 'react';
import { account } from '@/lib/appwrite';
import { Loader2 } from 'lucide-react';
import Dashboard from '@/components/dashboard/Dashboard';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let isActive = true;

    const fetchUserData = async () => {
      console.log('🔒 Dashboard Page: Fetching user data...');

      try {
        const userData = await account.get();
        console.log('✅ Dashboard Page: User data retrieved:', userData.email);

        if (isActive) {
          setUser(userData);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ Dashboard Page: User data fetch failed:', error);
        // No need to redirect, the layout will handle that
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();

    return () => {
      isActive = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return <Dashboard />;
}
