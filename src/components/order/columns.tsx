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
    cell: ({ row }) => {
      const id = row.getValue('$id') as string;
      return (
        <div className="font-mono text-xs">
          {id.substring(0, 8)}...
        </div>
      );
    },
  },
  {
    accessorKey: '$createdAt',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="hover:bg-transparent p-0 h-auto text-xs"
        >
          Date
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('$createdAt') as string);
      return (
        <div className="text-xs">
          {date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: '2-digit',
          })}
        </div>
      );
    },
  },
  {
    accessorKey: 'first_name',
    header: 'Name',
    cell: ({ row }) => {
      const firstName = row.getValue('first_name') as string;
      const lastName = row.original.last_name || '';
      return (
        <div className="text-xs font-medium">
          {firstName} {lastName}
        </div>
      );
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => {
      const email = row.getValue('email') as string;
      return (
        <div className="text-xs text-muted-foreground max-w-[150px] truncate">
          {email}
        </div>
      );
    },
  },
  {
    accessorKey: 'phone_number',
    header: 'Phone',
    cell: ({ row }) => {
      const phone = row.getValue('phone_number') as string;
      return (
        <div className="text-xs font-mono">
          {phone}
        </div>
      );
    },
  },
  {
    accessorKey: 'payment_status',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="hover:bg-transparent p-0 h-auto text-xs"
        >
          Payment
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue('payment_status') as string;
      return (
        <Badge 
          variant={status === 'paid' ? 'default' : 'destructive'}
          className="text-xs px-2 py-0.5"
        >
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
          className="hover:bg-transparent p-0 h-auto text-xs"
        >
          Shipping
          <ArrowUpDown className="ml-1 h-3 w-3" />
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
          className="text-xs px-2 py-0.5"
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
        <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
          <Link href={`/dashboard/orders/${order.$id}`}>
            <Eye className="h-3 w-3" />
          </Link>
        </Button>
      );
    },
  },
];