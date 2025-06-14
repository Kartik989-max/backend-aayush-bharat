import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pickup_postcode, delivery_postcode, weight, length, breadth, height, cod = false } = body;
    
    console.log('Shipping calculation request:', {
      pickup_postcode, 
      delivery_postcode, 
      weight, 
      length, 
      breadth, 
      height, 
      cod
    });
    
    // Validate required parameters
    if (!pickup_postcode || !delivery_postcode || !weight || !length || !breadth || !height) {
      return NextResponse.json(
        { error: "Missing required parameters" }, 
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
        url: `${process.env.SHIPROCKET_API_URL}/v1/external/auth/login`,
        response: errorText
      });
      return NextResponse.json(
        { error: "Failed to authenticate with shipping provider", details: errorText }, 
        { status: 500 }
      );
    }
    
    const authData = await authResponse.json();
    const token = authData.token;
    
    // Calculate shipping rate
    const queryParams = new URLSearchParams({
      pickup_postcode: pickup_postcode.toString(),
      delivery_postcode: delivery_postcode.toString(),
      weight: weight.toString(),
      cod: cod ? '1' : '0',
      length: length.toString(),
      breadth: breadth.toString(),
      height: height.toString()    });    console.log(`Calling Shiprocket API: ${process.env.SHIPROCKET_API_URL}/v1/external/courier/serviceability?${queryParams}`);
    
    const shippingResponse = await fetch(`${process.env.SHIPROCKET_API_URL}/v1/external/courier/serviceability?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      }
    });
    
    if (!shippingResponse.ok) {
      const errorText = await shippingResponse.text();
      console.error('Shiprocket serviceability check failed:', {
        status: shippingResponse.status,
        statusText: shippingResponse.statusText,
        url: `${process.env.SHIPROCKET_API_URL}/v1/external/courier/serviceability?${queryParams}`,
        response: errorText
      });
      return NextResponse.json(
        { error: "Failed to calculate shipping rates", details: errorText }, 
        { status: 500 }
      );
    }
    
    const shippingData = await shippingResponse.json();
    return NextResponse.json(shippingData);
    
  } catch (error) {
    console.error('Error calculating shipping:', error);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}
