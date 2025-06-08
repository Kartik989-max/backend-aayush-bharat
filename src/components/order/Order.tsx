'use client';

import { DataTable } from '../ui/data-table';
import { columns } from './columns';
import { OrderType } from '@/types/order';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface OrderProps {
  orders: OrderType[];
  loading?: boolean;
}

export function Order({ orders, loading = false }: OrderProps) {
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
            <DataTable<OrderType> 
              columns={columns} 
              data={orders} 
              searchKey="first_name,email,phone_number" 
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}