import { Models } from 'appwrite';

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  weight: number[];
  price: number;
}

export interface OrderType extends Models.Document {
  address: string;
  status: string;
  user_id: string;
  email: string;
  state: string;
  city: string;
  country: string;
  phone_number: string;
  payment_type: string;
  payment_status: string;
  shipping_status: string;
  payment_amount: number;
  total_price: number;
  pincode: number;
  first_name: string;
  last_name: string;
  order_items: number; // This is the only field we need for order items (total quantity)
  order_variants?: string; // JSON string mapping product IDs to their selected variant IDs
  coupon_code?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  shiprocket_order_id?: string;
  shiprocket_shipment_id?: string;
  tracking_id?: string;
  refund_id?: string;
  refund_status?: string;
  refund_due?: string;
  cancellation_fee?: number;
  refund_amount?: number;
  label_url?: string;
  manifest_url?: string;
  idempotency_key: string;
  created_at: string;
  weights: number[];  // Add this line to include weights array
}