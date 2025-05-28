'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Sidebar = () => {
  const pathname = usePathname();
  const { logout } = useAuth();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    // {
    //   name: 'Hero Section',
    //   href: '/dashboard/hero',
    //   icon: Image,
    // },
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
      name: 'Orders',
      href: '/dashboard/orders',
      icon: ShoppingBag,
    },
    // {
    //   name: 'Blog',
    //   href: '/dashboard/blog',
    //   icon: PenSquare,
    // },
    {
      name: 'Coupons',
      href: '/dashboard/coupons',
      icon: Ticket,
    },
    // {
    //   name: 'Top Strip',
    //   href: '/dashboard/top-strip',
    //   icon: ScrollText,
    // },
  ];

  return (
    <aside className="h-screen border-r-2 w-64 bg-dark fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-2xl border-b-2 font-bold text-primary mb-8">Admin</h1>
        
        <nav className="space-y-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`dashboard/${item.href}/`);
            return (
              <Link 
                key={item.name}
                href={item.href}
                className={`sidebar-link hover:bg-slate-100 ${isActive ? 'bg-slate-100' : 'bg-none'}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="absolute bottom-0 w-full p-6">
        <button 
          onClick={logout}
          className="sidebar-link w-full text-red-500 hover:bg-red-500/10"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
