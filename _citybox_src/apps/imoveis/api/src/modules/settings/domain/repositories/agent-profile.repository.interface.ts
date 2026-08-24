import type {
  AgentLegalDocument,
  AgentProfileEntity,
  AgentProfilePhoto,
  LegalDocKind,
} from '../entities/agent-profile.entity';

/** Update parcial — campo ausente não é tocado (PUT do web envia só o que mudou). */
export type AgentProfileWritePayload = {
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
  region?: string;
  stateId?: string;
  taxId?: string;
};

export type GoogleCalendarCredentialsWrite = {
  googleCalendarEnabled: boolean;
  googleRefreshToken: string | null;
  googleCalendarId?: string | null;
};

export abstract class AgentProfileRepository {
  /** `null` quando o corretor ainda não tem perfil salvo na loja. */
  abstract findByAgentId(
    storeId: string,
    agentId: string,
  ): Promise<AgentProfileEntity | null>;

  /** Get-or-create — devolve perfil vazio persistido quando não existe. */
  abstract ensure(
    storeId: string,
    agentId: string,
  ): Promise<AgentProfileEntity>;

  /**
   * Grava apenas os campos textuais informados; foto e documentos têm rotas
   * próprias.
   */
  abstract upsert(
    storeId: string,
    agentId: string,
    payload: AgentProfileWritePayload,
  ): Promise<AgentProfileEntity>;

  /** `null` remove a referência da foto. Resolve `null` se o perfil sumiu. */
  abstract setPhoto(
    storeId: string,
    agentId: string,
    photo: AgentProfilePhoto | null,
  ): Promise<AgentProfileEntity | null>;

  abstract upsertLegalDocument(
    storeId: string,
    agentId: string,
    document: AgentLegalDocument,
  ): Promise<AgentProfileEntity | null>;

  abstract removeLegalDocument(
    storeId: string,
    agentId: string,
    kind: LegalDocKind,
  ): Promise<AgentProfileEntity | null>;

  /** Resolve `null` se o perfil não existe na loja. */
  abstract setTwoFactor(
    storeId: string,
    agentId: string,
    enabled: boolean,
  ): Promise<AgentProfileEntity | null>;

  /** OAuth Google Calendar (token offline). Garante perfil se não existir. */
  abstract setGoogleCalendarCredentials(
    storeId: string,
    agentId: string,
    credentials: GoogleCalendarCredentialsWrite,
  ): Promise<AgentProfileEntity>;

  /** Remove o perfil e seus documentos legais (cascade). */
  abstract delete(storeId: string, agentId: string): Promise<boolean>;
}
