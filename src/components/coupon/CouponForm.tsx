'use client';
import { useState, useEffect } from 'react';
import { createDocument } from '@/lib/appwrite';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface CouponFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  onCancel: () => void;
}

const CouponForm = ({ onSubmit, initialData, onCancel }: CouponFormProps) => {
  const [formData, setFormData] = useState({
    coupon_code: initialData?.coupon_code || '',
    min_price: initialData?.min_price || '',
    expiry_date: initialData?.expiry_date ? new Date(initialData.expiry_date).toISOString().split('T')[0] : '',
    description: initialData?.description || '',
    coupon_discount: initialData?.coupon_discount || '',
    discount_type: initialData?.discount_type || 'percentage'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = () => {
    if (!formData.coupon_code) return 'Coupon code is required';
    if (!formData.min_price || formData.min_price < 0) return 'Minimum price must be 0 or greater';
    if (!formData.expiry_date) return 'Expiry date is required';
    if (!formData.coupon_discount || formData.coupon_discount < 0) 
      return 'Discount must be greater than 0';
    if (formData.discount_type === 'percentage' && formData.coupon_discount >= 100)
      return 'Percentage discount must be less than 100';
    if (formData.description && formData.description.split(' ').length > 50) 
      return 'Description cannot exceed 50 words';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const processedData = {
        ...formData,
        min_price: parseInt(formData.min_price),
        coupon_discount: parseInt(formData.coupon_discount),
        expiry_date: new Date(formData.expiry_date).toISOString(),
        discount_type: formData.discount_type
      };

      await createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_COUPON_COLLECTION_ID!,
        processedData
      );
      onSubmit(processedData);
    } catch (error: any) {
      console.error('Form submission failed:', error);
      setError(error?.message || 'Failed to save coupon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-dark-100 p-6 rounded-lg">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block mb-2 text-light-100">Coupon Code</label>
          <Input
            type="text"
            value={formData.coupon_code}
            onChange={(e) => setFormData({...formData, coupon_code: e.target.value.toUpperCase()})}
            className="w-full p-3 rounded-lg bg-dark-200 border border-dark-100 text-light-100"
            placeholder="SUMMER2024"
            required
          />
        </div>

        <div>
          <label className="block mb-2 text-light-100">Minimum Price (₹)</label>
          <Input
            type="number"
            value={formData.min_price}
            onChange={(e) => setFormData({...formData, min_price: e.target.value})}
            className="w-full p-3 rounded-lg bg-dark-200 border border-dark-100 text-light-100"
            min="0"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block mb-2 text-light-100">Discount Type</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="percentage"
                checked={formData.discount_type === 'percentage'}
                onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                className="mr-2"
              />
              Percentage (%)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="flat"
                checked={formData.discount_type === 'flat'}
                onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                className="mr-2"
              />
              Flat (₹)
            </label>
          </div>
        </div>

        <div>
          <label className="block mb-2 text-light-100">
            Discount {formData.discount_type === 'percentage' ? '(%)' : '(₹)'}
          </label>
          <Input
            type="number"
            value={formData.coupon_discount}
            onChange={(e) => setFormData({...formData, coupon_discount: e.target.value})}
            className="w-full p-3 rounded-lg bg-dark-200 border border-dark-100 text-light-100"
            min="0"
            max={formData.discount_type === 'percentage' ? "99" : undefined}
            required
          />
        </div>

        <div>
          <label className="block mb-2 text-light-100">Expiry Date</label>
          <Input
            type="date"
            value={formData.expiry_date}
            onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
            className="w-full p-3 rounded-lg bg-dark-200 border border-dark-100 text-light-100"
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>
      </div>

      <div className="relative">
        <label className="block mb-2 text-light-100">Description (Optional - Max 50 words)</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="w-full p-3 rounded-lg bg-dark-200 border border-dark-100 text-light-100"
          rows={3}
          placeholder="Enter coupon description..."
          maxLength={200}
        />
        <div className="text-xs text-light-100/50 mt-1">
          {formData.description ? `${formData.description.split(' ').length}/50 words` : '0/50 words'}
        </div>
      </div>

      {/* Coupon Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative p-6 border-2 border-dashed border-primary/30 rounded-lg bg-dark-200 overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <span className="text-xs font-semibold text-primary/70">Limited Time Offer</span>
            <h3 className="text-3xl font-bold text-primary mb-2 font-mono">
              {formData.coupon_code || 'COUPON'}
            </h3>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-light-100">
                {formData.discount_type === 'percentage' 
                  ? `${formData.coupon_discount}% OFF`
                  : `₹${formData.coupon_discount} OFF`}
              </p>
              <p className="text-sm text-light-100/70">
                On orders above ₹{formData.min_price || '0'}
              </p>
              {formData.description && (
                <p className="text-sm text-light-100/60 line-clamp-2">{formData.description}</p>
              )}
              {formData.expiry_date && (
                <div className="pt-2 border-t border-dark-100">
                  <p className="text-xs text-light-100/50">
                    Valid until {new Date(formData.expiry_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="relative p-6 border-2 border-dashed border-secondary/30 rounded-lg bg-dark-200 overflow-hidden">
          <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-secondary/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <span className="text-xs font-semibold text-secondary/70">Preview Details</span>
            <div className="space-y-4 mt-2">
              <div>
                <p className="text-sm text-light-100/50">Discount Value</p>
                <p className="text-xl font-bold text-secondary">
                  {formData.discount_type === 'percentage' 
                    ? `${formData.coupon_discount}% OFF`
                    : `₹${formData.coupon_discount} OFF`}
                </p>
              </div>
              <div>
                <p className="text-sm text-light-100/50">Minimum Order Value</p>
                <p className="text-xl font-bold text-light-100">₹{formData.min_price || '0'}</p>
              </div>
              <div>
                <p className="text-sm text-light-100/50">Valid Period</p>
                <p className="text-light-100">
                  {formData.expiry_date 
                    ? `Until ${new Date(formData.expiry_date).toLocaleDateString()}`
                    : 'Set an expiry date'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button 
          type="submit"  
          variant='secondary'
          className="bg-black hover:bg-gray-900 text-white flex-1 "
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Coupon'}
        </Button>
        <Button 
          type="button" 
          variant='outline'
          onClick={onCancel}
          className="  flex-1"
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default CouponForm;