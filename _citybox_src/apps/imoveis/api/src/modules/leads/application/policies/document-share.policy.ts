import type { LeadDocumentSentChannel } from '../../domain/entities/lead.entity';
import { randomBytes } from 'crypto';

export const LEAD_DOCUMENT_SHARE_TTL_MS = 48 * 60 * 60 * 1000;

export type { LeadDocumentSentChannel };

export function createLeadDocumentShareToken(): string {
  return randomBytes(32).toString('base64url');
}

export function leadDocumentShareExpiresAt(now: Date): Date {
  return new Date(now.getTime() + LEAD_DOCUMENT_SHARE_TTL_MS);
}

export function isLeadDocumentShareExpired(
  expiresAt: Date | null,
  now: Date,
): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() <= now.getTime();
}

function publicWebOrigin(): string {
  return (
    process.env.IMOVEIS_WEB_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3111'
  )
    .trim()
    .replace(/\/$/, '');
}

export function publicLeadDocumentSharePath(token: string): string {
  return `/d/${encodeURIComponent(token)}`;
}

export function publicLeadDocumentShareUrl(token: string): string {
  return `${publicWebOrigin()}${publicLeadDocumentSharePath(token)}`;
}
