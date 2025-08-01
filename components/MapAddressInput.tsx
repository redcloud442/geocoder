"use client";

import { DEFAULT_COORDS } from "@/lib/constant";
import { reverseGeocodeAndUpdate } from "@/lib/helper";
import { ManualAddress, Payload } from "@/lib/types";
import { handleFetch } from "@/services/geoencode";
import { Loader } from "@googlemaps/js-api-loader";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

const loader = new Loader({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  version: "weekly",
  libraries: ["places"],
});

export default function MapAddressInput() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  const [address, setAddress] = useState("");
  const [showManualAddress, setShowManualAddress] = useState(false);
  const [selectedFromGoogle, setSelectedFromGoogle] = useState(false);
  const [result, setResult] = useState<Payload | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  const {
    register,
    handleSubmit: handleFormSubmit,
    watch,
    reset,
  } = useForm<ManualAddress>({
    defaultValues: {
      street: "",
      suburb: "",
      state: "",
      postcode: "",
      country: "",
    },
  });

  const manualAddress = watch();

  useEffect(() => setHasMounted(true), []);

  useEffect(() => {
    if (!window.google || !inputRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ["geocode"],
      }
    ) as google.maps.places.Autocomplete;

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      setSelectedFromGoogle(true);
      setAddress(place.formatted_address || place.name || "");
      setResult(null);
      setShowManualAddress(false);
    });
  }, []);

  useEffect(() => {
    loader.load().then(() => {
      if (mapRef.current) return;

      const mapContainer = document.getElementById("map");
      if (!mapContainer) return;

      const map = new google.maps.Map(mapContainer, {
        center: DEFAULT_COORDS,
        zoom: 13,
      });

      const marker = new google.maps.Marker({
        position: DEFAULT_COORDS,
        map,
        draggable: true,
      });

      mapRef.current = map;
      markerRef.current = marker;

      marker.addListener("dragend", () => handleMarkerDrag(marker));
    });
  }, []);

  const handleMarkerDrag = async (marker: google.maps.Marker) => {
    const pos = marker.getPosition();
    if (!pos) return;

    const coords = { lat: pos.lat(), lng: pos.lng() };
    const address = await reverseGeocodeAndUpdate(coords);

    setAddress(address || "");

    setResult({
      fullAddress: address || "",
      isVerified: true,
      lat: coords.lat,
      lng: coords.lng,
    });
  };

  const handleAddressSubmit = async () => {
    if (selectedFromGoogle && address.trim()) {
      const payload: Payload = {
        fullAddress: address,
        isVerified: true,
      };

      setResult(payload);
      setShowManualAddress(false);
    } else {
      setShowManualAddress(true);
      setResult(null);
    }
  };

  const handleManualSubmit = async (data: ManualAddress) => {
    const fullManual = Object.values(data).join(", ");
    const result = await handleFetch(fullManual);

    const payload: Payload = {
      ...data,
      isVerified: result.isVerified,
      fullAddress: result.fullAddress,
    };

    setAddress(payload.fullAddress || "");
    setResult(payload);

    reset();
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <label htmlFor="autocomplete" className="text-sm font-medium">
        Address
      </label>

      <input
        id="autocomplete"
        ref={inputRef}
        value={address}
        onChange={(e) => {
          setAddress(e.target.value);
          setSelectedFromGoogle(false);
          setResult(null);
        }}
        placeholder="Start typing your address..."
        className="w-full border px-4 py-2 rounded"
      />

      <p className="text-xs text-gray-600">
        Start typing and choose from the list. If your address doesn’t appear,
        you can enter it manually.
      </p>

      <button
        onClick={handleAddressSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Submit Address
      </button>

      {showManualAddress && (
        <form onSubmit={handleFormSubmit(handleManualSubmit)}>
          <div className="space-y-2 border p-4 rounded bg-white text-black mt-4">
            <p className="text-sm font-medium">
              Can&apos;t find your address? Enter it manually:
            </p>
            {(Object.keys(manualAddress) as (keyof ManualAddress)[]).map(
              (field) => (
                <input
                  key={field}
                  className="w-full border px-3 py-2 rounded"
                  placeholder={field[0].toUpperCase() + field.slice(1)}
                  {...register(field)}
                />
              )
            )}

            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              Submit Manual Address
            </button>
          </div>

          {hasMounted && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">
                📍 Or drop a pin to set your location:
              </p>
              <div id="map" className="w-full h-64 border rounded" />
            </div>
          )}
        </form>
      )}

      {result && (
        <div className="space-y-2 border p-4 rounded bg-white text-black mt-4">
          <p className="text-sm font-medium">Result:</p>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
