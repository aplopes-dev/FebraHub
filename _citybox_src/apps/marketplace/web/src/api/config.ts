/** Modo da API: `mock` (MSW) ou `live` (BFF real). */
export const API_MODE = import.meta.env.VITE_API_MODE ?? 'mock';

/** Base URL usada pelo fetch — no modo mock o MSW intercepta independentemente. */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:4010';
