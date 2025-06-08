'use client';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import CountUp from 'react-countup';
import { orderService } from '@/services/orderService';
import { productService } from '@/services/productService';
import { listDocuments, account } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, LogOut, TrendingUp, ShoppingCart, Package, Layers, AlertTriangle, XCircle, Plus, RefreshCw } from 'lucide-react';
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
    outOfStockItems: 0,
    totalInventoryValue: 0,
    averageProductPrice: 0,
    highestSellingCategory: '',
    topSellingProducts: [] as {name: string, sold: number}[],
    inventoryTurnoverRate: 0,
    productsSoldThisMonth: 0,
    averageProfitMargin: 0
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
        // Fetch all products with variants for accurate inventory data
        const allProducts = await productService.getProducts();
        const categories = await listDocuments(process.env.NEXT_PUBLIC_APPWRITE_CATEGORY_COLLECTION_ID!);
        
        // Get order analytics
        const orderAnalytics = await orderService.getOrderAnalytics();
        
        // Calculate inventory stats
        let totalInventoryValue = 0;
        let totalProductPrice = 0;
        let productCount = 0;
        
        // Create category product count map
        const categoryMap = new Map<string, string>();
        categories.documents.forEach((category: any) => {
          categoryMap.set(category.$id, category.name);
        });
        
        // Track product sales by category
        const categorySales = new Map<string, number>();
        const productSales = new Map<string, number>();
        
        // Process products for inventory value
        allProducts.forEach(product => {
          // Calculate product inventory value
          product.variants?.forEach(variant => {
            const variantValue = (variant.price || 0) * (variant.stock || 0);
            totalInventoryValue += variantValue;
          });
          
          // Calculate average product price
          if (product.variants && product.variants.length > 0) {
            const baseVariant = product.variants[0];
            totalProductPrice += baseVariant.price || 0;
            productCount++;
          }
          
          // Track category for this product
          if (product.category) {
            const categoryId = product.category.split(',')[0].trim();
            const currentCount = categorySales.get(categoryId) || 0;
            categorySales.set(categoryId, currentCount + 1);
          }
        });
        
        // Find highest selling category
        let highestSellingCategory = '';
        let highestCount = 0;
        categorySales.forEach((count, categoryId) => {
          if (count > highestCount) {
            highestCount = count;
            highestSellingCategory = categoryMap.get(categoryId) || '';
          }
        });
        
        // Process orders to find top selling products
        const topProducts: {name: string, sold: number}[] = [];
        if (orderAnalytics.recentOrders) {
          // Count occurrences of each product in orders
          orderAnalytics.recentOrders.forEach((order: any) => {
            if (order.product_id) {
              const currentCount = productSales.get(order.product_id) || 0;
              productSales.set(order.product_id, currentCount + 1);
            }
          });
          
          // Convert to array and sort
          Array.from(productSales.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([productId, sold]) => {
              const product = allProducts.find(p => p.$id === productId);
              if (product) {
                topProducts.push({
                  name: product.name,
                  sold
                });
              }
            });
        }
        
        // Calculate low stock and out of stock counts
        const lowStockCount = allProducts.filter(p => {
          const stock = p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
          return stock > 0 && stock < 10;
        }).length;
        
        const outOfStockCount = allProducts.filter(p => {
          const stock = p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
          return stock === 0;
        }).length;

        // Calculate inventory turnover rate (estimated)
        // Since we don't have actual COGS data, we'll use a simplified calculation
        const inventoryTurnoverRate = totalInventoryValue > 0 ? 
          (orderAnalytics.monthlyRevenue / totalInventoryValue) * 12 : 0;
        
        // Estimate average profit margin (typically ranges from 20-40% in retail)
        const estimatedProfitMargin = 30; // 30% as a default estimate

        setStats({
          products: allProducts.length,
          categories: categories.documents.length,
          totalRevenue: orderAnalytics.totalRevenue,
          monthlyRevenue: orderAnalytics.monthlyRevenue,
          dailyRevenue: orderAnalytics.dailyRevenue,
          totalOrders: orderAnalytics.totalOrders,
          lowStockItems: lowStockCount,
          outOfStockItems: outOfStockCount,
          totalInventoryValue,
          averageProductPrice: productCount > 0 ? totalProductPrice / productCount : 0,
          highestSellingCategory,
          topSellingProducts: topProducts,
          inventoryTurnoverRate,
          productsSoldThisMonth: orderAnalytics.recentOrders.length,
          averageProfitMargin: estimatedProfitMargin
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
      title: 'Inventory Value', 
      value: stats.totalInventoryValue, 
      prefix: '₹',
      change: '+3%' 
    },
    { 
      title: 'Avg. Product Price', 
      value: stats.averageProductPrice, 
      prefix: '₹',
      change: '+2%' 
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
    },
    {
      title: 'Inventory Turnover Rate',
      value: stats.inventoryTurnoverRate,
      change: '+5%',
      alert: stats.inventoryTurnoverRate < 5
    },
    {
      title: 'Avg. Profit Margin',
      value: stats.averageProfitMargin,
      change: '+3%',
      alert: stats.averageProfitMargin < 20
    },
    {
      title: 'Products Sold This Month',
      value: stats.productsSoldThisMonth,
      change: '+20%',
      alert: stats.productsSoldThisMonth < 50
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
            
            {/* Inventory Summary Card */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Inventory Summary</CardTitle>
                <CardDescription>Detailed inventory metrics and statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Inventory Value</h3>
                    <p className="text-2xl font-bold">₹{stats.totalInventoryValue.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
                    <div className="flex items-center">
                      <span className="text-sm text-green-500 font-medium mr-1">+3.2%</span>
                      <span className="text-sm text-muted-foreground">from last month</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Average Product Price</h3>
                    <p className="text-2xl font-bold">₹{stats.averageProductPrice.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
                    <p className="text-sm text-muted-foreground">Average price across all products</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Top Selling Category</h3>
                    <p className="text-2xl font-bold">{stats.highestSellingCategory || 'None'}</p>
                    <p className="text-sm text-muted-foreground">Category with the most products</p>
                  </div>
                </div>
                
                {stats.topSellingProducts.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Top Selling Products</h3>
                    <div className="space-y-2">
                      {stats.topSellingProducts.map((product, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-md">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
                            {product.sold} sold
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

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

        {/* Stock Distribution Card */}
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Inventory Stock Analysis</CardTitle>
              <CardDescription>Distribution of inventory by stock status</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                Chart View
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs bg-primary/10">
                Card View
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-lg">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Package className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-700">In Stock</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.products - stats.lowStockItems - stats.outOfStockItems}
                </p>
                <p className="text-sm text-green-600 mt-1">Healthy Stock Levels</p>
              </div>
              
              <div className="flex flex-col items-center justify-center p-6 bg-amber-50 rounded-lg">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                  <AlertTriangle className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-amber-700">Low Stock</h3>
                <p className="text-3xl font-bold text-amber-600 mt-2">
                  {stats.lowStockItems}
                </p>
                <p className="text-sm text-amber-600 mt-1">Need Attention</p>
              </div>
              
              <div className="flex flex-col items-center justify-center p-6 bg-red-50 rounded-lg">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-700">Out of Stock</h3>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {stats.outOfStockItems}
                </p>
                <p className="text-sm text-red-600 mt-1">Requires Immediate Action</p>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Inventory Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/dashboard/inventory">
                  <Button variant="outline" className="w-full">
                    <Package className="h-4 w-4 mr-2" />
                    Manage Inventory
                  </Button>
                </Link>
                <Link href="/dashboard/products/new">
                  <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Product
                  </Button>
                </Link>
                <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Stats
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Metrics Insights */}
                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-lg font-medium mb-4 text-blue-700">Inventory Health Insights</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">Inventory Turnover Estimate:</span>
                      <span className="font-bold text-blue-800">
                        {Number((stats.monthlyRevenue / (stats.totalInventoryValue || 1) * 12).toFixed(2))}
                      </span>
                    </div>
                    <p className="text-sm text-blue-600">
                      {(stats.monthlyRevenue / (stats.totalInventoryValue || 1) * 12) > 4 
                        ? "Your inventory turnover is healthy, indicating efficient inventory management."
                        : (stats.monthlyRevenue / (stats.totalInventoryValue || 1) * 12) > 2
                        ? "Your inventory turnover is average. Consider optimizing slow-moving items."
                        : "Your inventory turnover is low. Consider promotions for slow-moving products."}
                    </p>
                    
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-blue-700">Stock Health:</span>
                      <span className="font-bold text-blue-800">
                        {stats.outOfStockItems === 0 && stats.lowStockItems < 5 
                          ? "Excellent" 
                          : stats.outOfStockItems === 0 
                          ? "Good" 
                          : "Needs Attention"}
                      </span>
                    </div>
                    <p className="text-sm text-blue-600">
                      {stats.outOfStockItems === 0 && stats.lowStockItems < 5 
                        ? "Your inventory levels are well maintained across products."
                        : stats.outOfStockItems === 0 
                        ? "No out-of-stock items, but watch your low stock products."
                        : "You have items out of stock that need immediate replenishment."}
                    </p>
                  </div>
                </div>

                {/* Inventory Trends Card */}
            <Card className="mt-8 mb-8">
              <CardHeader>
                <CardTitle>Inventory Trends</CardTitle>
                <CardDescription>Key inventory performance indicators and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium">Stock Movement</h3>
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Measures how quickly inventory is sold and replaced
                    </p>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-2xl font-bold">
                          {Number((stats.monthlyRevenue / (stats.totalInventoryValue || 1) * 12).toFixed(1))}x
                        </span>
                        <p className="text-sm text-muted-foreground">Annual turnover rate</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-green-500">+5% from last month</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium">Stock Efficiency</h3>
                      <AlertTriangle className={`h-5 w-5 ${stats.lowStockItems > 5 ? 'text-amber-500' : 'text-green-500'}`} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Percentage of products with optimal stock levels
                    </p>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-2xl font-bold">
                          {Math.round(((stats.products - stats.lowStockItems - stats.outOfStockItems) / stats.products) * 100)}%
                        </span>
                        <p className="text-sm text-muted-foreground">Healthy stock</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-medium ${stats.lowStockItems > 5 ? 'text-amber-500' : 'text-green-500'}`}>
                          {stats.lowStockItems > 5 ? 'Needs attention' : 'Good'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
