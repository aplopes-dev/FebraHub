/**
 * Resolve a URL absoluta da página pública da campanha (path → origin atual).
 * Necessário para QR escaneável no celular.
 * Só aceita http(s) quando a URL já vem absoluta.
 */
export function resolveCampaignPublicUrl(input: {
  clinicId?: string;
  slug?: string;
  publicUrl?: string | null;
}): string | null {
  const path =
    input.clinicId && input.slug
      ? `/campanha/${input.clinicId}/${input.slug}`
      : input.publicUrl?.trim() || null;

  if (!path) return null;

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (path.startsWith("//")) {
    return `https:${path}`;
  }

  // Esquemas não-http (javascript:, data:, mailto:, …) — rejeitar
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) {
    return null;
  }

  if (typeof window === "undefined") {
    return path.startsWith("/") ? path : `/${path}`;
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${window.location.origin}${normalized}`;
}
