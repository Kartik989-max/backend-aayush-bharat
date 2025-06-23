import { NextResponse } from "next/server";

export async function GET() {
  try {
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

    // Get pickup locations
    const pickupResponse = await fetch(`${process.env.SHIPROCKET_API_URL}/v1/external/settings/company/pickup`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!pickupResponse.ok) {
      const errorText = await pickupResponse.text();
      return NextResponse.json(
        { error: "Failed to fetch pickup locations", details: errorText }, 
        { status: 500 }
      );
    }

    const pickupData = await pickupResponse.json();
    return NextResponse.json(pickupData);

  } catch (error) {
    console.error('Error fetching pickup locations:', error);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
} 