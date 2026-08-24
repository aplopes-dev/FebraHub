/**
 * Garante URL absoluta para redirecionamento externo.
 * Sem protocolo (`www.instagram.com`), o browser trata como path relativo
 * e junta com a origem atual (`/campanha/.../www.instagram.com`).
 */
export function toAbsoluteExternalUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  // Já tem esquema (http:, https:, mailto:, …) ou é protocol-relative
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith("//")) {
    return trimmed;
  }

  // Path relativo do próprio app — mantém
  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}
