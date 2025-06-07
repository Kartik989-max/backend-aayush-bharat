'use client';
import { useState, useEffect } from 'react';
import { createDocument } from '@/lib/appwrite';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle } from 'lucide-react';

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="coupon_code">Coupon Code</Label>
          <Input
            id="coupon_code"
            type="text"
            value={formData.coupon_code}
            onChange={(e) => setFormData({...formData, coupon_code: e.target.value.toUpperCase()})}
            placeholder="SUMMER2024"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="min_price">Minimum Price (₹)</Label>
          <Input
            id="min_price"
            type="number"
            value={formData.min_price}
            onChange={(e) => setFormData({...formData, min_price: e.target.value})}
            min="0"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Discount Type</Label>
          <RadioGroup
            value={formData.discount_type}
            onValueChange={(value: 'percentage' | 'flat') => setFormData({...formData, discount_type: value})}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="percentage" id="percentage" />
              <Label htmlFor="percentage">Percentage (%)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="flat" id="flat" />
              <Label htmlFor="flat">Flat (₹)</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="coupon_discount">
            Discount {formData.discount_type === 'percentage' ? '(%)' : '(₹)'}
          </Label>
          <Input
            id="coupon_discount"
            type="number"
            value={formData.coupon_discount}
            onChange={(e) => setFormData({...formData, coupon_discount: e.target.value})}
            min="0"
            max={formData.discount_type === 'percentage' ? "99" : undefined}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiry_date">Expiry Date</Label>
          <Input
            id="expiry_date"
            type="date"
            value={formData.expiry_date}
            onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional - Max 50 words)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Enter coupon description..."
          maxLength={200}
          rows={3}
        />
        <p className="text-sm text-muted-foreground">
          {formData.description ? `${formData.description.split(' ').length}/50 words` : '0/50 words'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Limited Time Offer</span>
                <h3 className="text-2xl font-bold font-mono mt-1">
                  {formData.coupon_code || 'COUPON'}
                </h3>
              </div>
              <div>
                <p className="text-xl font-bold">
                  {formData.discount_type === 'percentage' 
                    ? `${formData.coupon_discount}% OFF`
                    : `₹${formData.coupon_discount} OFF`}
                </p>
                <p className="text-sm text-muted-foreground">
                  On orders above ₹{formData.min_price || '0'}
                </p>
                {formData.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {formData.description}
                  </p>
                )}
                {formData.expiry_date && (
                  <div className="pt-2 border-t mt-2">
                    <p className="text-xs text-muted-foreground">
                      Valid until {new Date(formData.expiry_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Preview Details</span>
                <div className="space-y-4 mt-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Discount Value</p>
                    <p className="text-xl font-bold">
                      {formData.discount_type === 'percentage' 
                        ? `${formData.coupon_discount}% OFF`
                        : `₹${formData.coupon_discount} OFF`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Minimum Order Value</p>
                    <p className="text-xl font-bold">₹{formData.min_price || '0'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valid Period</p>
                    <p>
                      {formData.expiry_date 
                        ? `Until ${new Date(formData.expiry_date).toLocaleDateString()}`
                        : 'Set an expiry date'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Button 
          type="submit"  
          className="flex-1"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Coupon'}
        </Button>
        <Button 
          type="button" 
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default CouponForm;