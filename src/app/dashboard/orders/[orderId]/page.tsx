'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { OrderType } from '@/types/order';
import { orderService } from '@/services/orderService';
import { ArrowLeft } from 'lucide-react';


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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 bg-dark-100">
        <div className="relative inline-flex">
          <div className="w-12 h-12 bg-primary rounded-full opacity-75 animate-ping"></div>
          <div className="w-12 h-12 bg-primary rounded-full absolute inset-0 animate-pulse"></div>
        </div>
        <div className="text-xl font-semibold text-primary animate-pulse">
          Loading Order Details...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-dark-100 p-8 flex items-center justify-center">
        <div className="text-light-100/70 text-xl">Order not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-100 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-light-100 hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Orders</span>
        </button>

        {/* Header */}
        <div className="bg-dark-200 rounded-lg shadow-lg border border-dark-300 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-light-100">Order Details</h1>
              <p className="text-light-100/50">Order #{order.$id}</p>
            </div>
            <div className="text-right">
              <p className="text-light-100">Created: {new Date(order.created_at).toLocaleString()}</p>
              <p className="text-primary font-semibold">Total: ₹{order.total_price}</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Customer Information */}
          <div className="bg-dark-200 rounded-lg shadow-lg border border-dark-300 p-6">
            <h2 className="text-xl font-semibold text-light-100 mb-4">Customer Information</h2>
            <div className="space-y-3">
              <InfoRow label="Name" value={`${order.first_name} ${order.last_name}`} />
              <InfoRow label="Email" value={order.email} />
              <InfoRow label="Phone" value={order.phone_number} />
              <InfoRow label="User ID" value={order.user_id} />
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-dark-200 rounded-lg shadow-lg border border-dark-300 p-6">
            <h2 className="text-xl font-semibold text-light-100 mb-4">Shipping Information</h2>
            <div className="space-y-3">
              <InfoRow label="Address" value={order.address} />
              <InfoRow label="City" value={order.city} />
              <InfoRow label="State" value={order.state} />
              <InfoRow label="Country" value={order.country} />
              <InfoRow label="Pincode" value={order.pincode?.toString()} />
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-dark-200 rounded-lg shadow-lg border border-dark-300 p-6">
            <h2 className="text-xl font-semibold text-light-100 mb-4">Payment Information</h2>
            <div className="space-y-3">
              <InfoRow label="Payment Type" value={order.payment_type} />
              <InfoRow label="Payment Status" value={order.payment_status} />
              <InfoRow label="Payment Amount" value={`₹${order.payment_amount}`} />
              <InfoRow label="Razorpay Order ID" value={order.razorpay_order_id} />
              <InfoRow label="Razorpay Payment ID" value={order.razorpay_payment_id} />
              <InfoRow label="Razorpay Signature" value={order.razorpay_signature} />
              <InfoRow label="Coupon Code" value={order.coupon_code || 'Not applied'} />
            </div>
          </div>

          {/* Refund Information */}
          <div className="bg-dark-200 rounded-lg shadow-lg border border-dark-300 p-6">
            <h2 className="text-xl font-semibold text-light-100 mb-4">Refund Information</h2>
            <div className="space-y-3">
              <InfoRow label="Refund Status" value={order.refund_status || 'No refund'} />
              <InfoRow label="Refund ID" value={order.refund_id} />
              <InfoRow label="Refund Amount" value={order.refund_amount ? `₹${order.refund_amount}` : '-'} />
              <InfoRow label="Refund Due" value={order.refund_due || '-'} />
              <InfoRow label="Cancellation Fee" value={order.cancellation_fee ? `₹${order.cancellation_fee}` : '-'} />
            </div>
          </div>

          {/* Shipping Status Section */}
          <div className="bg-dark-200 rounded-lg shadow-lg border border-dark-300 p-6 md:col-span-2">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Current Status Display */}
              <div>
                <h2 className="text-xl font-semibold text-light-100 mb-4">Current Shipping Status</h2>
                <div className="mb-4">
                  <span className={`inline-block px-4 py-2 rounded-full font-semibold ${
                    order.shipping_status === 'delivered' ? 'bg-green-500 text-white' :
                    order.shipping_status === 'cancelled' ? 'bg-red-500 text-white' :
                    order.shipping_status === 'shipped' ? 'bg-blue-500 text-white' :
                    'bg-yellow-500 text-black'
                  }`}>
                    {order.shipping_status?.toUpperCase() || 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Status Change Controls */}
              <div>
                <h2 className="text-xl font-semibold text-light-100 mb-4">Update Status</h2>
                <select
                  value={order.shipping_status || 'pending'}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={saving}
                  className="w-full px-4 py-2 text-light-100 bg-dark-100 border border-dark-300 
                    rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50
                    disabled:cursor-not-allowed transition-colors"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status} className="bg-dark-100">
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for consistent info row styling
function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;

  // Special styling for admin user ID
  if (label === "User ID" && value === "admin") {
    return (
      <div className="flex flex-col sm:flex-row sm:justify-between">
        <span className="text-light-100/50">{label}:</span>
        <span className="bg-yellow-400 text-black px-3 py-1 rounded-full font-medium">{value}</span>
      </div>
    );
  }

  // Special handling for address
  if (label === "Address") {
    return (
      <div className="flex flex-col space-y-1">
        <span className="text-light-100/50">{label}:</span>
        <span className="text-light-100 break-words whitespace-pre-wrap">{value}</span>
      </div>
    );
  }

  // Handle other long text (like Razorpay IDs) with truncation
  const isLongText = value.length > 30 && !["Address", "User ID"].includes(label);
  
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between">
      <span className="text-light-100/50">{label}:</span>
      <span 
        className={`text-light-100 ${isLongText ? 'truncate max-w-[200px]' : ''}`} 
        title={isLongText ? value : ''}
      >
        {value}
      </span>
    </div>
  );
}
