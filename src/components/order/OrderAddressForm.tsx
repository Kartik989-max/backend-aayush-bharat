'use client';

import { OrderType } from '@/types/order';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useState } from 'react';

interface OrderAddressFormProps {
  onSubmit: (data: Partial<OrderType>) => void;
  onBack: () => void;
  loading?: boolean;
}

export function OrderAddressForm({ onSubmit, onBack, loading }: OrderAddressFormProps) {
  const [formData, setFormData] = useState<Partial<OrderType>>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'pincode' ? parseInt(value) : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm text-light-100/70">First Name</label>
          <Input
            name="first_name"
            required
            value={formData.first_name}
            onChange={handleChange}
            className="bg-dark-200 border-dark-400 text-light-100"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-light-100/70">Last Name</label>
          <Input
            name="last_name"
            required
            value={formData.last_name}
            onChange={handleChange}
            className="bg-dark-200 border-dark-400 text-light-100"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm text-light-100/70">Email</label>
        <Input
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          className="bg-dark-200 border-dark-400 text-light-100"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm text-light-100/70">Phone Number</label>
        <Input
          name="phone_number"
          required
          value={formData.phone_number}
          onChange={handleChange}
          className="bg-dark-200 border-dark-400 text-light-100"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm text-light-100/70">Address</label>
        <Input
          name="address"
          required
          value={formData.address}
          onChange={handleChange}
          className="bg-dark-200 border-dark-400 text-light-100"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm text-light-100/70">City</label>
          <Input
            name="city"
            required
            value={formData.city}
            onChange={handleChange}
            className="bg-dark-200 border-dark-400 text-light-100"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-light-100/70">State</label>
          <Input
            name="state"
            required
            value={formData.state}
            onChange={handleChange}
            className="bg-dark-200 border-dark-400 text-light-100"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm text-light-100/70">Country</label>
          <Input
            name="country"
            required
            value={formData.country}
            onChange={handleChange}
            className="bg-dark-200 border-dark-400 text-light-100"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-light-100/70">Pincode</label>
          <Input
            name="pincode"
            type="number"
            required
            value={formData.pincode || ''}
            onChange={handleChange}
            className="bg-dark-200 border-dark-400 text-light-100"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
          className="text-black border-dark-400 hover:bg-dark-300"
        >
          Back to Products
        </Button>
        <Button 
          type="submit" 
          disabled={loading} 
          className="flex-1 bg-primary text-white hover:bg-primary/90"
        >
          {loading ? 'Creating Order...' : 'Create Order'}
        </Button>
      </div>
    </form>
  );
}