'use client';

import { useState, useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';
import { Search, SortDesc } from 'lucide-react';

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  searchKey: string;
  loading?: boolean;
  showAdminFilter?: boolean;
}

export function DataTable<TData extends Record<string, any>>({
  columns,
  data,
  searchKey,
  loading = false,
  showAdminFilter = false,
}: DataTableProps<TData>) {
  const [filtering, setFiltering] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortByDate, setSortByDate] = useState(false);
  const [showAdminOrders, setShowAdminOrders] = useState(false);

  // Memoize the filtered and sorted data
  const processedData = useMemo(() => {
    let result = [...data];
    
    result = result.filter(row => {
      let matches = true;
      
      if (filtering) {
        const searchTerm = filtering.toLowerCase();
        const fullName = `${row.first_name || ''} ${row.last_name || ''}`.toLowerCase();
        
        // Check full name first
        const nameMatch = fullName.includes(searchTerm);
        
        // Then check other fields
        const otherFieldsMatch = searchKey.split(',').some(field => {
          const fieldName = field.trim();
          if (fieldName === 'first_name' || fieldName === 'last_name') {
            return false; // Skip individual name fields as we already checked full name
          }
          return row[fieldName]?.toString().toLowerCase().includes(searchTerm);
        });

        matches = matches && (nameMatch || otherFieldsMatch);
      }
      
      if (statusFilter) {
        matches = matches && row.status === statusFilter;
      }
      
      if (showAdminOrders) {
        matches = matches && row.user_id === 'admin';
      }
      
      return matches;
    });

    // Apply sorting
    if (sortByDate) {
      result.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return result;
  }, [data, filtering, statusFilter, showAdminOrders, sortByDate, searchKey]);

  const table = useReactTable({
    data: processedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 bg-dark-100 rounded-lg">
        <div className="relative inline-flex">
          <div className="w-12 h-12 bg-primary rounded-full opacity-75 animate-ping"></div>
          <div className="w-12 h-12 bg-primary rounded-full absolute inset-0 animate-pulse"></div>
        </div>
        <div className="text-xl font-semibold text-primary animate-pulse">
          Loading Orders...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-100 p-6 rounded-lg shadow-md">
      <div className="flex flex-wrap items-center gap-4 py-4 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-100/50 h-4 w-4" />
          <input
            placeholder={`Search ${searchKey}...`}
            value={filtering}
            onChange={(event) => setFiltering(event.target.value)}
            className="pl-10 w-full px-4 py-2 rounded-md border border-dark-200 
              focus:outline-none focus:ring-2 focus:ring-primary bg-dark-200 text-light-100 
              placeholder:text-light-100/50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-md border border-dark-200 bg-dark-200 text-light-100"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <button
          onClick={() => setSortByDate(!sortByDate)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md border border-dark-200 
            ${sortByDate ? 'bg-primary text-light-100' : 'bg-dark-200 text-light-100'}`}
        >
          <SortDesc className="h-4 w-4" />
          Sort by Date
        </button>

        {showAdminFilter && (
          <label className="flex items-center gap-2 text-light-100">
            <input
              type="checkbox"
              checked={showAdminOrders}
              onChange={(e) => setShowAdminOrders(e.target.checked)}
              className="w-4 h-4 rounded border-dark-200 accent-green-600 "
            />
            Manual Orders
          </label>
        )}
      </div>
      <div className="rounded-lg border border-dark-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-light-100">
            <thead className="text-xs uppercase bg-dark-200 text-light-100/70">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-6 py-3 font-semibold">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-dark-200">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-dark-200 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 text-light-100/90">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td 
                    colSpan={columns.length} 
                    className="text-center px-6 py-8 text-light-100/50"
                  >
                    No results found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4 mt-4">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-4 py-2 text-sm font-medium text-light-100 bg-dark-200 border border-dark-300 
            rounded-md hover:bg-dark-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-4 py-2 text-sm font-medium text-light-100 bg-primary 
            rounded-md hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
