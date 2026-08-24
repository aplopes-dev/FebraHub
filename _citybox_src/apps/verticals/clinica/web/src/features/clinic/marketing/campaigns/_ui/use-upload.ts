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

/**
 * Stub do `useUploadFile` do OdontoTech (`@/features/storage/hooks`).
 *
 * Reproduz a forma de uma mutation do TanStack Query (`mutateAsync`) usada pelo
 * wizard de campanha para "enviar" o logo. No ERP mockado o arquivo recebe uma
 * URL fictícia (object URL) instantaneamente, sem storage real.
 */
export function useUploadFile(_options?: unknown) {
  const mutateAsync = useCallback(
    async (input: { file: File; [key: string]: unknown }): Promise<{
      url: string;
      key: string;
    }> => {
      const key = `mock/${Date.now()}-${input.file.name}`;
      const url =
        typeof URL !== "undefined" && "createObjectURL" in URL
          ? URL.createObjectURL(input.file)
          : `https://mock.local/${key}`;
      return { url, key };
    },
    [],
  );

  return { mutateAsync, isPending: false };
}
