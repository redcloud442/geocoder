"use client";

import { DEFAULT_COORDS } from "@/lib/constant";
import { reverseGeocodeAndUpdate } from "@/lib/helper";
import { Payload } from "@/lib/types";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useState } from "react";

type MapWithMarkerProps = {
  setResult: (result: Payload | null) => void;
  setAddress: (value: string) => void;
};

const containerStyle = {
  width: "100%",
  height: "250px",
};

export default function MapWithMarker({
  setResult,
  setAddress,
}: MapWithMarkerProps) {
  const [markerPosition, setMarkerPosition] = useState(DEFAULT_COORDS);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["places"],
  });

  const onDragEnd = async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    const resolvedAddress = await reverseGeocodeAndUpdate({ lat, lng });

    const payload: Payload = {
      fullAddress: resolvedAddress || "",
      isVerified: true,
      lat,
      lng,
    };

    setAddress(resolvedAddress || "");
    setResult(payload);
    setMarkerPosition({ lat, lng });
  };

  if (!isLoaded) return <div className="text-sm">Loading map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={markerPosition}
      zoom={13}
    >
      <Marker
        position={markerPosition}
        draggable={true}
        onDragEnd={onDragEnd}
      />
    </GoogleMap>
  );
}
