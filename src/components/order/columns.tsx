import { ColumnDef } from '@tanstack/react-table';
import { OrderType } from '@/types/order';
import { Edit } from 'lucide-react';
import Link from 'next/link';

export const columns: ColumnDef<OrderType>[] = [
  {
    accessorKey: 'first_name',
    header: 'Name',
    cell: ({ row }) => `${row.original.first_name} ${row.original.last_name}`,
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'total_price',
    header: 'Total',
    cell: ({ row }) => `₹${row.original.total_price}`,
  },
  {
    accessorKey: 'payment_status',
    header: 'Payment',
    cell: ({ row }) => (
      <span className={`px-2 py-1 rounded-full text-xs ${
        row.original.payment_status === 'paid' ? 'bg-green-900/30 text-green-400' :
        row.original.payment_status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
        row.original.payment_status === 'failed' ? 'bg-red-900/30 text-red-400' :
        'bg-blue-900/30 text-blue-400'
      }`}>
        {row.original.payment_status}
      </span>
    )
  },
  {
    accessorKey: 'shipping_status',
    header: 'Shipping',
    cell: ({ row }) => (
      <span className={`px-2 py-1 rounded-full text-xs ${
        row.original.shipping_status === 'delivered' ? 'bg-green-900/30 text-green-400' :
        row.original.shipping_status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
        row.original.shipping_status === 'cancelled' ? 'bg-red-900/30 text-red-400' :
        'bg-blue-900/30 text-blue-400'
      }`}>
        {row.original.shipping_status || 'pending'}
      </span>
    )
  },
  {
    accessorKey: 'created_at',
    header: 'Date',
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
  },
  {
    accessorKey: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/orders/${row.original.$id}`}
          className="p-2 text-primary hover:text-primary/80 rounded-full 
            hover:bg-dark-200 transition-colors"
        >
          <Edit className="h-4 w-4" />
        </Link>
      </div>
    )
  }
];