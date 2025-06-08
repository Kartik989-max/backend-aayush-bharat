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
    }

    // Shiprocket API authentication
    const authResponse = await fetch(`${process.env.SHIPROCKET_API_URL}/auth/login`, {
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
      console.error('Shiprocket authentication failed');
      return NextResponse.json(
        { error: "Failed to authenticate with shipping provider" }, 
        { status: 500 }
      );
    }
    
    const authData = await authResponse.json();
    const token = authData.token;
    
    // Create order in Shiprocket
    const orderResponse = await fetch(`${process.env.SHIPROCKET_API_URL}/orders/create/adhoc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(shipmentData),
    });
    
    if (!orderResponse.ok) {
      console.error('Shiprocket order creation failed');
      return NextResponse.json(
        { error: "Failed to create shipment" }, 
        { status: 500 }
      );
    }
    
    const orderData = await orderResponse.json();
    
    // Update the order in our database with Shiprocket info
    await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_ORDERS_COLLECTION_ID!,
      orderId,
      {
        shiprocket_order_id: orderData.order_id?.toString(),
        shiprocket_shipment_id: orderData.shipment_id?.toString(),
        tracking_id: orderData.tracking_number || null,
        shipping_status: 'processing',
        label_url: orderData.label_url || null,
        manifest_url: orderData.manifest_url || null,
      }
    );
    
    return NextResponse.json(orderData);
    
  } catch (error) {
    console.error('Error creating shipment:', error);
    return NextResponse.json(
      { error: "An unexpected error occurred" }, 
      { status: 500 }
    );
  }
}
