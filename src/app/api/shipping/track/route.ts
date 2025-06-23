import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shipment_id, awb_code } = body;
    
    if (!shipment_id && !awb_code) {
      return NextResponse.json(
        { error: "Either shipment_id or awb_code is required" }, 
        { status: 400 }
      );
    }

    // Shiprocket API authentication
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
      return NextResponse.json(
        { error: "Failed to authenticate with shipping provider", details: errorText }, 
        { status: 500 }
      );
    }

    const authData = await authResponse.json();
    const token = authData.token;

    // Track shipment
    const trackingUrl = shipment_id 
      ? `${process.env.SHIPROCKET_API_URL}/v1/external/courier/track/shipment/${shipment_id}`
      : `${process.env.SHIPROCKET_API_URL}/v1/external/courier/track/awb/${awb_code}`;

    const trackingResponse = await fetch(trackingUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!trackingResponse.ok) {
      const errorText = await trackingResponse.text();
      return NextResponse.json(
        { error: "Failed to get tracking information", details: errorText }, 
        { status: 500 }
      );
    }

    const trackingData = await trackingResponse.json();
    return NextResponse.json(trackingData);

  } catch (error) {
    console.error('Error tracking shipment:', error);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
} 