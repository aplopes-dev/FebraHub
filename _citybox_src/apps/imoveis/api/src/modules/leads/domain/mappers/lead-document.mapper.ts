import type {
  LeadDocumentProps,
  LeadDocumentSentChannel,
} from '../../domain/entities/lead.entity';

const SENT_CHANNELS = new Set<LeadDocumentSentChannel>([
  'whatsapp',
  'share',
  'link',
]);

export function parseSentChannel(
  value: string | null | undefined,
): LeadDocumentSentChannel | null {
  if (!value) return null;
  return SENT_CHANNELS.has(value as LeadDocumentSentChannel)
    ? (value as LeadDocumentSentChannel)
    : null;
}

export function toLeadDocumentProps(input: {
  id: string;
  name: string;
  sizeLabel: string;
  kind: 'contract' | 'other' | string;
  addedAt: Date;
  objectKey?: string | null;
  mimeType?: string | null;
  sentAt?: Date | null;
  sentChannel?: string | null;
  shareToken?: string | null;
  shareExpiresAt?: Date | null;
  viewedAt?: Date | null;
}): LeadDocumentProps {
  return {
    id: input.id,
    name: input.name,
    sizeLabel: input.sizeLabel,
    kind: input.kind === 'contract' ? 'contract' : 'other',
    addedAt: input.addedAt,
    objectKey: input.objectKey ?? null,
    mimeType: input.mimeType ?? null,
    sentAt: input.sentAt ?? null,
    sentChannel: parseSentChannel(input.sentChannel),
    shareToken: input.shareToken ?? null,
    shareExpiresAt: input.shareExpiresAt ?? null,
    viewedAt: input.viewedAt ?? null,
  };
}
