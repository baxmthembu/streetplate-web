"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { MapPin, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type PlacesLibrary = google.maps.PlacesLibrary;
type PlacePrediction = google.maps.places.PlacePrediction;

declare global {
  interface Window {
    __streetPlateGoogleMapsConfigured?: boolean;
  }
}

let placesLibraryPromise: Promise<PlacesLibrary> | null = null;

function loadPlacesLibrary(apiKey: string) {
  if (!placesLibraryPromise) {
    if (!window.__streetPlateGoogleMapsConfigured) {
      setOptions({
        key: apiKey,
        v: "weekly",
        language: "en",
        region: "ZA",
        authReferrerPolicy: "origin",
      });
      window.__streetPlateGoogleMapsConfigured = true;
    }
    placesLibraryPromise = importLibrary("places").catch((error: unknown) => {
      placesLibraryPromise = null;
      throw error;
    });
  }
  return placesLibraryPromise;
}

export function DiscoverSearchForm({
  initialQuery = "",
  initialLocation = "",
  initialLatitude = "",
  initialLongitude = "",
}: {
  initialQuery?: string;
  initialLocation?: string;
  initialLatitude?: string;
  initialLongitude?: string;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const [location, setLocation] = useState(initialLocation);
  const [latitude, setLatitude] = useState(initialLatitude);
  const [longitude, setLongitude] = useState(initialLongitude);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [status, setStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState(() =>
    apiKey
      ? ""
      : "Address suggestions are not configured. You can still type your address manually.",
  );
  const sessionToken =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const selectedAddress = useRef(initialLocation);

  useEffect(() => {
    const input = location.trim();
    if (!apiKey || input.length < 3 || input === selectedAddress.current)
      return;

    let active = true;
    const timer = window.setTimeout(async () => {
      setStatus("Finding addresses…");
      setErrorMessage("");
      try {
        const { AutocompleteSessionToken, AutocompleteSuggestion } =
          await loadPlacesLibrary(apiKey);
        sessionToken.current ??= new AutocompleteSessionToken();
        const response =
          await AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input,
            includedRegionCodes: ["za"],
            language: "en",
            region: "ZA",
            sessionToken: sessionToken.current,
          });
        if (!active) return;
        const nextPredictions = response.suggestions.flatMap((suggestion) =>
          suggestion.placePrediction ? [suggestion.placePrediction] : [],
        );
        setPredictions(nextPredictions);
        setHighlightedIndex(-1);
        setStatus(
          nextPredictions.length
            ? `${nextPredictions.length} address suggestions available.`
            : "No matching South African addresses found.",
        );
        setErrorMessage("");
      } catch {
        if (!active) return;
        setPredictions([]);
        setStatus(
          "Address suggestions are temporarily unavailable. You can still type your address.",
        );
        setErrorMessage(
          "Google address suggestions could not load. You can still type your address manually.",
        );
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [apiKey, location]);

  async function selectPrediction(prediction: PlacePrediction) {
    setStatus("Confirming address…");
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ["formattedAddress", "location"] });
      const address = place.formattedAddress ?? prediction.text.text;
      const coordinates = place.location;
      selectedAddress.current = address;
      setLocation(address);
      setPredictions([]);
      setHighlightedIndex(-1);
      sessionToken.current = null;
      if (coordinates) {
        setLatitude(String(coordinates.lat()));
        setLongitude(String(coordinates.lng()));
        setStatus(`Delivery address selected: ${address}`);
        setErrorMessage("");
      } else {
        setStatus(
          "Google could not confirm coordinates for this address. Choose another suggestion or type the address manually.",
        );
        setErrorMessage(
          "Google could not confirm coordinates for this address. Please choose another suggestion.",
        );
      }
    } catch {
      setStatus(
        "Google could not confirm this address. Choose another suggestion or type the address manually.",
      );
      setErrorMessage(
        "Google could not confirm this address. Please choose another suggestion.",
      );
    }
  }

  function handleLocationChange(value: string) {
    selectedAddress.current = "";
    setLocation(value);
    setLatitude("");
    setLongitude("");
    setPredictions([]);
    setHighlightedIndex(-1);
    setStatus("");
    if (apiKey) setErrorMessage("");
  }

  function handleLocationKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!predictions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) => (index + 1) % predictions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) =>
        index <= 0 ? predictions.length - 1 : index - 1,
      );
    } else if (event.key === "Enter" && highlightedIndex >= 0) {
      event.preventDefault();
      void selectPrediction(predictions[highlightedIndex]);
    } else if (event.key === "Escape") {
      setPredictions([]);
      setHighlightedIndex(-1);
    }
  }

  return (
    <form className="discover-search" action="/discover" method="get">
      <div>
        <Search size={19} aria-hidden="true" />
        <label className="sr-only" htmlFor="discover-query">
          Search vendors or meals
        </label>
        <input
          id="discover-query"
          name="q"
          defaultValue={initialQuery}
          placeholder="Search vendors or meals"
        />
      </div>
      <div className="discover-location-field">
        <MapPin size={19} aria-hidden="true" />
        <label className="sr-only" htmlFor="discover-location">
          Delivery location
        </label>
        <input
          id="discover-location"
          name="location"
          value={location}
          onChange={(event) => handleLocationChange(event.target.value)}
          onKeyDown={handleLocationKeyDown}
          placeholder="Delivery location"
          autoComplete="street-address"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={predictions.length > 0}
          aria-controls="discover-location-suggestions"
          aria-activedescendant={
            highlightedIndex >= 0
              ? `discover-location-option-${highlightedIndex}`
              : undefined
          }
        />
        <input type="hidden" name="latitude" value={latitude} />
        <input type="hidden" name="longitude" value={longitude} />
        {predictions.length > 0 && (
          <div
            className="address-suggestions"
            id="discover-location-suggestions"
            role="listbox"
            aria-label="Suggested delivery addresses"
          >
            {predictions.map((prediction, index) => (
              <button
                id={`discover-location-option-${index}`}
                className={index === highlightedIndex ? "highlighted" : ""}
                type="button"
                role="option"
                aria-selected={index === highlightedIndex}
                aria-label={[
                  prediction.mainText?.text ?? prediction.text.text,
                  prediction.secondaryText?.text,
                ]
                  .filter(Boolean)
                  .join(", ")}
                key={prediction.placeId}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void selectPrediction(prediction)}
              >
                <MapPin size={17} aria-hidden="true" />
                <span>
                  <strong>
                    {prediction.mainText?.text ?? prediction.text.text}
                  </strong>
                  {prediction.secondaryText?.text && (
                    <small>{prediction.secondaryText.text}</small>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <button type="submit">Search</button>
      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>
      {errorMessage && (
        <p className="discover-search-message" role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
