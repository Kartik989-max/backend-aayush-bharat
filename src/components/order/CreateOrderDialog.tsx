'use client';

import { Dialog } from '../ui/dialog';
import { useState } from 'react';
import { ProductSelection } from './ProductSelection';
import { OrderAddressForm } from './OrderAddressForm';
import { OrderType } from '@/types/order';
import { orderService } from '@/services/orderService';
import { useRouter } from 'next/navigation';

interface CreateOrderDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateOrderDialog({ open, onClose }: CreateOrderDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState<'products' | 'address'>('products');
  const [selectedProducts, setSelectedProducts] = useState<Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    weight: number[];
    price: number;
  }>>([]);
  const [loading, setLoading] = useState(false);

  const handleProductsSubmit = (products: typeof selectedProducts) => {
    setSelectedProducts(products);
    setStep('address');
  };

  const handleAddressSubmit = async (addressData: Partial<OrderType>) => {
    try {
      setLoading(true);
      const total_price = selectedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const weights = selectedProducts.flatMap(item => item.weight);
      
      const orderData: Partial<OrderType> = {
        ...addressData,
        order_items: selectedProducts.reduce((sum, item) => sum + item.quantity, 0), // Just store total quantity
        total_price,
        payment_amount: total_price,
        weights,
        status: 'pending',
        payment_status: 'pending',
        shipping_status: 'pending',
        payment_type: 'cod',
        user_id: 'admin',
        idempotency_key: Date.now().toString(),
        created_at: new Date().toISOString(),
      };

      await orderService.createOrder(orderData);
      router.refresh();
      onClose();
      setStep('products');
      setSelectedProducts([]);
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Create New Order">
      {step === 'products' ? (
        <ProductSelection 
          onSubmit={handleProductsSubmit}
          initialProducts={selectedProducts}
        />
      ) : (
        <OrderAddressForm 
          onSubmit={handleAddressSubmit}
          loading={loading}
          onBack={() => setStep('products')}
        />
      )}
    </Dialog>
  );
}