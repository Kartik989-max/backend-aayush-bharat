'use client';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import CountUp from 'react-countup';
import { orderService } from '@/services/orderService';
import { listDocuments, account } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, LogOut, TrendingUp, ShoppingCart, Package, Layers, AlertTriangle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Shimmer } from "@/components/ui/shimmer";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    dailyRevenue: 0,
    totalOrders: 0,
    lowStockItems: 0,
    outOfStockItems: 0
  });
  
  const [monthlyData, setMonthlyData] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  
  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await account.get();
        setUser(userData);
      } catch (error) {
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Fetch basic stats
        const products = await listDocuments(process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!);
        const categories = await listDocuments(process.env.NEXT_PUBLIC_APPWRITE_CATEGORY_COLLECTION_ID!);
        
        // Get order analytics
        const orderAnalytics = await orderService.getOrderAnalytics();
        
        // Calculate inventory stats
        const lowStockCount = products.documents.filter(p => {
          const stock = p.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0;
          return stock > 0 && stock < 10;
        }).length;
        
        const outOfStockCount = products.documents.filter(p => {
          const stock = p.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0;
          return stock === 0;
        }).length;

        setStats({
          products: products.documents.length,
          categories: categories.documents.length,
          totalRevenue: orderAnalytics.totalRevenue,
          monthlyRevenue: orderAnalytics.monthlyRevenue,
          dailyRevenue: orderAnalytics.dailyRevenue,
          totalOrders: orderAnalytics.totalOrders,
          lowStockItems: lowStockCount,
          outOfStockItems: outOfStockCount
        });

        setMonthlyData(orderAnalytics.monthlyData);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (!user) {
    return null;
  }

  const displayStats = [
    { 
      title: 'Total Revenue', 
      value: stats.totalRevenue,
      prefix: '₹',
      change: '+15%' 
    },
    { 
      title: 'Monthly Revenue', 
      value: stats.monthlyRevenue,
      prefix: '₹',
      change: '+10%' 
    },
    { 
      title: "Today's Revenue", 
      value: stats.dailyRevenue,
      prefix: '₹',
      change: '+5%' 
    },
    { 
      title: 'Total Orders', 
      value: stats.totalOrders,
      change: '+12%' 
    },
    { 
      title: 'Total Products', 
      value: stats.products, 
      change: '+8%' 
    },
    { 
      title: 'Total Categories', 
      value: stats.categories, 
      change: '+6%' 
    },
    { 
      title: 'Low Stock Items', 
      value: stats.lowStockItems,
      change: stats.lowStockItems > 10 ? '-8%' : '+0%',
      alert: stats.lowStockItems > 10
    },
    { 
      title: 'Out of Stock', 
      value: stats.outOfStockItems,
      change: stats.outOfStockItems > 0 ? '-10%' : '+0%',
      alert: stats.outOfStockItems > 0
    }
  ];

  // const monthlyOrdersData = {
  //   labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  //   datasets: [
  //     {
  //       label: 'Monthly Sales (₹)',
  //       data: orderData.monthlySales,
  //       borderColor: '#7da09e',
  //       backgroundColor: '#fff',
  //       fill: true,
  //       tension: 0.4,
  //     },
  //   ],
  // };

  return (
    <div className="flex-1 space-y-4 p-8">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold text-primary">Dashboard Overview</h1>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Shimmer type="text" className="w-48" />
              <Shimmer type="button" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Shimmer key={i} type="card" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {displayStats.map((stat, index) => {
                const Icon = stat.title.includes('Revenue') ? TrendingUp :
                           stat.title.includes('Orders') ? ShoppingCart :
                           stat.title.includes('Products') ? Package :
                           stat.title.includes('Categories') ? Layers :
                           stat.title.includes('Low Stock') ? AlertTriangle :
                           XCircle;
                           
                return (
                  <Card 
                    key={index}
                    className={`${stat.alert ? 'border-red-500 border-2' : ''} transition-all duration-300 hover:shadow-lg`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <Icon className={`h-4 w-4 ${stat.alert ? 'text-red-500' : 'text-muted-foreground'}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold">
                          {stat.prefix}
                          <CountUp
                            end={stat.value}
                            duration={2}
                            separator=","
                            useEasing={true}
                            decimals={stat.title.includes('Revenue') ? 2 : 0}
                          />
                        </div>
                        <span 
                          className={`text-sm font-medium ${
                            stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {stat.change}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {(stats.lowStockItems > 0 || stats.outOfStockItems > 0) && (
              <Alert variant="destructive" className="mb-8">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Inventory Alert</AlertTitle>
                <AlertDescription>
                  {stats.outOfStockItems > 0 && `${stats.outOfStockItems} items are out of stock. `}
                  {stats.lowStockItems > 0 && `${stats.lowStockItems} items are running low on stock.`}
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Overview</CardTitle>
            <CardDescription>Track your revenue trends over the past year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
            <Line 
              data={{
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [
                  {
                    label: 'Monthly Revenue (₹)',
                    data: monthlyData,
                    borderColor: '#7da09e',
                    backgroundColor: 'rgba(125, 160, 158, 0.1)',
                    fill: true,
                    tension: 0.4
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)',
                    },
                    ticks: {
                      callback: (value) => `₹${value.toLocaleString()}`
                    }
                  },
                  x: {
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)',
                    }
                  }
                },
                plugins: {
                  legend: {
                    position: 'top'
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `Revenue: ₹${context.parsed.y.toLocaleString()}`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
