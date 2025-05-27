'use client';

import { Order } from '@/components/order/Order';
import { orderService } from '@/services/orderService';
import { OrderType } from '@/types/order';
import { useEffect, useState } from 'react';

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
    <div className="p-0">
      <Order orders={orders} loading={loading} />
    </div>
  );
}
