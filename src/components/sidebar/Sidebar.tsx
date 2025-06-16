'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Settings, 
  ShoppingBag, 
  Image, 
  Users, 
  LogOut,
  Weight as WeightIcon,
  Tag,
  FolderOpen,
  PenSquare,
  Ticket,
  ScrollText,
  Film,
  FileText
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { account } from '@/lib/appwrite';
import { toast } from 'react-toastify';

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };
  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Products',
      href: '/dashboard/products',
      icon: ShoppingBag,
    },
    {
      name: 'Categories',
      href: '/dashboard/categories',
      icon: Tag,
    },
    {
      name: 'Inventory',
      href: '/dashboard/inventory',
      icon: FolderOpen,
    },
    {
      name: 'Media',
      href: '/dashboard/media',
      icon: Image,
    },
    {
      name: 'Hero Section',
      href: '/dashboard/hero',
      icon: Image,
    },
    {
      name: 'Collection',
      href: '/dashboard/collection',
      icon: PenSquare,
    },
    {
      name: 'Reel Manager',
      href: '/dashboard/reels',
      icon: Film,
    },
    {
      name: 'Blog',
      href: '/dashboard/blog',
      icon: FileText,
    },
    {
      name: 'Orders',
      href: '/dashboard/orders',
      icon: ShoppingBag,
    },
    {
      name: 'Coupons',
      href: '/dashboard/coupons',
      icon: Ticket,
    },
    {
      name: 'Contact Queries',
      href: '/dashboard/contact-queries',
      icon: ScrollText,
    },
  ];

  return (
    <Card className="h-screen border-r-2 w-64 bg-card fixed left-0 top-0 rounded-none">
      <div className="p-6">
        <h1 className="text-2xl border-b-2 font-bold text-primary mb-8">Admin</h1>
        
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Button
                key={item.name}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2",
                  isActive ? "bg-secondary" : "hover:bg-secondary/50"
                )}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </div>

      <div className="absolute bottom-0 w-full p-6">
        <Button 
          variant="ghost"
          className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </Button>
      </div>
    </Card>
  );
};

export default Sidebar;
