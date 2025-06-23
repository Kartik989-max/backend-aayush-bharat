'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { OrderType } from '@/types/order';
import { VariantType } from '@/types/variant';
import { orderService } from '@/services/orderService';
import { productService } from '@/services/productService';
import { ArrowLeft, Truck, Download, Package, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';
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
  const [orderProducts, setOrderProducts] = useState<any[]>([]); // Array of all products in the order
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
    pickup_postcode: '421201',
    delivery_postcode: '',
    cod: false,
    calculatedWeightGrams: 0,
    calculatedWeightKg: 0,
    hasMinimumWeightApplied: false
  });
  const [variantQuantities, setVariantQuantities] = useState<Record<string, number>>({}); // variantId -> quantity
  const [pickupLocations, setPickupLocations] = useState<any[]>([]);
  const [selectedPickupLocation, setSelectedPickupLocation] = useState<string>('Home');
  const [loadingPickupLocations, setLoadingPickupLocations] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<any>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [shipmentSuccess, setShipmentSuccess] = useState<any>(null);

  useEffect(() => {
    loadOrder();
    loadPickupLocations();
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

    // Load tracking info if shipment exists
    if (order?.shiprocket_shipment_id || order?.tracking_id) {
      loadTrackingInfo();
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

  const loadPickupLocations = async () => {
    try {
      setLoadingPickupLocations(true);
      const response = await fetch('/api/shipping/pickup-locations');
      if (response.ok) {
        const data = await response.json();
        console.log('Pickup locations response:', data);
        setPickupLocations(data.data?.shipping_address || []);
        
        // If we have pickup locations from API, set the first one as default
        if (data.data?.shipping_address && data.data.shipping_address.length > 0) {
          setSelectedPickupLocation(data.data.shipping_address[0].pickup_location);
        }
      } else {
        console.error('Failed to fetch pickup locations:', response.status, response.statusText);
        // Fallback to default pickup location
        setPickupLocations([]);
      }
    } catch (error) {
      console.error('Error loading pickup locations:', error);
      // Fallback to default pickup location
      setPickupLocations([]);
    } finally {
      setLoadingPickupLocations(false);
    }
  };

  const loadTrackingInfo = async () => {
    if (!order?.shiprocket_shipment_id && !order?.tracking_id) return;
    
    try {
      setLoadingTracking(true);
      const response = await fetch('/api/shipping/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipment_id: order.shiprocket_shipment_id,
          awb_code: order.tracking_id
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setTrackingInfo(data);
      }
    } catch (error) {
      console.error('Error loading tracking info:', error);
    } finally {
      setLoadingTracking(false);
    }
  };

  const loadProductDetails = async () => {
    try {
      setProductLoading(true);
      
      if (order?.order_variants) {
        // Load product details from variants
        const orderVariantsObj = JSON.parse(order.order_variants);
        const productIds = Object.keys(orderVariantsObj);
        const products = await Promise.all(productIds.map(pid => productService.getProductWithVariants(pid)));
        setOrderProducts(products);
        
        // Set the first product as productData for fallback info
        if (products.length > 0) {
          setProductData(products[0]);
        }
      } else if (order?.product_id) {
        // Load single product details
        const product = await productService.getProductWithVariants(order.product_id);
        setProductData(product);
        setOrderProducts([product]);
      }
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
      const orderVariantsObj = JSON.parse(order.order_variants);
      // Support both old and new formats
      let variantIds: string[] = [];
      let variantQtyMap: Record<string, number> = {};
      for (const [productId, value] of Object.entries(orderVariantsObj)) {
        if (typeof value === 'string') {
          variantIds.push(value);
          variantQtyMap[value] = 1;
        } else if (typeof value === 'object' && value !== null) {
          const v = value as any;
          variantIds.push(v.variantId);
          variantQtyMap[v.variantId] = Number(v.quantity) || 1;
        }
      }
      setVariantQuantities(variantQtyMap);
      // Fetch all variants
      const variantsData = await Promise.all(
        variantIds.map(id => orderService.getVariantsForOrder(JSON.stringify({dummy: id})).then(arr => arr[0]).catch(() => null))
      );
      setOrderVariants((variantsData.filter(Boolean) as VariantType[]));
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
      
      // Get better product details for Shiprocket
      const orderItems = orderVariants.length > 0 
        ? orderVariants.map(variant => ({
            name: variant.name || productData?.name || 'Product',
            sku: variant.$id || '',
            units: 1,
            selling_price: variant.sale_price || order.total_price, // Use sale price if available, otherwise order total
            discount: 0,
            tax: 0,
            hsn: variant.hsn_code || productData?.hsn_code || ''
          }))
        : [{
            name: productData?.name || 'Product',
            sku: order.$id,
            units: order.order_items || 1,
            selling_price: order.total_price,
            discount: 0,
            tax: 0,
            hsn: productData?.hsn_code || ''
          }];
      
      // Construct shipment data for Shiprocket
      const shipmentRequestData = {
        order_id: order.$id,
        order_date: new Date(order.$createdAt).toISOString().split('T')[0],
        pickup_location: selectedPickupLocation,
        channel_id: "",
        comment: "Thank you for shopping with us! Created from admin dashboard",
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
        order_items: orderItems,
        payment_method: order.payment_type === "COD" ? "COD" : "Prepaid",
        sub_total: order.total_price,
        length: shipmentData.length,
        breadth: shipmentData.breadth, 
        height: shipmentData.height,
        weight: shipmentData.weight,
        courier_id: courierId
      };
      
      const result = await orderService.createShiprocketOrder(order.$id, shipmentRequestData);
      
      // Store shipment success details
      setShipmentSuccess(result);
      
      // Update order with Shiprocket details and set status to shipped
      if (result.status === 1 && result.payload) {
        await orderService.updateOrder(order.$id, {
          shiprocket_order_id: result.payload.order_id?.toString() || '',
          shiprocket_shipment_id: result.payload.shipment_id?.toString() || '',
          tracking_id: result.payload.awb_code || '',
          shipping_status: 'shipped',
          label_url: result.payload.label_url || '',
          manifest_url: result.payload.manifest_url || ''
        });
      }
      
      await loadOrder(); // Reload order with updated shipping info
      
      // Automatically load tracking info after successful shipment creation
      setTimeout(() => {
        loadTrackingInfo();
      }, 2000); // Wait 2 seconds for Shiprocket to process
      
      toast({
        title: 'Shipment created successfully!',
        description: `Shipment created with ${companyName}. AWB: ${result.payload?.awb_code || 'N/A'}`,
      });
      
      // Reset the selected courier ID and shipping rates
      setSelectedCourierId(null);
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
              <CardTitle>Payment Information</CardTitle>
              {order.payment_type === "COD" && (
                <Badge variant="outline" className="bg-orange-500/20 text-orange-600 border-orange-200">
                  Cash on Delivery
                </Badge>
              )}
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
            <CardContent>
              {/* Product Details Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700">Name</th>
                      <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700">Category</th>
                      <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700">HSN</th>
                      <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700">SKU</th>
                      <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700">Qty</th>
                      <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700">Unit price</th>
                      <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700">Discount</th>
                      <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700">Tax</th>
                      <th className="border border-gray-200 px-4 py-2 text-left font-medium text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderVariants.length > 0 ? (
                      orderVariants.map((variant, index) => (
                        <tr key={variant.$id || index} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-2">
                            <div className="font-medium">{variant.name || productData?.name || 'Product'}</div>
                            <div className="text-xs text-gray-500">ID: {variant.$id}</div>
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {productData?.category || 'Default Category'}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {variant.hsn_code || productData?.hsn_code || '-'}
                          </td>
                          <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                            {variant.$id}
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-center">
                            {variantQuantities[variant.$id] || 1}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            <div className="flex flex-col">
                              <span>₹{variant.sale_price || variant.price || order.total_price}</span>
                              {variant.sale_price && variant.price && variant.sale_price !== variant.price && (
                                <span className="text-xs text-gray-500 line-through">₹{variant.price}</span>
                              )}
                            </div>
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            {variant.sale_price && variant.price && variant.sale_price !== variant.price ? (
                              <span className="text-green-600">₹{variant.price - variant.sale_price}</span>
                            ) : (
                              '₹0'
                            )}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            0
                          </td>
                          <td className="border border-gray-200 px-4 py-2 font-medium">
                            ₹{variant.sale_price || variant.price || order.total_price}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-2">
                          <div className="font-medium">{productData?.name || 'Product'}</div>
                          <div className="text-xs text-gray-500">ID: {order.product_id}</div>
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          {productData?.category || 'Default Category'}
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          {productData?.hsn_code || '-'}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                          {order.$id}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-center">
                          {order.order_items || 1}
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          ₹{order.total_price}
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          ₹0
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          0
                        </td>
                        <td className="border border-gray-200 px-4 py-2 font-medium">
                          ₹{order.total_price}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Summary */}
              <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Product Total ({orderVariants.length || 1} Item{(orderVariants.length || 1) !== 1 ? 's' : ''})</span>
                  <span className="font-medium">₹ {order.total_price}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Order Total</span>
                  <span>₹ {order.total_price}</span>
                </div>
              </div>

              {/* Additional Product Information */}
              {productData && (
                <div className="mt-4 space-y-3">
                  {productData.tags && (
                    <div className="flex flex-col space-y-1">
                      <span className="text-muted-foreground font-medium">Tags:</span>
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
                      <span className="text-muted-foreground font-medium">Ingredients:</span>
                      <div className="text-sm bg-white p-2 rounded border">
                        {productData.ingredients}
                      </div>
                    </div>
                  )}
                </div>
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
                    <VariantCard key={variant.$id} variant={{...variant, quantity: variantQuantities[variant.$id] || 1}} />
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

          {/* Shipment Success Details */}
          {shipmentSuccess && shipmentSuccess.status === 1 && (
            <Card className="md:col-span-2 border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-green-800">Shipment Created Successfully!</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <InfoRow label="Order ID" value={shipmentSuccess.payload?.order_id} />
                    <InfoRow label="Shipment ID" value={shipmentSuccess.payload?.shipment_id} />
                    <InfoRow label="AWB Code" value={shipmentSuccess.payload?.awb_code} />
                    <InfoRow label="Courier" value={shipmentSuccess.payload?.courier_name} />
                    <InfoRow label="Applied Weight" value={`${shipmentSuccess.payload?.applied_weight} kg`} />
                    <InfoRow label="COD" value={shipmentSuccess.payload?.cod ? 'Yes' : 'No'} />
                  </div>
                  <div className="space-y-2">
                    <InfoRow label="Pickup Scheduled" value={shipmentSuccess.payload?.pickup_scheduled_date} />
                    <InfoRow label="Routing Code" value={shipmentSuccess.payload?.routing_code || 'N/A'} />
                    <InfoRow label="Pickup Token" value={shipmentSuccess.payload?.pickup_token_number} />
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <span className="text-muted-foreground">Shipping Label:</span>
                      {shipmentSuccess.payload?.label_url && (
                        <a href={shipmentSuccess.payload.label_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                          <Download className="w-4 h-4" /> Download Label
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <span className="text-muted-foreground">Manifest:</span>
                      {shipmentSuccess.payload?.manifest_url && (
                        <a href={shipmentSuccess.payload.manifest_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                          <Download className="w-4 h-4" /> Download Manifest
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Live Tracking Information */}
          {(order?.shiprocket_shipment_id || order?.tracking_id || shipmentSuccess) && (
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <CardTitle>Live Tracking & Shipment Information</CardTitle>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadTrackingInfo}
                    disabled={loadingTracking}
                  >
                    {loadingTracking ? 'Loading...' : 'Refresh'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Shipment Details */}
                <div className="grid md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-800">Shipment Details</h4>
                    <InfoRow label="AWB Code" value={order?.tracking_id || shipmentSuccess?.payload?.awb_code} />
                    <InfoRow label="Courier" value={shipmentSuccess?.payload?.courier_name || 'N/A'} />
                    <InfoRow label="Weight Applied" value={shipmentSuccess?.payload?.applied_weight ? `${shipmentSuccess.payload.applied_weight} kg` : 'N/A'} />
                    <InfoRow label="Pickup Scheduled" value={shipmentSuccess?.payload?.pickup_scheduled_date || 'N/A'} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-800">Documents & Links</h4>
                    <div className="space-y-2">
                      {(order?.label_url || shipmentSuccess?.payload?.label_url) && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Shipping Label:</span>
                          <a 
                            href={order?.label_url || shipmentSuccess?.payload?.label_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                          >
                            <Download className="w-3 h-3" /> Download
                          </a>
                        </div>
                      )}
                      {(order?.manifest_url || shipmentSuccess?.payload?.manifest_url) && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Manifest:</span>
                          <a 
                            href={order?.manifest_url || shipmentSuccess?.payload?.manifest_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                          >
                            <Download className="w-3 h-3" /> Download
                          </a>
                        </div>
                      )}
                      <InfoRow label="Pickup Token" value={shipmentSuccess?.payload?.pickup_token_number || 'N/A'} />
                      <InfoRow label="Routing Code" value={shipmentSuccess?.payload?.routing_code || 'N/A'} />
                    </div>
                  </div>
                </div>

                {/* Live Tracking Status */}
                {loadingTracking ? (
                  <div className="space-y-2">
                    <Shimmer type="text" className="w-full" />
                    <Shimmer type="text" className="w-3/4" />
                    <Shimmer type="text" className="w-1/2" />
                  </div>
                ) : trackingInfo?.tracking_data ? (
                  <div className="space-y-4">
                    {/* Current Tracking Status */}
                    {trackingInfo.tracking_data.shipment_track && trackingInfo.tracking_data.shipment_track.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-600" />
                          Current Tracking Status
                        </h4>
                        <div className="bg-green-50 p-3 rounded-md border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                            <span className="font-medium text-green-800">
                              {trackingInfo.tracking_data.shipment_track[0]?.current_status || 'Processing'}
                            </span>
                          </div>
                          <p className="text-sm text-green-700">
                            {trackingInfo.tracking_data.shipment_track[0]?.destination || 'Unknown destination'}
                          </p>
                          <p className="text-xs text-green-600">
                            EDD: {trackingInfo.tracking_data.shipment_track[0]?.edd || 'Not available'}
                          </p>
                          <p className="text-xs text-green-600">
                            Courier: {trackingInfo.tracking_data.shipment_track[0]?.courier_name || 'Not available'}
                          </p>
                          {trackingInfo.tracking_data.track_url && (
                            <div className="mt-2">
                              <a 
                                href={trackingInfo.tracking_data.track_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                              >
                                <Package className="w-3 h-3" />
                                Track on Shiprocket
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Shiprocket Status Summary */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Shipment Summary</h4>
                      <div className="bg-gray-50 p-3 rounded-md grid md:grid-cols-2 gap-2">
                        <InfoRow label="Track Status" value={trackingInfo.tracking_data.track_status === 1 ? 'Active' : 'Inactive'} />
                        <InfoRow label="Shipment Status" value={trackingInfo.tracking_data.shipment_status} />
                        <InfoRow label="Weight" value={`${trackingInfo.tracking_data.shipment_track[0]?.weight || '0'} kg`} />
                        <InfoRow label="Packages" value={trackingInfo.tracking_data.shipment_track[0]?.packages || '1'} />
                        <InfoRow label="Origin" value={trackingInfo.tracking_data.shipment_track[0]?.origin || 'Unknown'} />
                        <InfoRow label="Destination" value={trackingInfo.tracking_data.shipment_track[0]?.destination || 'Unknown'} />
                        <InfoRow label="POD Status" value={trackingInfo.tracking_data.shipment_track[0]?.pod_status || 'N/A'} />
                        <InfoRow label="Return" value={trackingInfo.tracking_data.is_return ? 'Yes' : 'No'} />
                      </div>
                    </div>

                    {/* Tracking Activities */}
                    {trackingInfo.tracking_data.shipment_track_activities && trackingInfo.tracking_data.shipment_track_activities.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Tracking Activities</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
                          {trackingInfo.tracking_data.shipment_track_activities.map((activity: any, index: number) => (
                            <div key={index} className="flex items-start gap-3 p-2 border-l-2 border-blue-200 bg-white rounded">
                              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                              <div className="flex-1">
                                <p className="font-medium text-sm">{activity.activity}</p>
                                <p className="text-xs text-muted-foreground">{activity.location}</p>
                                <p className="text-xs text-muted-foreground">{activity.date}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Click refresh to load live tracking information</p>
                    <Button variant="outline" size="sm" onClick={loadTrackingInfo} className="mt-2">
                      Load Tracking Info
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
                    
                   
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
            {order?.shipping_status !== 'shipped' && !order?.shiprocket_shipment_id && (
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Shiprocket Shipping Calculation</CardTitle>
                <div className="flex items-center gap-2">
                  {order?.shiprocket_shipment_id && (
                    <Badge variant="outline" className="bg-green-500/20 text-green-600 border-green-200">
                      Shipment Created
                    </Badge>
                  )}
                  <Truck className="h-5 w-5 text-muted-foreground" />
                </div>
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
                        disabled={!!order?.shiprocket_shipment_id}
                      />
                    </div>
                    <div>
                      <Label htmlFor="length" className="mb-1">Length (cm)</Label>
                      <Input 
                        id="length"
                        type="number" 
                        value={shipmentData.length}
                        onChange={(e) => handleShipmentDataChange('length', parseInt(e.target.value))}
                        disabled={!!order?.shiprocket_shipment_id}
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
                        disabled={!!order?.shiprocket_shipment_id}
                      />
                    </div>
                    <div>
                      <Label htmlFor="height" className="mb-1">Height (cm)</Label>
                      <Input 
                        id="height"
                        type="number" 
                        value={shipmentData.height}
                        onChange={(e) => handleShipmentDataChange('height', parseInt(e.target.value))}
                        disabled={!!order?.shiprocket_shipment_id}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="pickup-location" className="mb-1 flex items-center gap-1">
                      Pickup Location
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                    </Label>
                    <Select
                      value={selectedPickupLocation}
                      onValueChange={setSelectedPickupLocation}
                      disabled={!!order?.shiprocket_shipment_id || loadingPickupLocations}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingPickupLocations ? "Loading pickup locations..." : "Select pickup location"} />
                      </SelectTrigger>
                      <SelectContent>
                        {pickupLocations.length > 0 ? (
                          pickupLocations.map((location) => (
                            <SelectItem key={location.id} value={location.pickup_location}>
                              <div className="flex flex-col">
                                <span className="font-medium">{location.pickup_location}</span>
                                <span className="text-xs text-muted-foreground">
                                  {location.address}, {location.city} - {location.pin_code}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="Home">
                            <div className="flex flex-col">
                              <span className="font-medium">Home</span>
                              <span className="text-xs text-muted-foreground">
                                flat 206 B wing gajanan heights, Thane - 421201
                              </span>
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="pickup-pincode" className="mb-1">Pickup Pincode</Label>
                    <Input 
                      id="pickup-pincode"
                      type="text" 
                      value={shipmentData.pickup_postcode}
                      onChange={(e) => handleShipmentDataChange('pickup_postcode', e.target.value)}
                      disabled={!!order?.shiprocket_shipment_id}
                    />
                  </div>
                  <div>
                    <Label htmlFor="delivery-pincode" className="mb-1">Delivery Pincode</Label>
                    <Input 
                      id="delivery-pincode"
                      type="text" 
                      value={shipmentData.delivery_postcode}
                      onChange={(e) => handleShipmentDataChange('delivery_postcode', e.target.value)}
                      disabled={!!order?.shiprocket_shipment_id}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="cod-select">COD</Label>
                    <Select
                      value={shipmentData.cod ? 'true' : 'false'}
                      onValueChange={(value) => handleShipmentDataChange('cod', value)}
                      disabled={!!order?.shiprocket_shipment_id}
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
                disabled={shippingCalculating || !!order?.shiprocket_shipment_id}
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
                {shippingRates.length > 0 && !order?.shiprocket_shipment_id && (
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
          )}
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
