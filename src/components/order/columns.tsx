'use client';

import { ColumnDef } from '@tanstack/react-table';
import { OrderType } from '@/types/order';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ArrowUpDown, Eye } from 'lucide-react';
import Link from 'next/link';

export const columns: ColumnDef<OrderType>[] = [
  {
    accessorKey: '$id',
    header: 'Order ID',
  },
  {
    accessorKey: 'first_name',
    header: 'First Name',
  },
  {
    accessorKey: 'last_name',
    header: 'Last Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'phone_number',
    header: 'Phone',
  },
  {
    accessorKey: 'payment_status',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="hover:bg-transparent"
        >
          Payment Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue('payment_status') as string;
      return (
        <Badge variant={status === 'paid' ? 'default' : 'destructive'}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'shipping_status',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="hover:bg-transparent"
        >
          Shipping Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue('shipping_status') as string;
      return (
        <Badge 
          variant={
            status === 'delivered' ? 'default' :
            status === 'cancelled' ? 'destructive' :
            status === 'shipped' ? 'secondary' : 'outline'
          }
        >
          {status}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const order = row.original;
      return (
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/orders/${order.$id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      );
    },
  },
];