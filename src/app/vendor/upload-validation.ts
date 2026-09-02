import "server-only";

import { randomUUID } from "node:crypto";
import path from "node:path";

const MAX_IMAGE_BYTES = 5_000_000;
const MAX_FILENAME_LENGTH = 120;
const allowedImageTypes = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
} as const;

type AllowedImageType = keyof typeof allowedImageTypes;

export type ImageUploadResult =
  { success: true; file: File } | { success: false; message: string };

function hasSafeFilename(name: string): boolean {
  return (
    name.length > 0 &&
    name.length <= MAX_FILENAME_LENGTH &&
    path.basename(name) === name &&
    !name.startsWith(".") &&
    !/[\\/\u0000-\u001f\u007f]/.test(name) &&
    /^[A-Za-z0-9][A-Za-z0-9._ -]*$/.test(name)
  );
}

function hasExpectedSignature(bytes: Uint8Array, type: AllowedImageType) {
  if (type === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (type === "image/png") {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (value, index) => bytes[index] === value,
    );
  }
  return (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

export async function validateImageUpload(
  value: FormDataEntryValue | null,
): Promise<ImageUploadResult> {
  if (!(value instanceof File) || value.size === 0) {
    return { success: false, message: "Choose an image to upload." };
  }
  if (value.size > MAX_IMAGE_BYTES) {
    return { success: false, message: "Upload an image smaller than 5 MB." };
  }
  if (!hasSafeFilename(value.name)) {
    return {
      success: false,
      message:
        "Rename the image using only letters, numbers, spaces, dots, hyphens or underscores.",
    };
  }

  const type = value.type.toLowerCase() as AllowedImageType;
  if (!(type in allowedImageTypes)) {
    return {
      success: false,
      message: "Upload a JPG, PNG or WebP image.",
    };
  }
  const extension = path.extname(value.name).toLowerCase();
  if (!(allowedImageTypes[type] as readonly string[]).includes(extension)) {
    return {
      success: false,
      message: "The image filename extension does not match its file type.",
    };
  }

  const bytes = new Uint8Array(await value.slice(0, 16).arrayBuffer());
  if (!hasExpectedSignature(bytes, type)) {
    return {
      success: false,
      message: "The selected file is not a valid JPG, PNG or WebP image.",
    };
  }

  const safeExtension = type === "image/jpeg" ? ".jpg" : extension;
  const safeFile = new File([value], `${randomUUID()}${safeExtension}`, {
    type,
    lastModified: Date.now(),
  });
  return { success: true, file: safeFile };
}
