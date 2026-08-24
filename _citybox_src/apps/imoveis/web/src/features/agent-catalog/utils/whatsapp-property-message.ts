/**
 * Mensagem WhatsApp do catálogo (cliente → corretor).
 *
 * - Texto simples: título + link público `/p/:id?action=new-lead`
 * - Sem emojis, Ref/ID no corpo, nem rota interna `/leads/new`
 * - `encodeURIComponent` aplicado **uma única vez** no href final
 */

import { getPublicPropertyPath } from '@/features/shared/data/navigation';
import { phoneDigits } from '@/features/shared/utils/lead-contact';
import { getClientAppOrigin, getPublicAppOrigin } from '@/lib/public-app-url';

export type WhatsAppPropertyMessageParams = {
  propertyTitle: string;
  propertyId: string;
  /**
   * Origem absoluta do link. Default: `getPublicAppOrigin` (SSR-safe).
   * No click/pós-mount, passar origem da aba via `getClientAppOrigin()`.
   */
  origin?: string;
};

/**
 * Texto cru (sem encode). Quebras de linha literais `\n`
 * viram `%0A` só em {@link buildWhatsAppPropertyHref}.
 */
export function buildWhatsAppPropertyMessageText(
  params: WhatsAppPropertyMessageParams,
): string {
  const title = params.propertyTitle.trim() || 'imóvel';
  const propertyId = params.propertyId.trim();
  const baseUrl = (params.origin ?? getPublicAppOrigin()).replace(/\/$/, '');
  const propertyUrl = `${baseUrl}${getPublicPropertyPath(propertyId, {
    action: 'new-lead',
  })}`;

  return [
    `Olá! Tenho interesse no imóvel *${title}*.`,
    '',
    'Link do imóvel:',
    propertyUrl,
  ].join('\n');
}

/**
 * `https://wa.me/<digits>?text=<encodeURIComponent(message)>`
 * Prefixa 55 em números BR locais (10–11 dígitos).
 */
export function buildWhatsAppPropertyHref(params: {
  phone: string;
  propertyTitle: string;
  propertyId: string;
  origin?: string;
}): string | null {
  let digits = phoneDigits(params.phone);
  if (digits.length < 10) return null;
  if (digits.length >= 10 && digits.length <= 11) {
    digits = `55${digits}`;
  }

  const messageText = buildWhatsAppPropertyMessageText({
    propertyTitle: params.propertyTitle,
    propertyId: params.propertyId,
    origin: params.origin,
  });

  const encodedText = encodeURIComponent(messageText);
  return `https://wa.me/${digits}?text=${encodedText}`;
}

/** Alias pedido no spec. */
export function buildWhatsAppPropertyUrl(params: {
  phone: string;
  propertyTitle: string;
  propertyId: string;
  origin?: string;
}): string | null {
  return buildWhatsAppPropertyHref(params);
}

export function buildWhatsAppGeneralHref(phone: string, text: string): string | null {
  let digits = phoneDigits(phone);
  if (digits.length < 10) return null;
  if (digits.length >= 10 && digits.length <= 11) {
    digits = `55${digits}`;
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/** Reconstrói o href do imóvel com a origem da aba atual (handlers / pós-mount). */
export function buildWhatsAppPropertyHrefOnClient(params: {
  phone: string;
  propertyTitle: string;
  propertyId: string;
}): string | null {
  return buildWhatsAppPropertyHref({
    ...params,
    origin: getClientAppOrigin(),
  });
}
