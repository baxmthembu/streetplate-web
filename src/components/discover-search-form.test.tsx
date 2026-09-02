import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DiscoverSearchForm } from "./discover-search-form";

const googleMocks = vi.hoisted(() => {
  const fetchFields = vi.fn().mockResolvedValue(undefined);
  const place = {
    formattedAddress: "8115 Vilakazi Street, Orlando West, Soweto, 1804",
    location: { lat: () => -26.2381, lng: () => 27.9089 },
    fetchFields,
  };
  const prediction = {
    placeId: "streetplate-place-1",
    text: { text: "8115 Vilakazi Street, Orlando West, Soweto, 1804" },
    mainText: { text: "8115 Vilakazi Street" },
    secondaryText: { text: "Orlando West, Soweto, 1804" },
    toPlace: () => place,
  };
  const fetchAutocompleteSuggestions = vi.fn().mockResolvedValue({
    suggestions: [{ placePrediction: prediction }],
  });

  return { fetchAutocompleteSuggestions, fetchFields };
});

vi.mock("@googlemaps/js-api-loader", () => ({
  setOptions: vi.fn(),
  importLibrary: vi.fn().mockResolvedValue({
    AutocompleteSessionToken: class AutocompleteSessionToken {},
    AutocompleteSuggestion: {
      fetchAutocompleteSuggestions: googleMocks.fetchAutocompleteSuggestions,
    },
  }),
}));

describe("DiscoverSearchForm", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("stores Google's confirmed address and coordinates for discovery", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "browser-safe-test-key");
    const user = userEvent.setup();
    const { container } = render(<DiscoverSearchForm />);

    await user.type(
      screen.getByRole("combobox", { name: "Delivery location" }),
      "Vilakazi Street",
    );

    const suggestion = await screen.findByRole("option", {
      name: /8115 Vilakazi Street, Orlando West, Soweto, 1804/i,
    });
    await user.click(suggestion);

    expect(
      screen.getByRole("combobox", { name: "Delivery location" }),
    ).toHaveValue("8115 Vilakazi Street, Orlando West, Soweto, 1804");
    await waitFor(() => {
      expect(container.querySelector('input[name="latitude"]')).toHaveValue(
        "-26.2381",
      );
      expect(container.querySelector('input[name="longitude"]')).toHaveValue(
        "27.9089",
      );
    });
    expect(googleMocks.fetchFields).toHaveBeenCalledWith({
      fields: ["formattedAddress", "location"],
    });
  });
});
