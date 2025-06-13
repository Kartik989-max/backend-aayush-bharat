'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { OrderType } from '@/types/order';
import { VariantType } from '@/types/variant';
import { orderService } from '@/services/orderService';
import { productService } from '@/services/productService';
import { ArrowLeft, Truck, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shimmer } from "@/components/ui/shimmer";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { VariantCard } from '@/components/order/VariantCard';

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
  const { toast } = useToast();  const [order, setOrder] = useState<OrderType | null>(null);
  const [orderVariants, setOrderVariants] = useState<VariantType[]>([]);
  const [productData, setProductData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [variantsLoading, setVariantsLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(false);
  const [deliveryCharges, setDeliveryCharges] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [shippingCalculating, setShippingCalculating] = useState(false);
  const [shippingRates, setShippingRates] = useState<any[]>([]);  
  const [selectedCourierId, setSelectedCourierId] = useState<number | null>(null);
  const [shipmentData, setShipmentData] = useState({
    weight: 0.5,
    length: 10,
    breadth: 10,
    height: 10,
    pickup_postcode: '400001', // Default Mumbai postcode
    delivery_postcode: '',
    cod: false,
    calculatedWeightGrams: 0,
    calculatedWeightKg: 0,
    hasMinimumWeightApplied: false
  });useEffect(() => {
    loadOrder();
  }, [orderId]);
  
  useEffect(() => {
    if (order?.pincode) {
      setShipmentData(prev => ({
        ...prev,
        delivery_postcode: order.pincode.toString(),
        cod: order.payment_type === "COD"
      }));
    }
    
    if (order?.delivery_charges) {
      setDeliveryCharges(order.delivery_charges.toString());
    }
    
    // Load variants when order is loaded
    if (order?.order_variants) {
      loadOrderVariants();
    } else {
      setVariantsLoading(false);
    }
    
    // Load product details when order is loaded
    if (order?.product_id) {
      loadProductDetails();
    }
  }, [order]);
    // New useEffect to calculate total weight from variants and update shipment data
  useEffect(() => {
    if (orderVariants.length > 0) {
      // Calculate total weight in grams from all variants
      const totalWeightInGrams = orderVariants.reduce((total, variant) => {
        // Handle missing or invalid weight values
        const variantWeight = variant.weight || 0;
        return total + variantWeight;
      }, 0);
      
      // Convert from grams to kilograms for Shiprocket (divide by 1000)
      const calculatedWeightInKg = totalWeightInGrams / 1000;
      
      // Apply minimum weight requirement (0.5kg) if needed
      const finalWeightInKg = calculatedWeightInKg < 0.5 ? 0.5 : calculatedWeightInKg;
      
      console.log(`Calculated total weight from ${orderVariants.length} variants: ${totalWeightInGrams}g (${calculatedWeightInKg}kg, final: ${finalWeightInKg}kg)`);
      
      // Update shipment data with the calculated weight
      setShipmentData(prev => ({
        ...prev,
        weight: finalWeightInKg,
        // Store original calculated values for display purposes
        calculatedWeightGrams: totalWeightInGrams,
        calculatedWeightKg: calculatedWeightInKg,
        hasMinimumWeightApplied: calculatedWeightInKg < 0.5
      }));
    }
  }, [orderVariants]);
  
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

  const loadProductDetails = async () => {
    if (!order?.product_id) return;
    
    try {
      setProductLoading(true);
      const data = await productService.getProductWithVariants(order.product_id);
      setProductData(data);
      console.log('Product data loaded:', data);
    } catch (error) {
      console.error('Error loading product details:', error);
      toast({
        title: 'Error loading product',
        description: 'Failed to load product information for this order',
        variant: 'destructive',
      });
    } finally {
      setProductLoading(false);
    }
  };
  
  const loadOrderVariants = async () => {
    if (!order?.order_variants) {
      setVariantsLoading(false);
      return;
    }
    
    try {
      setVariantsLoading(true);
      
      console.log('Loading variants for order:', {
        orderId: order.$id,
        orderVariants: order.order_variants
      });
      
      const variantsData = await orderService.getVariantsForOrder(order.order_variants);
      
      console.log('Loaded variants:', variantsData);
      
      if (variantsData.length === 0) {
        console.warn('No variants found for order', order.$id);
      }
      
      setOrderVariants(variantsData);
    } catch (error) {
      console.error('Error loading order variants:', error);
      toast({
        title: 'Error loading variants',
        description: 'Failed to load variant information for this order',
        variant: 'destructive',
      });
    } finally {
      setVariantsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;
    
    try {
      setSaving(true);
      
      // If status is changed to "shipped", update delivery charges as well
      if (newStatus === 'shipped' && deliveryCharges) {
        await orderService.updateOrderWithDeliveryCharges(
          order.$id, 
          newStatus, 
          parseFloat(deliveryCharges)
        );
        
        toast({
          title: 'Status and delivery charges updated',
          description: `Order status changed to ${newStatus} with delivery charges of ₹${deliveryCharges}`,
        });
      } else {
        await orderService.updateOrderShippingStatus(order.$id, newStatus);
        
        toast({
          title: 'Status updated',
          description: `Order status changed to ${newStatus}`,
        });
      }
      
      await loadOrder();
    } catch (error) {
      console.error('Error updating shipping status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  const handleShipmentDataChange = (field: string, value: any) => {
    setShipmentData(prev => {
      const newState = { ...prev, [field]: field === 'cod' ? value === 'true' : value };
      
      // If manually changing weight, update calculation flags
      if (field === 'weight' && orderVariants.length > 0) {
        // Only mark as manually changed if it's different from both calculated weights
        const isManualChange = value !== prev.calculatedWeightKg && value !== prev.weight;
        if (isManualChange) {
          return {
            ...newState,
            hasMinimumWeightApplied: false,  // No longer using minimum weight logic
          };
        }
      }
      
      return newState;
    });
  };

  const calculateShipping = async () => {
    if (!order) return;
    
    try {
      setShippingCalculating(true);
      const result = await orderService.calculateShiprocketShipping(shipmentData);
      
      if (result.data && result.data.available_courier_companies) {
        setShippingRates(result.data.available_courier_companies || []);
        toast({
          title: 'Shipping rates calculated',
          description: `Found ${result.data.available_courier_companies.length} shipping options`,
        });
      } else {
        console.warn('Unexpected shipping calculation response:', result);
        toast({
          title: 'No shipping options available',
          description: 'No courier services available for this route or package size',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error calculating shipping:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to calculate shipping rates',
        variant: 'destructive',
      });
    } finally {
      setShippingCalculating(false);
    }
  };

  const createShipment = async (courierId: number, companyName: string) => {
    if (!order) return;
    
    try {
      setSaving(true);
      // Construct shipment data for Shiprocket
      const shipmentRequestData = {
        order_id: order.$id,
        order_date: new Date(order.created_at).toISOString().split('T')[0],
        pickup_location: "Primary",
        channel_id: "",
        comment: "Created from admin dashboard",
        billing_customer_name: `${order.first_name} ${order.last_name}`,
        billing_last_name: order.last_name,
        billing_address: order.address,
        billing_city: order.city,
        billing_pincode: order.pincode,
        billing_state: order.state,
        billing_country: order.country,
        billing_email: order.email,
        billing_phone: order.phone_number,
        shipping_is_billing: true,
        shipping_customer_name: `${order.first_name} ${order.last_name}`,
        shipping_address: order.address,
        shipping_city: order.city,
        shipping_pincode: order.pincode,
        shipping_state: order.state,
        shipping_country: order.country,
        shipping_email: order.email,
        shipping_phone: order.phone_number,
        order_items: [], // You'd need to populate this with actual order items
        payment_method: order.payment_type === "COD" ? "COD" : "Prepaid",
        sub_total: order.total_price,
        length: shipmentData.length,
        breadth: shipmentData.breadth, 
        height: shipmentData.height,
        weight: shipmentData.weight,
        courier_id: courierId
      };
      
      const result = await orderService.createShiprocketOrder(order.$id, shipmentRequestData);
      await loadOrder(); // Reload order with updated shipping info
      
      toast({
        title: 'Shipment created',
        description: `Shipment created with ${companyName}`,
      });
      
      // Reset the selected courier ID
      setSelectedCourierId(null);
      // Reset shipping rates to clear the selection UI
      setShippingRates([]);
    } catch (error) {
      console.error('Error creating shipment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create shipment',
        variant: 'destructive',
      });
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
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground">Order #{order.$id}</p>
                  {order.payment_type === "COD" && (
                    <Badge variant="outline" className="bg-orange-500/20 text-orange-600 border-orange-200">
                      COD
                    </Badge>
                  )}
                </div>
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
              <InfoRow label="Status" value={order.status} />
              <InfoRow label="Idempotency Key" value={order.idempotency_key} />
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
              <InfoRow label="Shiprocket Order ID" value={order.shiprocket_order_id} />
              <InfoRow label="Shiprocket Shipment ID" value={order.shiprocket_shipment_id} />
              <InfoRow label="Tracking ID" value={order.tracking_id} />
              {order.label_url && (
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-muted-foreground">Shipping Label:</span>
                  <a href={order.label_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    <Download className="w-4 h-4" /> Download Label
                  </a>
                </div>
              )}
              {order.manifest_url && (
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-muted-foreground">Shipping Manifest:</span>
                  <a href={order.manifest_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    <Download className="w-4 h-4" /> Download Manifest
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Payment Information</CardTitle>
                {order.payment_type === "COD" && (
                  <Badge variant="outline" className="bg-orange-500/20 text-orange-600 border-orange-200">
                    Cash on Delivery
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Payment Type" value={order.payment_type} />
              <InfoRow label="Payment Status" value={order.payment_status} />
              <InfoRow label="Payment Amount" value={`₹${order.payment_amount}`} />
              <InfoRow label="Total Price" value={`₹${order.total_price}`} />
              <InfoRow label="Coupon Code" value={order.coupon_code || 'Not applied'} />
              <InfoRow label="Coupon Discount" value={order.coupon_discount ? `₹${order.coupon_discount}` : 'None'} />
              <InfoRow label="Coupon Price" value={order.coupon_price ? `₹${order.coupon_price}` : 'None'} />
              <InfoRow label="Delivery Charges" value={order.delivery_charges ? `₹${order.delivery_charges}` : 'None'} />
              <InfoRow label="Razorpay Order ID" value={order.razorpay_order_id} />
              <InfoRow label="Razorpay Payment ID" value={order.razorpay_payment_id} />
              <InfoRow label="Razorpay Signature" value={order.razorpay_signature} />
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
          </Card>          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Order Items & Product Details</CardTitle>
                {productData && (
                  <Badge variant="outline" className="bg-green-500/20 text-green-600 border-green-200">
                    Product Loaded
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3"><InfoRow label="Total Items" value={order.order_items?.toString() || '0'} />
              <InfoRow label="Product ID" value={order.product_id} />
              
              {productLoading ? (
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-muted-foreground">Product Name:</span>
                  <Shimmer type="text" className="w-32" />
                </div>
              ) : productData ? (
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Product Name:</span>
                    <Badge variant="outline" className="bg-green-500/20 text-green-600 border-green-200 font-medium">
                      {productData.name}
                    </Badge>
                  </div>
                  {productData.description && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium line-clamp-1">Description:</span> {productData.description}
                    </div>
                  )}
                </div>
              ) : null}              {productData && (
                <>
                  <InfoRow label="Category" value={productData.category} />                  {productData.tags && (
                    <div className="flex flex-col space-y-1">
                      <span className="text-muted-foreground">Tags:</span>
                      <div className="flex flex-wrap gap-1">
                        {productData.tags.split(',').map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" className="bg-blue-500/10 text-blue-600">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {productData.ingredients && (
                    <div className="flex flex-col space-y-1">
                      <span className="text-muted-foreground">Ingredients:</span>
                      <div className="text-sm">
                        {productData.ingredients}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>              <div className="flex justify-between items-center">
                <CardTitle>Order Variants</CardTitle>
                {order.order_variants && (
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-600 border-blue-200">
                    {orderVariants.length} Variant{orderVariants.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {variantsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[1, 2, 3,4].map((_, i) => (
                    <Shimmer key={i} type="card" />
                  ))}
                </div>
              ) : orderVariants.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {orderVariants.map((variant) => (
                    <VariantCard key={variant.$id} variant={variant} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <p className="text-muted-foreground">
                    {order.order_variants ? 
                      "Failed to load variant information for this order" : 
                      "No variant information available for this order"}
                  </p>
                  {order.order_variants && !variantsLoading && (
                    <Button 
                      variant="outline" 
                      onClick={() => loadOrderVariants()}
                      size="sm"
                    >
                      Try Again
                    </Button>
                  )}
                </div>
              )}
              {/* {order.order_variants && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Raw Variant Data:</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-6 px-2"
                      onClick={() => {
                        if (order.order_variants) {
                          const variantIds = Object.values(JSON.parse(order.order_variants));
                          console.log('Variant IDs in order:', variantIds);
                          console.log('Environment variable:', process.env.NEXT_PUBLIC_APPWRITE_VARIANT_COLLECTION_ID);
                        }
                      }}
                    >
                      Debug
                    </Button>
                  </div>
                  <pre className="bg-muted p-2 rounded-md text-xs overflow-auto max-h-32">
                    {order.order_variants}
                  </pre>
                </div>
              )} */}
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
                  <div className="space-y-4">
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
                    
                    {order.shipping_status === 'shipped' || statusOptions.includes('shipped') ? (
                      <div>
                        <Label htmlFor="delivery-charges" className="mb-1">Delivery Charges (₹)</Label>
                        <Input
                          id="delivery-charges"
                          type="number"
                          value={deliveryCharges}
                          onChange={(e) => setDeliveryCharges(e.target.value)}
                          placeholder="Enter delivery charges"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
            <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Shiprocket Shipping Calculation</CardTitle>
              <Truck className="h-5 w-5 text-muted-foreground" />
            </CardHeader>            <CardContent>
              {orderVariants.length > 0 && (
                <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-100">
                  <div className="flex flex-col gap-1 text-green-700 text-sm">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      <span className="font-medium">Weight calculation: </span> 
                    </div>
                    <div className="pl-6 flex flex-col gap-1">
                      <div>Total variants weight: {shipmentData.calculatedWeightGrams}g = {shipmentData.calculatedWeightKg.toFixed(3)}kg</div>
                      {shipmentData.hasMinimumWeightApplied && (
                        <div className="flex items-center gap-1 text-amber-600">
                          <span>⚠️ Applied minimum weight of 0.5kg for shipping</span>
                        </div>
                      )}
                      <div className="font-medium">Final shipping weight: {shipmentData.weight}kg</div>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">                  <div className="grid grid-cols-2 gap-4">                    <div>
                      <Label htmlFor="weight" className="mb-1 flex items-center gap-1">
                        Weight (kg)
                        {orderVariants.length > 0 && (
                          <Badge variant="outline" className={`text-xs ${shipmentData.hasMinimumWeightApplied ? 'bg-amber-500/10 text-amber-600' : 'bg-green-500/10 text-green-600'}`}>
                            {shipmentData.hasMinimumWeightApplied ? 'Min 0.5kg applied' : 'Auto from variants'}
                          </Badge>
                        )}
                      </Label>
                      <Input 
                        id="weight"
                        type="number" 
                        step="0.1"
                        value={shipmentData.weight}
                        onChange={(e) => handleShipmentDataChange('weight', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="length" className="mb-1">Length (cm)</Label>
                      <Input 
                        id="length"
                        type="number" 
                        value={shipmentData.length}
                        onChange={(e) => handleShipmentDataChange('length', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="width" className="mb-1">Width (cm)</Label>
                      <Input 
                        id="width"
                        type="number" 
                        value={shipmentData.breadth}
                        onChange={(e) => handleShipmentDataChange('breadth', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="height" className="mb-1">Height (cm)</Label>
                      <Input 
                        id="height"
                        type="number" 
                        value={shipmentData.height}
                        onChange={(e) => handleShipmentDataChange('height', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="pickup-pincode" className="mb-1">Pickup Pincode</Label>
                    <Input 
                      id="pickup-pincode"
                      type="text" 
                      value={shipmentData.pickup_postcode}
                      onChange={(e) => handleShipmentDataChange('pickup_postcode', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="delivery-pincode" className="mb-1">Delivery Pincode</Label>
                    <Input 
                      id="delivery-pincode"
                      type="text" 
                      value={shipmentData.delivery_postcode}
                      onChange={(e) => handleShipmentDataChange('delivery_postcode', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="cod-select">COD</Label>
                    <Select
                      value={shipmentData.cod ? 'true' : 'false'}
                      onValueChange={(value) => handleShipmentDataChange('cod', value)}
                    >
                      <SelectTrigger id="cod-select" className="w-24">
                        <SelectValue placeholder="COD" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                    {order.payment_type === "COD" && (
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200">
                        COD Order
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={calculateShipping} 
                disabled={shippingCalculating}
                className="w-full md:w-auto mt-4"
                variant="default"
              >
                {shippingCalculating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Calculating...
                  </>
                ) : (
                  <>Calculate Shipping Rates</>
                )}
              </Button>
                {shippingRates.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Available Shipping Options</h3>
                  <div className="grid gap-4">
                    {shippingRates.map((rate, index) => (
                      <Card 
                        key={index} 
                        className={`overflow-hidden ${selectedCourierId === rate.courier_company_id ? 'border-primary border-2' : ''}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div className="space-y-1">
                              <p className="font-semibold">{rate.courier_name}</p>
                              <p className="text-muted-foreground text-sm">Delivery: {rate.estimated_delivery_days} days</p>
                              <Badge className="mt-1" variant="secondary">₹{rate.rate}</Badge>
                            </div>
                            {selectedCourierId === rate.courier_company_id ? (
                              <Button 
                                onClick={() => createShipment(rate.courier_company_id, rate.courier_name)}
                                disabled={saving}
                                variant="default"
                                size="sm"
                              >
                                {saving ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating...
                                  </>
                                ) : 'Create Shipment'}
                              </Button>
                            ) : (
                              <Button 
                                onClick={() => setSelectedCourierId(rate.courier_company_id)}
                                variant="outline"
                                size="sm"
                              >
                                Select
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
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

  if (label === "Payment Type" && value === "COD") {
    return (
      <div className="flex flex-col sm:flex-row sm:justify-between">
        <span className="text-muted-foreground">{label}:</span>
        <Badge variant="outline" className="bg-orange-500/20 text-orange-600 border-orange-200">
          Cash on Delivery
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

  const isLongText = value.length > 30 && !["Address", "User ID", "Payment Type"].includes(label);
  
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
