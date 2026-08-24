import {
  getAgentCatalogPath,
  getNewLeadPath,
  getPublicPropertyPath,
} from '@/features/shared/data/navigation';
import { getClientAppOrigin, getPublicAppOrigin } from '@/lib/public-app-url';
import { buildWhatsAppPropertyMessageText } from './whatsapp-property-message';

function originOr(base?: string): string {
  return (base ?? getPublicAppOrigin()).replace(/\/$/, '');
}

export function catalogPublicUrl(agentSlug: string, origin?: string): string {
  return `${originOr(origin ?? getClientAppOrigin())}${getAgentCatalogPath(agentSlug)}`;
}

/** Link público do imóvel (prévia OG + interceptor new-lead). */
export function listingPublicUrl(
  _agentSlug: string,
  listingId: string,
  origin?: string,
): string {
  return `${originOr(origin ?? getClientAppOrigin())}${getPublicPropertyPath(listingId, {
    action: 'new-lead',
  })}`;
}

/** Link autenticado — interceptor do corretor (não vai na mensagem do cliente). */
export function listingLeadCreateUrl(
  listingId: string,
  origin?: string,
  client?: { name?: string; phone?: string },
): string {
  return `${originOr(origin)}${getNewLeadPath({
    propertyId: listingId,
    name: client?.name,
    phone: client?.phone,
    source: 'whatsapp',
  })}`;
}

export function catalogShareWhatsAppMessage(agentSlug: string, origin?: string): string {
  return `Confira meu catálogo de imóveis: ${catalogPublicUrl(agentSlug, origin)}`;
}

export function listingShareWhatsAppMessage(
  listingTitle: string,
  _agentSlug: string,
  listingId: string,
): string {
  return buildWhatsAppPropertyMessageText({
    propertyTitle: listingTitle,
    propertyId: listingId,
  });
}

export function catalogShareMailto(agentSlug: string, agentName: string, origin?: string): string {
  const url = catalogPublicUrl(agentSlug, origin);
  const subject = encodeURIComponent(`Catálogo de imóveis — ${agentName}`);
  const body = encodeURIComponent(`Olá! Confira meu catálogo:\n\n${url}`);
  return `mailto:?subject=${subject}&body=${body}`;
}

/** `navigator.share` com fallback para copiar o texto/URL. */
export async function shareOrCopyUrl(input: {
  title: string;
  text: string;
  url: string;
  copyText: (value: string) => Promise<boolean>;
}): Promise<'shared' | 'copied' | 'failed'> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: input.title,
        text: input.text,
        url: input.url,
      });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'failed';
      }
    }
  }
  const ok = await input.copyText(input.url);
  return ok ? 'copied' : 'failed';
}
