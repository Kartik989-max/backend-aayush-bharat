'use client';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import CountUp from 'react-countup';
import { listDocuments } from '@/lib/appwrite';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, LogOut } from 'lucide-react';
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
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
  
  });
  
  
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const products = await listDocuments(process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_COLLECTION_ID!);
        const categories = await listDocuments(process.env.NEXT_PUBLIC_APPWRITE_CATEGORY_COLLECTION_ID!);
        

        setStats({
          products: products.documents.length,
          categories: categories.documents.length,
          
        });
      
      } catch (error) {
        console.error('Error fetching stats:', error);
        
      }
    };

    fetchStats();
  }, []);

  if (!currentUser) {
    return null;
  }

  const displayStats = [
    { title: 'Total Products', value: stats.products, change: '+12%' },
    { title: 'Total Categories', value: stats.categories, change: '+8%' },
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
    <div>
      <nav className="bg-dark-100 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-light-100">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={logout}
                className="text-light-100 hover:text-primary flex items-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-primary">Dashboard Overview</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {displayStats.map((stat, index) => (
            <div key={index} className="bg-dark-100 p-6 rounded-lg transform transition-all duration-300 hover:scale-105">
              <h3 className="text-gray-400 mb-2">{stat.title}</h3>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {/* {stat.prefix && stat.prefix} */}
                  <CountUp
                    end={stat.value}
                    duration={2}
                    separator=","
                    useEasing={true}
                    decimals={stat.title === 'Total Revenue' ? 2 : 0}
                  />
                </span>
                <span className={`${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* <div className="bg-dark-100 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-4 text-light-100">Monthly Revenue</h2>
          <div className="h-[400px]">
            <Line 
              data={monthlyOrdersData}
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
                      callback: (value) => `₹${value}`
                    }
                  },
                  x: {
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                },
                plugins: {
                  legend: {
                    position: 'top',
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
        </div> */}
      </div>
    </div>
  );
};

export default Dashboard;
