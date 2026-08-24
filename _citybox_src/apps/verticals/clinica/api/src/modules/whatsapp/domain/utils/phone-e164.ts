import { onlyDigits } from '../../../../shared/core/utils/brazilian-document.utils';

/**
 * Normaliza telefone BR para E.164 (+55…).
 * Aceita 10–11 dígitos locais ou 12–13 com DDI 55.
 */
export function toWhatsappE164(
  value: string | null | undefined,
): string | null {
  if (!value?.trim()) return null;
  let digits = onlyDigits(value);
  if (!digits) return null;

  if (
    digits.startsWith('55') &&
    (digits.length === 12 || digits.length === 13)
  ) {
    digits = digits.slice(2);
  }

  if (digits.length !== 10 && digits.length !== 11) {
    return null;
  }

  return `+55${digits}`;
}

/** JID Baileys sem sufixo @s.whatsapp.net */
export function e164ToBaileysJid(e164: string): string {
  const digits = onlyDigits(e164);
  return `${digits}@s.whatsapp.net`;
}

export function baileysJidToE164(jid: string): string | null {
  const user = jid.split('@')[0] ?? '';
  return toWhatsappE164(user);
}

/**
 * Variantes do número para consulta no WhatsApp. Contas BR antigas continuam
 * registradas sem o nono dígito, então um envio para o número "correto" cai no
 * vazio — é preciso perguntar ao servidor qual das formas existe.
 */
export function whatsappNumberCandidates(e164: string): string[] {
  const digits = onlyDigits(e164);
  if (!digits.startsWith('55')) return [digits];

  const local = digits.slice(2);
  const ddd = local.slice(0, 2);
  const subscriber = local.slice(2);

  const alternate =
    subscriber.length === 9 && subscriber.startsWith('9')
      ? `55${ddd}${subscriber.slice(1)}`
      : subscriber.length === 8
        ? `55${ddd}9${subscriber}`
        : null;

  return alternate ? [digits, alternate] : [digits];
}

/**
 * Mesmas variantes, em E.164. Necessário na busca da confirmação ativa: o envio
 * pode ter sido gravado com o nono dígito e a resposta chegar sem ele.
 */
export function whatsappE164Variants(e164: string): string[] {
  return whatsappNumberCandidates(e164).map((digits) => `+${digits}`);
}
