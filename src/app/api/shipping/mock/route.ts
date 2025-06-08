import { NextResponse } from "next/server";

// Mock data for testing Shiprocket integration
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pickup_postcode, delivery_postcode, weight } = body;
    
    // Log the request for debugging
    console.log('Mock shipping calculation request:', body);
    
    // Create a mock response
    const mockResponse = {
      status: 200,
      message: "Courier serviceability fetched successfully.",
      data: {
        available_courier_companies: [
          {
            courier_company_id: 1,
            courier_name: "Delhivery",
            rate: Math.floor(100 + (weight * 10) + Math.random() * 100),
            estimated_delivery_days: "1-2 days",
            cod: true
          },
          {
            courier_company_id: 2,
            courier_name: "DTDC",
            rate: Math.floor(120 + (weight * 12) + Math.random() * 100),
            estimated_delivery_days: "2-3 days",
            cod: true
          },
          {
            courier_company_id: 3,
            courier_name: "Bluedart",
            rate: Math.floor(150 + (weight * 15) + Math.random() * 100),
            estimated_delivery_days: "1-2 days",
            cod: false
          }
        ]
      }
    };
    
    return NextResponse.json(mockResponse);
    
  } catch (error) {
    console.error('Error in mock shipping calculation:', error);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}
