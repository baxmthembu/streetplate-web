"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { LocateFixed } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

let geocodingLibraryPromise: Promise<unknown> | null = null;

function loadGeocodingLibrary(apiKey: string) {
  if (!geocodingLibraryPromise) {
    setOptions({
      key: apiKey,
      v: "weekly",
      language: "en",
      region: "ZA",
      authReferrerPolicy: "origin",
    });
    geocodingLibraryPromise = importLibrary("geocoding");
  }
  return geocodingLibraryPromise;
}

export function CurrentLocationButton() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  function useLocation() {
    if (!navigator.geolocation) {
      setStatus("Location is not available in this browser.");
      return;
    }

    setStatus("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const latitude = String(coords.latitude);
        const longitude = String(coords.longitude);
        let location = "Current location";

        if (apiKey) {
          try {
            await loadGeocodingLibrary(apiKey);
            const geocoder = new google.maps.Geocoder();
            const response = await geocoder.geocode({
              location: { lat: coords.latitude, lng: coords.longitude },
            });
            location = response.results[0]?.formatted_address ?? location;
          } catch {
            // Coordinates are still useful when reverse geocoding is unavailable.
          }
        }

        router.push(
          `/discover?location=${encodeURIComponent(location)}&latitude=${latitude}&longitude=${longitude}`,
        );
      },
      () =>
        setStatus("We could not access your location. Enter it above instead."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }

  return (
    <span className="current-location-action">
      <button className="text-link" type="button" onClick={useLocation}>
        <LocateFixed size={17} aria-hidden="true" />
        Use my current location
      </button>
      {status && (
        <span className="current-location-status" role="status">
          {status}
        </span>
      )}
    </span>
  );
}
