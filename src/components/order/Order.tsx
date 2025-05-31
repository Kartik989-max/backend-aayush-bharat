'use client';

import { DataTable } from '../ui/data-table';
import { columns } from './columns';
import { OrderType } from '@/types/order';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import { CreateOrderDialog } from './CreateOrderDialog';
import { useState } from 'react';

interface OrderProps {
  orders: OrderType[];
  loading?: boolean;
}

export function Order({ orders, loading = false }: OrderProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-0 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          <Button  className='flex text-black shadow-lg border-2' onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Order
          </Button>
        </div>
        <DataTable<OrderType> 
          columns={columns} 
          data={orders} 
          searchKey="first_name,last_name,email,phone_number" 
          loading={loading}
          showAdminFilter={true}
        />
        <CreateOrderDialog 
          open={showCreateDialog} 
          onClose={() => setShowCreateDialog(false)} 
        />
      </div>
    </div>
  );
}