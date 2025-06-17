'use client';

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Search, SortDesc } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Shimmer } from "@/components/ui/shimmer";

interface DataTableProps<TData extends Record<string, any>> {
  columns: any[];
  data: TData[];
  searchKey: string;
  loading?: boolean;
}

export function DataTable<TData extends Record<string, any>>({
  columns,
  data,
  searchKey,
  loading = false,
}: DataTableProps<TData>) {  const [filtering, setFiltering] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortByDate, setSortByDate] = useState(true);

  const processedData = useMemo(() => {
    let result = [...data];
    
    result = result.filter(row => {
      let matches = true;
      
      if (filtering) {
        const searchTerm = filtering.toLowerCase();
        const fullName = `${row.first_name || ''} ${row.last_name || ''}`.toLowerCase();
        
        const nameMatch = fullName.includes(searchTerm);
        
        const otherFieldsMatch = searchKey.split(',').some(field => {
          const fieldName = field.trim();
          if (fieldName === 'first_name' || fieldName === 'last_name') {
            return false;
          }
          return row[fieldName]?.toString().toLowerCase().includes(searchTerm);
        });

        matches = matches && (nameMatch || otherFieldsMatch);
      }
      
      if (statusFilter && statusFilter !== 'all') {
        matches = matches && row.status === statusFilter;
      }
      
      return matches;
    });

    if (sortByDate) {
      result.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return result;
  }, [data, filtering, statusFilter, sortByDate, searchKey]);

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
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <Shimmer type="text" className="w-64" />
          <Shimmer type="button" />
          <Shimmer type="button" />
        </div>
        <Shimmer type="table" count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={`Search ${searchKey}...`}
            value={filtering}
            onChange={(event) => setFiltering(event.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={sortByDate ? "default" : "outline"}
          onClick={() => setSortByDate(!sortByDate)}
          className="flex items-center gap-2"
        >
          <SortDesc className="h-4 w-4" />
          Sort by Date
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
