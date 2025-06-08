'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { OrderType } from '@/types/order';
import { orderService } from '@/services/orderService';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shimmer } from "@/components/ui/shimmer";

const statusOptions = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
];

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrderById(orderId as string);
      setOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;
    
    try {
      setSaving(true);
      await orderService.updateOrderShippingStatus(order.$id, newStatus);
      await loadOrder();
    } catch (error) {
      console.error('Error updating shipping status:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Shimmer type="button" className="w-32" />
          <Shimmer type="card" count={2} />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-muted-foreground text-xl">Order not found</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:text-primary/80"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Orders</span>
        </Button>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold">Order Details</CardTitle>
                <p className="text-muted-foreground">Order #{order.$id}</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground">Created: {new Date(order.created_at).toLocaleString()}</p>
                <p className="text-primary font-semibold">Total: ₹{order.total_price}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Name" value={`${order.first_name} ${order.last_name}`} />
              <InfoRow label="Email" value={order.email} />
              <InfoRow label="Phone" value={order.phone_number} />
              <InfoRow label="User ID" value={order.user_id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Address" value={order.address} />
              <InfoRow label="City" value={order.city} />
              <InfoRow label="State" value={order.state} />
              <InfoRow label="Country" value={order.country} />
              <InfoRow label="Pincode" value={order.pincode?.toString()} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Payment Type" value={order.payment_type} />
              <InfoRow label="Payment Status" value={order.payment_status} />
              <InfoRow label="Payment Amount" value={`₹${order.payment_amount}`} />
              <InfoRow label="Razorpay Order ID" value={order.razorpay_order_id} />
              <InfoRow label="Razorpay Payment ID" value={order.razorpay_payment_id} />
              <InfoRow label="Razorpay Signature" value={order.razorpay_signature} />
              <InfoRow label="Coupon Code" value={order.coupon_code || 'Not applied'} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Refund Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Refund Status" value={order.refund_status || 'No refund'} />
              <InfoRow label="Refund ID" value={order.refund_id} />
              <InfoRow label="Refund Amount" value={order.refund_amount ? `₹${order.refund_amount}` : '-'} />
              <InfoRow label="Refund Due" value={order.refund_due || '-'} />
              <InfoRow label="Cancellation Fee" value={order.cancellation_fee ? `₹${order.cancellation_fee}` : '-'} />
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Shipping Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Current Status</h3>
                  <Badge variant={
                    order.shipping_status === 'delivered' ? 'default' :
                    order.shipping_status === 'cancelled' ? 'destructive' :
                    order.shipping_status === 'shipped' ? 'secondary' :
                    'outline'
                  }>
                    {order.shipping_status?.toUpperCase() || 'PENDING'}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Update Status</h3>
                  <Select
                    value={order.shipping_status || 'pending'}
                    onValueChange={handleStatusChange}
                    disabled={saving}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;

  if (label === "User ID" && value === "admin") {
    return (
      <div className="flex flex-col sm:flex-row sm:justify-between">
        <span className="text-muted-foreground">{label}:</span>
        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500">
          {value}
        </Badge>
      </div>
    );
  }

  if (label === "Address") {
    return (
      <div className="flex flex-col space-y-1">
        <span className="text-muted-foreground">{label}:</span>
        <span className="break-words whitespace-pre-wrap">{value}</span>
      </div>
    );
  }

  const isLongText = value.length > 30 && !["Address", "User ID"].includes(label);
  
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between">
      <span className="text-muted-foreground">{label}:</span>
      <span 
        className={`${isLongText ? 'truncate max-w-[200px]' : ''}`} 
        title={isLongText ? value : ''}
      >
        {value}
      </span>
    </div>
  );
}
