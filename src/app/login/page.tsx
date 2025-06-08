'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { account } from '@/lib/appwrite';
import { ID } from 'appwrite';
import { toast } from 'react-toastify';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  // First check if user is already logged in
  useEffect(() => {
    const checkExistingSession = async () => {
      console.log('🔒 Login Page: Checking for existing session...');
      
      // Clear any stale redirect flags to break loops
      localStorage.removeItem('auth_redirect');
      
      try {
        const session = await account.getSession('current');
        const user = await account.get();
        console.log('✅ Login Page: User already logged in:', user.email);
        router.push('/dashboard');
      } catch (error) {
        console.log('❌ Login Page: No active session found');
        setIsCheckingAuth(false);
      }
    };
    
    checkExistingSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('🔑 Login Page: Attempting login...');

      // Create a new session
      const session = await account.createEmailSession(email, password);
      console.log('✅ Login Page: Session created:', session.$id);

      // Get the current user to verify login was successful
      const user = await account.get();
      console.log('✅ Login Page: User verified:', user.email);

      toast.success('Login successful!');
      
      // Navigate to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error('❌ Login Page: Login failed:', error);
      setError(error?.message || 'Failed to login. Please check your credentials.');
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-lg w-96 border border-gray-200">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
          Admin Login
        </h1>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-500 text-center rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400"
              required
              placeholder="Enter admin email"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400"
                required
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition-colors duration-200 font-semibold shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
