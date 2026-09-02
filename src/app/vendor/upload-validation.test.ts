import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let validateImageUpload: typeof import("./upload-validation").validateImageUpload;

beforeAll(async () => {
  ({ validateImageUpload } = await import("./upload-validation"));
});

const pngSignature = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

describe("validateImageUpload", () => {
  it("accepts a genuine supported image and replaces its original filename", async () => {
    const input = new File([pngSignature], "meal photo.png", {
      type: "image/png",
    });

    const result = await validateImageUpload(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.file.name).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.png$/i,
      );
      expect(result.file.type).toBe("image/png");
    }
  });

  it("rejects a MIME type that does not match the filename extension", async () => {
    const input = new File([pngSignature], "meal.jpg", { type: "image/png" });

    await expect(validateImageUpload(input)).resolves.toEqual({
      success: false,
      message: "The image filename extension does not match its file type.",
    });
  });

  it("rejects content that only claims to be an image", async () => {
    const input = new File(["not an image"], "meal.png", {
      type: "image/png",
    });

    await expect(validateImageUpload(input)).resolves.toEqual({
      success: false,
      message: "The selected file is not a valid JPG, PNG or WebP image.",
    });
  });

  it("rejects unsafe filenames", async () => {
    const input = new File([pngSignature], "../meal.png", {
      type: "image/png",
    });

    const result = await validateImageUpload(input);

    expect(result.success).toBe(false);
  });

  it("rejects images larger than the upload limit", async () => {
    const input = new File([new Uint8Array(5_000_001)], "meal.png", {
      type: "image/png",
    });

    await expect(validateImageUpload(input)).resolves.toEqual({
      success: false,
      message: "Upload an image smaller than 5 MB.",
    });
  });
});
