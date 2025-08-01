import { Client } from "@googlemaps/google-maps-services-js";
import { NextRequest, NextResponse } from "next/server";

const client = new Client({});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  try {
    const response = await client.geocode({
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY!,
        components: {
          country: "au",
        },
      },
    });

    const result = response.data.results?.[0];

    if (!result) {
      return NextResponse.json({ confidence: 0, isVerified: false });
    }

    const countryComponent = result.address_components.find(
      (component: { types: string[] }) => component.types.includes("country")
    );
    const confidence = result.partial_match ? 0.5 : 1.0;
    const formattedAddress = result.formatted_address;

    const isInAustralia =
      countryComponent?.long_name === "Australia" && confidence >= 0.8;

    if (!isInAustralia) {
      return NextResponse.json({
        confidence,
        isVerified: false,
        fullAddress: formattedAddress,
        country: countryComponent?.long_name,
        error: "The address is not in Australia.",
      });
    }

    return NextResponse.json({
      confidence,
      isVerified: confidence >= 0.8,
      fullAddress: formattedAddress,
    });
  } catch (err) {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
  }
}
