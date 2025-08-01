import { Client } from "@googlemaps/google-maps-services-js";
import { NextRequest, NextResponse } from "next/server";

const client = new Client({});

export async function POST(request: NextRequest) {
  const { latitude, longitude } = await request.json();

  if (!latitude || !longitude) {
    return NextResponse.json(
      { error: "Latitude and longitude are required" },
      { status: 400 }
    );
  }

  try {
    const response = await client.reverseGeocode({
      params: {
        latlng: `${latitude},${longitude}`,
        key: process.env.GOOGLE_MAPS_API_KEY!,
      },
    });

    const results = response.data.results;

    const country = results[0].address_components.find(
      (component: { types: string[] }) => component.types.includes("country")
    )?.long_name;

    if (!country) {
      return NextResponse.json({ confidence: 0, isVerified: false });
    }

    const confidence = 1.0;
    const formattedAddress = results[0].formatted_address;

    return NextResponse.json({
      confidence,
      isVerified: confidence >= 0.8,
      fullAddress: formattedAddress,
      country,
    });
  } catch (err) {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
  }
}
