/**
 * Store ativa no PDV (placeholder até integrar auth/loja).
 * Campos reais virão da platform-api / sessão.
 */
export type StoreSummary = {
  id: string;
  name: string;
  /** URL da logo; se ausente, usa monograma. */
  logoUrl: string | null;
  /** Endereço exibido no recibo. */
  address: string;
};
