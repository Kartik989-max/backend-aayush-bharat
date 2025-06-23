'use client';

import { useState, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { Search, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Shimmer } from "@/components/ui/shimmer";

interface PaginatedDataTableProps<TData extends Record<string, any>> {
  columns: ColumnDef<TData>[];
  data: TData[];
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

export function PaginatedDataTable<TData extends Record<string, any>>({
  columns,
  data,
  loading = false,
  pagination,
  onPaginationChange,
  onSearchChange,
  onStatusFilterChange,
  onSortChange,
  searchValue,
  statusValue,
  sortByLatest,
}: PaginatedDataTableProps<TData>) {
  const [searchInput, setSearchInput] = useState(searchValue);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, onSearchChange]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination.totalPages,
  });

  const handlePageSizeChange = (newLimit: string) => {
    onPaginationChange(1, parseInt(newLimit));
  };

  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      onPaginationChange(pagination.page - 1, pagination.limit);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      onPaginationChange(pagination.page + 1, pagination.limit);
    }
  };

  const handleLatestSort = () => {
    onSortChange(!sortByLatest);
    // Reset to first page when sorting changes
    onPaginationChange(1, pagination.limit);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Shimmer type="text" className="w-64" />
          <Shimmer type="button" />
          <Shimmer type="button" />
          <Shimmer type="button" />
        </div>
        <Shimmer type="table" count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search orders..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="pl-10 h-9"
          />
        </div>

        <Select
          value={statusValue}
          onValueChange={onStatusFilterChange}
        >
          <SelectTrigger className="w-[160px] h-9">
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
          variant={sortByLatest ? "default" : "outline"}
          onClick={handleLatestSort}
          className="flex items-center gap-2 h-9 px-3"
          size="sm"
        >
          <Clock className="h-4 w-4" />
          {sortByLatest ? 'Latest' : 'Oldest'}
        </Button>

        <Select
          value={pagination.limit.toString()}
          onValueChange={handlePageSizeChange}
        >
          <SelectTrigger className="w-[80px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="h-10">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-3 py-2 text-xs font-medium">
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
                  className="h-12"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-2 text-sm">
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
                  className="h-20 text-center text-sm text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
          {pagination.total} results
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={pagination.page <= 1}
            className="flex items-center gap-1 h-8 px-3 text-xs"
          >
            <ChevronLeft className="h-3 w-3" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-1">
            <span className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={pagination.page >= pagination.totalPages}
            className="flex items-center gap-1 h-8 px-3 text-xs"
          >
            Next
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
} 