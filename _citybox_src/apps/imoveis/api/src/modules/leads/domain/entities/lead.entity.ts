import { Entity } from '../../../../shared/core/entity';
import type {
  ApiLeadActivityType,
  ApiLeadPaymentIntent,
  ApiLeadPurpose,
  ApiLeadSource,
  ApiLeadStatus,
  ApiPropertyType,
} from '../mappers/lead-enum.mapper';

export type LeadMatchedPropertyProps = {
  id: string;
  propertyId: string;
  propertyName: string;
  sortOrder: number;
  /** Capa enriquecida na leitura — não persiste em `lead_matched_properties`. */
  coverPhotoUrl?: string | null;
};

export type LeadDocumentSentChannel = 'whatsapp' | 'share' | 'link';

export type LeadDocumentProps = {
  id: string;
  name: string;
  sizeLabel: string;
  kind: 'contract' | 'other';
  addedAt: Date;
  objectKey: string | null;
  mimeType: string | null;
  sentAt: Date | null;
  sentChannel: LeadDocumentSentChannel | null;
  shareToken: string | null;
  shareExpiresAt: Date | null;
  viewedAt: Date | null;
};

export type LeadActivityProps = {
  id: string;
  type: ApiLeadActivityType;
  message: string;
  authorName?: string;
  createdAt: Date;
};

export type LeadProps = {
  storeId: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  status: ApiLeadStatus;
  leadSource: ApiLeadSource;
  interestedPropertyType: ApiPropertyType;
  budgetRange: string;
  preferredLocation: string;
  purpose: ApiLeadPurpose;
  /** Qualificação financeira (opcional). Independente do meio da transação. */
  paymentIntents?: ApiLeadPaymentIntent[];
  latestFollowUp: Date | null;
  nextFollowUp: Date | null;
  notes: string;
  photoUrl: string | null;
  propertyName: string | null;
  hasSuggestion: boolean;
  agentId: string | null;
  agentIds: string[];
  matchedProperties: LeadMatchedPropertyProps[];
  documents: LeadDocumentProps[];
  activities: LeadActivityProps[];
  createdAt: Date;
  updatedAt: Date;
};

export class LeadEntity extends Entity<LeadProps> {
  get storeId(): string {
    return this.props.storeId;
  }
  get name(): string {
    return this.props.name;
  }
  get email(): string {
    return this.props.email;
  }
  get phone(): string {
    return this.props.phone;
  }
  get city(): string {
    return this.props.city;
  }
  get state(): string {
    return this.props.state;
  }
  get status(): ApiLeadStatus {
    return this.props.status;
  }
  get leadSource(): ApiLeadSource {
    return this.props.leadSource;
  }
  get interestedPropertyType(): ApiPropertyType {
    return this.props.interestedPropertyType;
  }
  get budgetRange(): string {
    return this.props.budgetRange;
  }
  get preferredLocation(): string {
    return this.props.preferredLocation;
  }
  get purpose(): ApiLeadPurpose {
    return this.props.purpose;
  }
  /** Intenção de pagamento na qualificação — vazio se não informado. */
  get paymentIntents(): ApiLeadPaymentIntent[] {
    return this.props.paymentIntents ?? [];
  }
  get latestFollowUp(): Date | null {
    return this.props.latestFollowUp;
  }
  get nextFollowUp(): Date | null {
    return this.props.nextFollowUp;
  }
  get notes(): string {
    return this.props.notes;
  }
  get photoUrl(): string | null {
    return this.props.photoUrl;
  }
  get propertyName(): string | null {
    return this.props.propertyName;
  }
  get hasSuggestion(): boolean {
    return this.props.hasSuggestion;
  }
  get agentId(): string | null {
    return this.props.agentId;
  }
  get agentIds(): string[] {
    return this.props.agentIds;
  }
  get matchedProperties(): LeadMatchedPropertyProps[] {
    return this.props.matchedProperties;
  }
  get documents(): LeadDocumentProps[] {
    return this.props.documents;
  }
  get activities(): LeadActivityProps[] {
    return this.props.activities;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  protected validate(): void {
    if (!this.props.storeId) throw new Error('storeId is required');
    if (!this.props.name?.trim()) throw new Error('name is required');
  }

  with(patch: Partial<LeadProps>): LeadEntity {
    return LeadEntity.create({ ...this.props, ...patch }, this.id);
  }

  static create(props: LeadProps, id?: string): LeadEntity {
    const entity = new LeadEntity(
      { ...props, paymentIntents: props.paymentIntents ?? [] },
      id,
    );
    entity.validate();
    return entity;
  }
}
