"use client";

import React, { useState, useEffect } from 'react';
import { databases } from '@/lib/appwrite';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Search, ChevronDown, ChevronUp } from 'lucide-react';

interface ContactQuery {
  $id: string;
  email: string;
  fullname: string;
  message: string;
  createdAt: string;
}

const ITEMS_PER_PAGE = 30;

const ContactQueriesPage = () => {
  const [queries, setQueries] = useState<ContactQuery[]>([]);
  const [filteredQueries, setFilteredQueries] = useState<ContactQuery[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchQueries();
  }, []);

  useEffect(() => {
    const filtered = queries.filter(query =>
      query.email.toLowerCase().includes(search.toLowerCase()) ||
      query.fullname.toLowerCase().includes(search.toLowerCase()) ||
      query.message.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredQueries(filtered);
    setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE));
    setCurrentPage(1);
  }, [search, queries]);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        '68287c8b0025dba5763e'
      );      const mappedQueries = response.documents.map((doc) => ({
        $id: doc.$id,
        email: doc.email || '',
        fullname: doc.fullname || '',
        message: doc.message || '',
        createdAt: doc.$createdAt || '',
      }));
      
      // Sort queries by createdAt date in descending order (newest first)
      const sortedQueries = [...mappedQueries].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setQueries(sortedQueries);
      setFilteredQueries(sortedQueries);
      setTotalPages(Math.ceil(mappedQueries.length / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching contact queries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredQueries.slice(startIndex, endIndex);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleMessage = (id: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const MessageCell = ({ message, id }: { message: string; id: string }) => {
    const isExpanded = expandedMessages.has(id);
    const messageLines = message.split('\n');
    const hasMoreThanTwoLines = messageLines.length > 2;

    return (
      <div className="space-y-2">
        <div className={`${!isExpanded ? 'line-clamp-2' : ''} whitespace-pre-wrap`}>
          {message}
        </div>
        {hasMoreThanTwoLines && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => toggleMessage(id)}
          >
            {isExpanded ? (
              <>
                Show less <ChevronUp className="ml-1 h-3 w-3" />
              </>
            ) : (
              <>
                Show more <ChevronDown className="ml-1 h-3 w-3" />
              </>
            )}
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Contact Queries</h1>
        <Button onClick={fetchQueries} variant="outline">
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, or message"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-8 w-48" />
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
          ) : filteredQueries.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No contact queries found.
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Email</TableHead>
                      <TableHead className="w-[200px]">Full Name</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead className="w-[180px] text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getCurrentPageData().map((query) => (
                      <TableRow key={query.$id}>
                        <TableCell className="font-medium">{query.email}</TableCell>
                        <TableCell>{query.fullname}</TableCell>
                        <TableCell className="max-w-[400px]">
                          <MessageCell message={query.message} id={query.$id} />
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">{formatDate(query.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredQueries.length)} of {filteredQueries.length} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactQueriesPage;
