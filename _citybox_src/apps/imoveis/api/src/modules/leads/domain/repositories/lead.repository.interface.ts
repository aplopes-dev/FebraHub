import type { LeadDocumentProps, LeadEntity } from '../entities/lead.entity';
import type {
  ApiLeadPaymentIntent,
  ApiLeadPurpose,
  ApiLeadSource,
  ApiLeadStatus,
  ApiPropertyType,
} from '../mappers/lead-enum.mapper';

export type ListLeadsFilters = {
  page: number;
  perPage: number;
  search?: string;
  status?: ApiLeadStatus[];
  leadSource?: ApiLeadSource[];
  purpose?: ApiLeadPurpose[];
  interestedPropertyType?: ApiPropertyType[];
  agentId?: string;
  /** Só leads com `nextFollowUp` preenchido e menor ou igual a esta data. */
  followUpUntil?: Date;
  /** Só leads criados em `createdAt >= createdAtFrom` (inclusive). */
  createdAtFrom?: Date;
};

export type ListLeadsResult = {
  items: LeadEntity[];
  total: number;
};

export type LeadWritePayload = {
  storeId: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  status: ApiLeadStatus;
  leadSource: ApiLeadSource;
  interestedPropertyType: ApiPropertyType;
  budgetRange?: string;
  preferredLocation?: string;
  purpose: ApiLeadPurpose;
  paymentIntents?: ApiLeadPaymentIntent[];
  latestFollowUp?: string | null;
  nextFollowUp?: string | null;
  notes?: string;
  photoUrl?: string | null;
  propertyName?: string | null;
  hasSuggestion?: boolean;
  agentId?: string | null;
  agentIds?: string[];
  matchedProperties?: { id: string; name: string }[];
  documents?: {
    id?: string;
    name: string;
    sizeLabel: string;
    kind?: 'contract' | 'other';
    addedAt: string;
    objectKey?: string | null;
    mimeType?: string | null;
    sentAt?: string | Date | null;
    sentChannel?: 'whatsapp' | 'share' | 'link' | null;
    shareToken?: string | null;
    shareExpiresAt?: string | Date | null;
    viewedAt?: string | Date | null;
  }[];
  activities?: {
    id?: string;
    type: string;
    message: string;
    authorName?: string;
    createdAt?: string;
  }[];
};

export abstract class LeadRepository {
  abstract findMany(
    storeId: string,
    filters: ListLeadsFilters,
  ): Promise<ListLeadsResult>;

  abstract findById(storeId: string, id: string): Promise<LeadEntity | null>;

  abstract create(payload: LeadWritePayload): Promise<LeadEntity>;

  abstract update(
    storeId: string,
    id: string,
    payload: Omit<LeadWritePayload, 'storeId'>,
  ): Promise<LeadEntity | null>;

  abstract updateStatus(
    storeId: string,
    id: string,
    status: ApiLeadStatus,
    activityMessage: string,
  ): Promise<LeadEntity | null>;

  /** Remove imóvel vinculado (`matchedProperties` + `propertyName`). */
  abstract clearPropertyLinks(
    storeId: string,
    leadId: string,
  ): Promise<LeadEntity | null>;

  abstract addDocument(
    storeId: string,
    leadId: string,
    document: {
      id: string;
      name: string;
      sizeLabel: string;
      kind: 'contract' | 'other';
      addedAt: Date;
      objectKey: string | null;
      mimeType: string | null;
    },
    activityMessage?: string,
  ): Promise<LeadEntity | null>;

  abstract markDocumentSent(
    storeId: string,
    leadId: string,
    documentId: string,
    payload: {
      sentAt: Date;
      sentChannel: 'whatsapp' | 'share' | 'link';
      shareToken: string;
      shareExpiresAt: Date;
      activityMessage: string;
    },
  ): Promise<LeadEntity | null>;

  abstract findDocument(
    storeId: string,
    leadId: string,
    documentId: string,
  ): Promise<LeadDocumentProps | null>;

  abstract findDocumentByShareToken(
    token: string,
  ): Promise<{ storeId: string; leadId: string; document: LeadDocumentProps } | null>;

  /** Grava `viewedAt` só se ainda estiver vazio. Devolve o valor persistido. */
  abstract markDocumentViewedIfUnset(
    documentId: string,
    viewedAt: Date,
  ): Promise<Date | null>;

  abstract setDocumentUploadToken(
    storeId: string,
    leadId: string,
    payload: { token: string; expiresAt: Date },
  ): Promise<LeadEntity | null>;

  abstract findByDocumentUploadToken(
    token: string,
  ): Promise<LeadEntity | null>;

  abstract delete(storeId: string, id: string): Promise<boolean>;

  abstract syncAgentCatalog(
    storeId: string,
    agentId: string,
    leadIds: string[],
    fallbackAgentId: string,
  ): Promise<void>;
}
