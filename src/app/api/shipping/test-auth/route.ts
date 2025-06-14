import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Log the credentials we're using (mask the password in production)
    console.log('Testing Shiprocket authentication with:', {
      email: process.env.SHIPROCKET_EMAIL,
      apiUrl: process.env.SHIPROCKET_API_URL,
      passwordProvided: !!process.env.SHIPROCKET_PASSWORD
    });
    
    // Try both versions of the API endpoint
    const endpoints = [
      `${process.env.SHIPROCKET_API_URL}/v1/external/auth/login`,
      'https://apiv2.shiprocket.in/v1/external/auth/login'
    ];
    
    let token: string | null = null;
    let successEndpoint: string | null = null;
    let errors: Array<{
      endpoint: string;
      status?: number;
      statusText?: string;
      response?: string;
      error?: string;
    }> = [];
    
    // Try each endpoint
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: process.env.SHIPROCKET_EMAIL,
            password: process.env.SHIPROCKET_PASSWORD,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          token = data.token;
          successEndpoint = endpoint;
          console.log(`Authentication successful with endpoint: ${endpoint}`);
          break;
        } else {
          const errorText = await response.text();
          errors.push({
            endpoint,
            status: response.status,
            statusText: response.statusText,
            response: errorText
          });
          console.error(`Authentication failed for endpoint ${endpoint}:`, {
            status: response.status,
            statusText: response.statusText,
            response: errorText
          });
        }
      } catch (err) {
        const error = err as Error;
        errors.push({
          endpoint,
          error: error.message
        });
        console.error(`Error accessing endpoint ${endpoint}:`, error);
      }
    }
    
    if (!token) {
      return NextResponse.json({
        success: false,
        message: "Authentication failed for all endpoints",
        errors
      }, { status: 500 });
    }
    
    // Test the serviceability endpoint
    try {
      const testParams = new URLSearchParams({
        pickup_postcode: '400001',
        delivery_postcode: '248001',
        weight: '0.5',
        cod: '0',
        length: '10',
        breadth: '10',
        height: '10'
      });
      
      // If successEndpoint is null, use a default endpoint
      const baseUrl = (successEndpoint && successEndpoint.includes('apiv2.shiprocket.in')) 
        ? 'https://apiv2.shiprocket.in' 
        : (process.env.SHIPROCKET_API_URL || 'https://apiv2.shiprocket.in');
      
      const serviceabilityUrl = `${baseUrl}/v1/external/courier/serviceability?${testParams}`;
      console.log(`Testing serviceability endpoint: ${serviceabilityUrl}`);
      
      const serviceabilityResponse = await fetch(serviceabilityUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (serviceabilityResponse.ok) {
        const serviceabilityData = await serviceabilityResponse.json();
        return NextResponse.json({
          success: true,
          message: "Authentication and serviceability check successful",
          authEndpoint: successEndpoint,
          serviceabilityEndpoint: serviceabilityUrl,
          serviceabilityData
        });
      } else {
        const errorText = await serviceabilityResponse.text();
        return NextResponse.json({
          success: false,
          message: "Authentication successful but serviceability check failed",
          authEndpoint: successEndpoint,
          serviceabilityEndpoint: serviceabilityUrl,
          serviceabilityError: {
            status: serviceabilityResponse.status,
            statusText: serviceabilityResponse.statusText,
            response: errorText
          }
        }, { status: 500 });
      }
    } catch (err) {
      const error = err as Error;
      return NextResponse.json({
        success: false,
        message: "Authentication successful but error testing serviceability",
        authEndpoint: successEndpoint,
        error: error.message
      }, { status: 500 });
    }
  } catch (err) {
    const error = err as Error;
    console.error('Error testing Shiprocket API:', error);
    return NextResponse.json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message
    }, { status: 500 });
  }
}
