'use client';

import { Order } from '@/components/order/Order';
import { orderService, PaginatedOrdersResponse } from '@/services/orderService';
import { OrderType } from '@/types/order';
import { useEffect, useState, useCallback } from 'react';
import { Shimmer } from '@/components/ui/shimmer';

export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortByLatest, setSortByLatest] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response: PaginatedOrdersResponse = await orderService.getOrdersPaginated(
        pagination.page,
        pagination.limit,
        search,
        statusFilter,
        sortByLatest
      );
      
      setOrders(response.orders);
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
      });
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, sortByLatest]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handlePaginationChange = (page: number, limit: number) => {
    setPagination(prev => ({ ...prev, page, limit }));
  };

  const handleSearchChange = (searchValue: string) => {
    setSearch(searchValue);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on search
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter
  };

  const handleSortChange = (latest: boolean) => {
    setSortByLatest(latest);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on sort change
  };

  return (
    <div className="h-full w-full">
      {loading && pagination.page === 1 ? (
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
        <Order 
          orders={orders} 
          loading={loading}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          onSearchChange={handleSearchChange}
          onStatusFilterChange={handleStatusFilterChange}
          onSortChange={handleSortChange}
          searchValue={search}
          statusValue={statusFilter}
          sortByLatest={sortByLatest}
        />
      )}
    </div>
  );
}
