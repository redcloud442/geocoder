"use client";

import { Address, addressSchema } from "@/lib/schema";
import { ManualAddress, Payload } from "@/lib/types";
import { handleFetch, handleReverseGeocode } from "@/services/geoencode";
import { Loader } from "@googlemaps/js-api-loader";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import MapWithMarker from "./GoogleMap";

const loader = new Loader({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  version: "weekly",
  libraries: ["places"],
});

export default function MapAddressInput() {
  const [address, setAddress] = useState("");
  const [showManualAddress, setShowManualAddress] = useState(false);
  const [selectedFromGoogle, setSelectedFromGoogle] = useState(false);
  const [result, setResult] = useState<Payload | null>(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [currentCountry, setCurrentCountry] = useState("Australia");

  const inputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit: handleFormSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<Address>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: "",
      suburb: "",
      state: "",
      postcode: "",
      country: "",
    },
  });

  const manualAddress = watch();

  useEffect(() => {
    let autocomplete: google.maps.places.Autocomplete;

    loader.load().then(() => {
      if (!inputRef.current || !window.google) return;

      autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types: ["address"],
        componentRestrictions: { country: "au" },
      });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();

        setSelectedFromGoogle(true);
        setAddress(place.formatted_address || place.name || "");
        setResult(null);
        setShowManualAddress(false);
        setShowAddressPicker(false);
      });
    });

    return () => {
      if (autocomplete) {
        google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, []);

  const handleDetectUserLocation = async () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        const result = await handleReverseGeocode(latitude, longitude);

        setCurrentCountry(result.country || "Australia");
      },
      (error) => {
        console.warn("Location access denied");
      }
    );
  };

  useEffect(() => {
    handleDetectUserLocation();
  }, []);

  useEffect(() => {
    const container = document.querySelector(".pac-container") as HTMLElement;

    if (!container) return;

    const observer = new MutationObserver(() => {
      const display = getComputedStyle(container).display;
      console.log(display);
      if (display === "none") {
        setShowAddressPicker(true);
      } else {
        setShowAddressPicker(false);
      }
    });

    observer.observe(container, {
      attributes: true,
      attributeFilter: ["style"],
    });

    return () => observer.disconnect();
  }, [address]);

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

  const handleAddressPicker = () => {
    setShowAddressPicker(false);
    setShowManualAddress(true);
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto relative">
      <label htmlFor="autocomplete" className="text-sm font-medium">
        Address
      </label>

      <p className="text-xs text-gray-600">
        You are currently in <span className="font-bold">{currentCountry}</span>
      </p>

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

      {showAddressPicker && (
        <div className="space-y-2 border p-4 rounded bg-white text-black mt-4 absolute -top-10 -right-42">
          <p className="text-sm font-medium">Can&apos;t find your address?</p>
          <button
            onClick={handleAddressPicker}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Enter manually
          </button>
        </div>
      )}

      <p className="text-xs text-gray-600">
        Start typing and choose from the list. If your address doesn’t appear,
        you can enter it manually.
      </p>

      {!showManualAddress && (
        <button
          onClick={handleAddressSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Submit Address
        </button>
      )}

      {showManualAddress && (
        <form onSubmit={handleFormSubmit(handleManualSubmit)}>
          <div className="space-y-2 border p-4 rounded bg-white text-black mt-4">
            <p className="text-sm font-medium">
              Can&apos;t find your address? Enter it manually:
            </p>
            {(Object.keys(manualAddress) as (keyof ManualAddress)[]).map(
              (field) => (
                <>
                  <input
                    key={field}
                    className="w-full border px-3 py-2 rounded"
                    placeholder={field[0].toUpperCase() + field.slice(1)}
                    {...register(field)}
                  />

                  {errors && (
                    <p className="text-red-500 text-sm">
                      {errors[field]?.message}
                    </p>
                  )}
                </>
              )
            )}

            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              Submit Manual Address
            </button>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">
              📍 Or drop a pin to set your location:
            </p>
            <MapWithMarker setResult={setResult} setAddress={setAddress} />
          </div>
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
