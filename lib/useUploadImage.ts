"use client";

import { useMutation } from "convex/react";
import { useCallback } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { compressImageToWebp } from "./image";

/** Compresses an image on the client, then uploads it to Convex storage. */
export function useUploadImage() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  return useCallback(
    async (file: File): Promise<Id<"_storage">> => {
      const compressed = await compressImageToWebp(file);
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/webp" },
        body: compressed,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
      return storageId;
    },
    [generateUploadUrl],
  );
}
