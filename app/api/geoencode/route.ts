import { Client } from "@googlemaps/google-maps-services-js";
import { NextRequest, NextResponse } from "next/server";

const client = new Client({});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim();

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  if (!clientIp) {
    return NextResponse.json(
      { error: "Unable to determine IP address" },
      { status: 400 }
    );
  }

  try {
    // 1. Geocode the address
    const geocodeResponse = await client.geocode({
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY!,
        components: {
          country: "au",
        },
      },
    });

    const result = geocodeResponse.data.results?.[0];

    if (!result) {
      return NextResponse.json(
        {
          confidence: 0,
          isVerified: false,
          error: "No geocoding result found",
        },
        { status: 404 }
      );
    }

    const countryComponent = result.address_components.find(
      (component: { types: string[] }) => component.types.includes("country")
    );
    const confidence = result.partial_match ? 0.5 : 1.0;
    const formattedAddress = result.formatted_address;
    const addressCountry = countryComponent?.long_name;

    // 2. Get IP location info
    const ipGeoResponse = await fetch(
      `https://api.ipgeolocation.io/v2/ipgeo?apiKey=${process.env.IP_GEOLOCATION_API_KEY}&ip=${clientIp}`
    );

    if (!ipGeoResponse.ok) {
      const text = await ipGeoResponse.text();
      throw new Error(`IP Geolocation fetch failed: ${text}`);
    }

    const ipGeoData = await ipGeoResponse.json();
    const ipCountry = ipGeoData?.location?.country_name;

    const isInAustralia = addressCountry === "Australia" && confidence >= 0.8;

    if (!isInAustralia || ipCountry !== "Australia") {
      return NextResponse.json({
        confidence,
        isVerified: false,
        fullAddress: formattedAddress,
        country: addressCountry,
        ipCountry,
        error:
          "Country mismatch: the IP does not match the address country or is not in Australia.",
      });
    }

    return NextResponse.json({
      confidence,
      isVerified: true,
      fullAddress: formattedAddress,
      country: addressCountry,
      ipCountry,
    });
  } catch (err: any) {
    console.error("Error during verification:", err);
    return NextResponse.json(
      {
        error: "Geocoding or IP check failed",
        details: err?.message || "Unexpected error",
      },
      { status: 500 }
    );
  }
}
