/**
 * Mock do `storageService` — substitui o upload real (MinIO) do OdontoTech.
 * Resolve com uma URL fake após um pequeno atraso, sem tocar em backend.
 */
export interface StorageUploadResult {
  url: string;
  key: string;
}

let uploadCounter = 0;

export const storageService = {
  upload: (file: File): Promise<StorageUploadResult> => {
    uploadCounter += 1;
    const key = `mock/${Date.now()}-${uploadCounter}-${file.name}`;
    const url = `https://placehold.co/200x200/e2e8f0/64748b?text=${encodeURIComponent(
      file.name.slice(0, 8),
    )}`;
    return new Promise((resolve) => setTimeout(() => resolve({ url, key }), 400));
  },
};
