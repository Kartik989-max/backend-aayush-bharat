import { NextResponse } from "next/server";
import { databases } from "@/lib/appwrite";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, ...shipmentData } = body;
    
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" }, 
        { status: 400 }
      );
    }    // Shiprocket API authentication
    console.log('Attempting Shiprocket authentication with:', {
      email: process.env.SHIPROCKET_EMAIL,
      apiUrl: process.env.SHIPROCKET_API_URL
    });
    
    const authResponse = await fetch(`${process.env.SHIPROCKET_API_URL}/v1/external/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }),
    });
      if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('Shiprocket authentication failed:', {
        status: authResponse.status,
        statusText: authResponse.statusText,
        response: errorText,
        apiUrl: `${process.env.SHIPROCKET_API_URL}/v1/external/auth/login`
      });
      return NextResponse.json(
        { error: "Failed to authenticate with shipping provider", details: errorText }, 
        { status: 500 }
      );
    }
      const authData = await authResponse.json();
    const token = authData.token;
    console.log('Shiprocket authentication successful, received token');    // Create order in Shiprocket
    console.log('Creating order in Shiprocket with data:', {
      ...shipmentData,
      apiUrl: `${process.env.SHIPROCKET_API_URL}/v1/external/shipments/create/forward-shipment`
    });
    
    const orderResponse = await fetch(`${process.env.SHIPROCKET_API_URL}/v1/external/shipments/create/forward-shipment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(shipmentData),
    });
    
    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('Shiprocket order creation failed:', {
        status: orderResponse.status,
        statusText: orderResponse.statusText,
        response: errorText
      });
      return NextResponse.json(
        { error: "Failed to create shipment", details: errorText }, 
        { status: 500 }
      );
    }
    
    const orderData = await orderResponse.json();    // Update the order in our database with Shiprocket info
    console.log('Updating order with Shiprocket info:', orderData);
    
    // The response structure may differ in the external API
    const shipmentId = orderData.shipment_id || 
                       (orderData.order_id ? orderData.order_id.toString() : null) || 
                       (orderData.data?.shipment_id ? orderData.data.shipment_id.toString() : null) ||
                       (orderData.data?.order_id ? orderData.data.order_id.toString() : null);
                       
    const trackingId = orderData.tracking_number || 
                       orderData.awb_code || 
                       (orderData.data?.awb_code || null) ||
                       (orderData.data?.tracking_number || null);
                       
    const labelUrl = orderData.label_url || 
                    (orderData.data?.label_url || null);
                    
    const manifestUrl = orderData.manifest_url || 
                       (orderData.data?.manifest_url || null);
    
    await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_ORDERS_COLLECTION_ID!,
      orderId,
      {
        shiprocket_order_id: shipmentId,
        shiprocket_shipment_id: orderData.shipment_id?.toString() || (orderData.data?.shipment_id?.toString() || null),
        tracking_id: trackingId,
        shipping_status: 'processing',
        label_url: labelUrl,
        manifest_url: manifestUrl,
      }
    );
    
    return NextResponse.json(orderData);
      } catch (error) {
    console.error('Error creating shipment:', error);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}
