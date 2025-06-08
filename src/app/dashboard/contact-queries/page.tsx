"use client";

import React, { useState, useEffect } from 'react';
import { databases } from '@/lib/appwrite';
import { Table, TableHead, TableRow, TableCell, TableBody } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface ContactQuery {
  $id: string;
  email: string;
  fullname: string;
  message: string;
}

const ContactQueriesPage = () => {
  const [queries, setQueries] = useState<ContactQuery[]>([]);
  const [filteredQueries, setFilteredQueries] = useState<ContactQuery[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueries();
  }, []);

  useEffect(() => {
    const filtered = queries.filter(query =>
      query.email.includes(search) ||
      query.fullname.includes(search) ||
      query.message.includes(search)
    );
    setFilteredQueries(filtered);
  }, [search, queries]);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        '68287c8b0025dba5763e'
      );

      const mappedQueries = response.documents.map((doc) => ({
        $id: doc.$id,
        email: doc.email || '',
        fullname: doc.fullname || '',
        message: doc.message || '',
      }));

      setQueries(mappedQueries);
      setFilteredQueries(mappedQueries);
    } catch (error) {
      console.error('Error fetching contact queries:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Contact Queries</h1>

      <div className="mb-4">
        <Input
          placeholder="Search by email, fullname, or message"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <Skeleton className="h-10 w-full mb-4" />
      ) : filteredQueries.length === 0 ? (
        <div className="text-center text-muted-foreground">No contact queries found.</div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Fullname</TableCell>
              <TableCell>Message</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredQueries.map((query) => (
              <TableRow key={query.$id}>
                <TableCell>{query.email}</TableCell>
                <TableCell>{query.fullname}</TableCell>
                <TableCell>{query.message}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Button onClick={fetchQueries} className="mt-4">Refresh</Button>
    </div>
  );
};

export default ContactQueriesPage;
