'use client';

import { useEffect, useState } from 'react';
import { account } from '@/lib/appwrite';
import { Loader2 } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      {user && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Welcome, {user.email}</h2>
          <p className="text-gray-600">You are logged in as an administrator.</p>
        </div>
      )}
    </div>
  );
}
