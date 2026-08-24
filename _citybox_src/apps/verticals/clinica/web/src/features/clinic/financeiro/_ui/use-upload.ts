"use client";

import { useState, useCallback } from "react";

/**
 * Stub em memória do hook de upload do OdontoTech (`@/components/upload/use-upload`).
 *
 * No ERP a feature roda 100% mockada: os anexos são "enviados" instantaneamente
 * e recebem uma URL/chave fictícia, sem storage real.
 */

export type UploadStatus = "pending" | "uploading" | "completed" | "error";

export interface Upload {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  key?: string;
  url?: string;
}

let uploadCounter = 0;

export function useUpload() {
  const [uploads, setUploads] = useState<Upload[]>([]);

  const addUpload = useCallback((file: File): string => {
    uploadCounter += 1;
    const id = `upload-${uploadCounter}`;
    const key = `mock/${id}-${file.name}`;
    const url =
      typeof URL !== "undefined" && "createObjectURL" in URL
        ? URL.createObjectURL(file)
        : `https://mock.local/${key}`;

    setUploads((prev) => [
      ...prev,
      { id, file, status: "completed", progress: 100, key, url },
    ]);
    return id;
  }, []);

  const removeUpload = useCallback((id: string) => {
    setUploads((prev) => prev.filter((upload) => upload.id !== id));
  }, []);

  return { uploads, addUpload, removeUpload };
}
