import { Entity } from '../../../../shared/core/entity';

/** Documentos legais exigidos do corretor — 1 arquivo por tipo. */
export const LEGAL_DOC_KINDS = ['license', 'employment', 'insurance'] as const;

export type LegalDocKind = (typeof LEGAL_DOC_KINDS)[number];

export function isLegalDocKind(value: string): value is LegalDocKind {
  return (LEGAL_DOC_KINDS as readonly string[]).includes(value);
}

export type AgentLegalDocument = {
  kind: LegalDocKind;
  name: string;
  sizeLabel: string;
  objectKey: string;
  mimeType: string;
};

export type AgentProfilePhoto = {
  objectKey: string;
  mimeType: string;
};

export type AgentProfileProps = {
  storeId: string;
  agentId: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  region: string;
  stateId: string;
  taxId: string;
  photo: AgentProfilePhoto | null;
  legalDocuments: readonly AgentLegalDocument[];
  twoFactorEnabled: boolean;
  googleCalendarEnabled: boolean;
  /** Token OAuth offline — nunca serializar em HTTP. */
  googleRefreshToken: string | null;
  googleCalendarId: string;
};

export class AgentProfileEntity extends Entity<AgentProfileProps> {
  get storeId(): string {
    return this.props.storeId;
  }
  get agentId(): string {
    return this.props.agentId;
  }
  get name(): string {
    return this.props.name;
  }
  get role(): string {
    return this.props.role;
  }
  get email(): string {
    return this.props.email;
  }
  get phone(): string {
    return this.props.phone;
  }
  get region(): string {
    return this.props.region;
  }
  get stateId(): string {
    return this.props.stateId;
  }
  get taxId(): string {
    return this.props.taxId;
  }
  get photo(): AgentProfilePhoto | null {
    return this.props.photo;
  }
  get legalDocuments(): readonly AgentLegalDocument[] {
    return this.props.legalDocuments;
  }
  get twoFactorEnabled(): boolean {
    return this.props.twoFactorEnabled;
  }
  get googleCalendarEnabled(): boolean {
    return this.props.googleCalendarEnabled;
  }
  get googleRefreshToken(): string | null {
    return this.props.googleRefreshToken;
  }
  get googleCalendarId(): string {
    return this.props.googleCalendarId;
  }
  /** Tem refresh token válido para sync. */
  get googleCalendarConnected(): boolean {
    return Boolean(this.props.googleRefreshToken?.trim());
  }

  findLegalDocument(kind: LegalDocKind): AgentLegalDocument | null {
    return this.props.legalDocuments.find((doc) => doc.kind === kind) ?? null;
  }

  protected validate(): void {
    if (!this.props.storeId) throw new Error('storeId is required');
    if (!this.props.agentId) throw new Error('agentId is required');
  }

  with(patch: Partial<AgentProfileProps>): AgentProfileEntity {
    return AgentProfileEntity.create({ ...this.props, ...patch }, this.id);
  }

  static create(props: AgentProfileProps, id?: string): AgentProfileEntity {
    const entity = new AgentProfileEntity(
      {
        ...props,
        photo: props.photo ? { ...props.photo } : null,
        legalDocuments: props.legalDocuments.map((doc) => ({ ...doc })),
        googleCalendarId: props.googleCalendarId?.trim() || 'primary',
        googleRefreshToken: props.googleRefreshToken?.trim() || null,
      },
      id,
    );
    entity.validate();
    return entity;
  }

  /** Perfil recém-criado — o corretor ainda não preencheu nada. */
  static empty(storeId: string, agentId: string): AgentProfileEntity {
    return AgentProfileEntity.create({
      storeId,
      agentId,
      name: '',
      role: '',
      email: '',
      phone: '',
      region: '',
      stateId: '',
      taxId: '',
      photo: null,
      legalDocuments: [],
      twoFactorEnabled: false,
      googleCalendarEnabled: false,
      googleRefreshToken: null,
      googleCalendarId: 'primary',
    });
  }
}
