'use client';

import { Order } from '@/components/order/Order';
import { orderService } from '@/services/orderService';
import { OrderType } from '@/types/order';
import { useEffect, useState } from 'react';
import { Shimmer } from '@/components/ui/shimmer';

export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderType[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full">
      {loading ? (
        <div className="space-y-6 w-full">
          <div className="flex justify-between items-center">
            <Shimmer type="text" className="w-48" />
            <div className="flex gap-4">
              <Shimmer type="button" />
              <Shimmer type="button" />
            </div>
          </div>
          <Shimmer type="table" count={5} />
        </div>
      ) : (
        <Order orders={orders} loading={loading} />
      )}
    </div>
  );
}
