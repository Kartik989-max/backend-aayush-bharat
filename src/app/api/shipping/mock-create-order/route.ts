import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId } = body;
    
    console.log('Mock create order request:', body);
    
    // Simulate a successful Shiprocket order creation response
    const mockResponse = {
      order_id: Date.now().toString(),
      shipment_id: Math.floor(Math.random() * 1000000).toString(),
      status: "NEW",
      status_code: 1,
      onboarding_completed_now: 0,
      awb_code: `TEST${Math.floor(Math.random() * 1000000)}`,
      courier_company_id: "1",
      courier_name: "Mock Shipping Provider",
      tracking_number: `TR${Math.floor(Math.random() * 10000000)}`,
      label_url: "https://example.com/mock_label.pdf",
      manifest_url: "https://example.com/mock_manifest.pdf",
      order_invoice_id: 0,
      invoice_url: "https://example.com/mock_invoice.pdf",
    };
    
    console.log('Mock create order response:', mockResponse);
    
    return NextResponse.json(mockResponse);
    
  } catch (error) {
    console.error('Error in mock create order:', error);
    return NextResponse.json(
      { error: "An unexpected error occurred in mock API", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}
