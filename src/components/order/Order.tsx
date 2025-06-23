'use client';

import { PaginatedDataTable } from '../ui/paginated-data-table';
import { columns } from './columns';
import { OrderType } from '@/types/order';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface OrderProps {
  orders: OrderType[];
  loading?: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPaginationChange: (page: number, limit: number) => void;
  onSearchChange: (search: string) => void;
  onStatusFilterChange: (status: string) => void;
  onSortChange: (sortByLatest: boolean) => void;
  searchValue: string;
  statusValue: string;
  sortByLatest: boolean;
}

export function Order({ 
  orders, 
  loading = false,
  pagination,
  onPaginationChange,
  onSearchChange,
  onStatusFilterChange,
  onSortChange,
  searchValue,
  statusValue,
  sortByLatest,
}: OrderProps) {
  return (
    <div className="w-full h-full">
      <div className="flex-1 space-y-4 w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Orders</h2>
        </div>
        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-semibold text-primary">Order List</CardTitle>
          </CardHeader>
          <CardContent>
            <PaginatedDataTable<OrderType> 
              columns={columns} 
              data={orders} 
              loading={loading}
              pagination={pagination}
              onPaginationChange={onPaginationChange}
              onSearchChange={onSearchChange}
              onStatusFilterChange={onStatusFilterChange}
              onSortChange={onSortChange}
              searchValue={searchValue}
              statusValue={statusValue}
              sortByLatest={sortByLatest}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}