'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import usersData from '@/data/users.json';

interface User {
  username: string;
  password: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  currentUser: null,
  login: () => false,
  logout: () => {},
  changePassword: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Listen for storage changes across tabs
  useEffect(() => {
    const handleStorageChange = () => {
      const auth = localStorage.getItem('adminAuth');
      const authTimestamp = localStorage.getItem('authTimestamp');
      const storedUser = localStorage.getItem('currentUser');
      
      if (!auth || !authTimestamp || !storedUser) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        if (pathname !== '/login') {
          router.push('/login');
        }
        return;
      }

      const now = new Date().getTime();
      const timestamp = parseInt(authTimestamp);
      if (now - timestamp < 24 * 60 * 60 * 1000) {
        setIsAuthenticated(true);
        setCurrentUser(JSON.parse(storedUser));
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('authTimestamp');
        localStorage.removeItem('currentUser');
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [pathname, router]);

  // Initial auth check
  useEffect(() => {
    const checkAuth = () => {
      const auth = localStorage.getItem('adminAuth');
      const authTimestamp = localStorage.getItem('authTimestamp');
      const storedUser = localStorage.getItem('currentUser');
      
      if (!auth || !authTimestamp || !storedUser) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setIsLoading(false);
        if (pathname !== '/login') {
          router.push('/login');
        }
        return;
      }

      const now = new Date().getTime();
      const timestamp = parseInt(authTimestamp);
      if (now - timestamp < 24 * 60 * 60 * 1000) {
        setIsAuthenticated(true);
        setCurrentUser(JSON.parse(storedUser));
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('authTimestamp');
        localStorage.removeItem('currentUser');
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [pathname, router]);

  const login = (username: string, password: string) => {
    const user = usersData.users.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      setIsAuthenticated(true);
      setCurrentUser(user);
      localStorage.setItem('adminAuth', 'true');
      localStorage.setItem('authTimestamp', new Date().getTime().toString());
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('authTimestamp');
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  const changePassword = (oldPassword: string, newPassword: string) => {
    if (!currentUser || currentUser.password !== oldPassword) {
      return false;
    }

    // Update password in users data
    const userIndex = usersData.users.findIndex(u => u.username === currentUser.username);
    if (userIndex !== -1) {
      usersData.users[userIndex].password = newPassword;
      
      // Update current user
      const updatedUser = { ...currentUser, password: newPassword };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, currentUser, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
