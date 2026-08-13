import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it } from "vitest";

import {
  AccountPageSkeleton,
  CartPageSkeleton,
  CheckoutPageSkeleton,
  DiscoverPageSkeleton,
  GenericPageSkeleton,
  VendorPageSkeleton,
} from "./page-skeletons";

const skeletonCases: Array<[string, ComponentType, string]> = [
  ["generic", GenericPageSkeleton, "Loading page"],
  ["discover", DiscoverPageSkeleton, "Loading nearby food"],
  ["vendor", VendorPageSkeleton, "Loading vendor menu"],
  ["account", AccountPageSkeleton, "Loading your account"],
  ["checkout", CheckoutPageSkeleton, "Loading checkout"],
  ["cart", CartPageSkeleton, "Loading your saved cart"],
];

describe("page skeletons", () => {
  it.each(skeletonCases)(
    "provides an accessible %s loading state",
    (_name, Component, label) => {
      render(<Component />);

      expect(screen.getByRole("status", { name: label })).toBeInTheDocument();
    },
  );
});
