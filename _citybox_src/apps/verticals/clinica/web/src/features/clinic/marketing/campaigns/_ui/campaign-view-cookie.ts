/**
 * Utilitários para gerenciar cookies de visualização de campanhas
 */

const COOKIE_PREFIX = "campaign_view_";
/** TTL de deduplicação de views */
export const CAMPAIGN_VIEW_COOKIE_MAX_AGE_SEC = 30 * 60; // 30 minutos

/**
 * Obtém o nome do cookie para uma campanha específica
 */
export function getCampaignViewCookieName(campaignId: string): string {
  return `${COOKIE_PREFIX}${campaignId}`;
}

/**
 * Lê o timestamp do cookie de visualização da campanha
 * @returns Timestamp em milissegundos ou null se o cookie não existir / expirou
 */
export function getCampaignViewCookie(campaignId: string): number | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookieName = getCampaignViewCookieName(campaignId);
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === cookieName && value) {
      const timestamp = parseInt(value, 10);
      if (!isNaN(timestamp)) {
        return timestamp;
      }
    }
  }

  return null;
}

/**
 * True se ainda há cookie válido (TTL 30min gerenciado pelo browser).
 */
export function hasCampaignViewCookie(campaignId: string): boolean {
  return getCampaignViewCookie(campaignId) !== null;
}

/**
 * Define o cookie de visualização da campanha (Max-Age 30 minutos).
 */
export function setCampaignViewCookie(campaignId: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const cookieName = getCampaignViewCookieName(campaignId);
  const timestamp = Date.now();
  document.cookie = `${cookieName}=${timestamp}; Max-Age=${CAMPAIGN_VIEW_COOKIE_MAX_AGE_SEC}; path=/; SameSite=Lax`;
}

/**
 * Remove o cookie de visualização da campanha
 */
export function removeCampaignViewCookie(campaignId: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const cookieName = getCampaignViewCookieName(campaignId);
  document.cookie = `${cookieName}=; Max-Age=0; path=/;`;
}
