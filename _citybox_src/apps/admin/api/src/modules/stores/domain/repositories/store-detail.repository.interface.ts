import type { StoreVertical } from '../entities/store.entity';

export type StoreTerminalRow = {
  id: string;
  label: string;
  status: 'online' | 'offline';
};

export type StoreErrorRow = {
  id: string;
  occurredAt: Date;
  message: string;
  severity: 'warning' | 'error';
};

export type StoreMemberRow = {
  id: string;
  keycloakSub: string;
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  hasPassword: boolean;
  disabledAt: Date | null;
  provisionalExpiresAt: Date | null;
};

export type StoreModuleRow = {
  id: string;
  moduleKey: string;
  label: string;
  enabled: boolean;
  description: string;
};

export type StoreIntegrationRow = {
  id: string;
  integrationKey: string;
  label: string;
  status: 'connected' | 'disconnected' | 'error';
};

export type StoreAuditEventRow = {
  id: string;
  occurredAt: Date;
  severity: 'info' | 'aviso' | 'erro' | 'critico';
  actor: string;
  actorRole: string | null;
  module: string;
  action: string;
  details: string | null;
};

export type StoreDetailRelatedRows = {
  terminals: StoreTerminalRow[];
  errors: StoreErrorRow[];
  members: StoreMemberRow[];
  modules: StoreModuleRow[];
  integrations: StoreIntegrationRow[];
};

export type StoreAuditLogCriteria = {
  storeId: string;
  skip?: number;
  take?: number;
  severity?: Array<'info' | 'aviso' | 'erro' | 'critico'>;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export type RecordStoreAuditEventInput = {
  storeId: string;
  severity?: 'info' | 'aviso' | 'erro' | 'critico';
  actor: string;
  actorRole?: string;
  module: string;
  action: string;
  details?: string;
};

export type UpsertStoreMemberInput = {
  storeId: string;
  keycloakSub: string;
  username: string;
  email?: string | null;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  hasPassword?: boolean;
  provisionalExpiresAt?: Date | null;
};

/**
 * Identidade global de membro (por e-mail/username). Não carrega mais `clientId`: desde a
 * Fase 10 a existência dessa identidade em OUTRA loja é motivo de recusa, não de
 * reaproveitamento — cada loja é um cliente independente.
 */
export type GlobalMemberLookupResult = {
  id: string;
  keycloakSub: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  hasPassword: boolean;
};

export abstract class StoreDetailRepository {
  abstract ensureCatalog(
    storeId: string,
    vertical: StoreVertical,
  ): Promise<void>;
  abstract findRelatedByStoreId(
    storeId: string,
    vertical: StoreVertical,
  ): Promise<StoreDetailRelatedRows>;
  abstract updateModuleEnabled(
    storeId: string,
    moduleKey: string,
    enabled: boolean,
  ): Promise<void>;
  abstract listMembers(storeId: string): Promise<StoreMemberRow[]>;
  abstract findMemberById(
    storeId: string,
    memberId: string,
  ): Promise<StoreMemberRow | null>;
  abstract findMemberByStoreAndSub(
    storeId: string,
    keycloakSub: string,
  ): Promise<StoreMemberRow | null>;
  abstract findMemberByEmailOrUsername(
    email?: string,
    username?: string,
  ): Promise<GlobalMemberLookupResult | null>;
  abstract findGlobalMemberById(
    memberId: string,
  ): Promise<GlobalMemberLookupResult | null>;
  abstract createMember(input: UpsertStoreMemberInput): Promise<StoreMemberRow>;
  abstract updateMember(
    storeId: string,
    memberId: string,
    input: Omit<
      UpsertStoreMemberInput,
      'storeId' | 'keycloakSub' | 'username' | 'email'
    >,
  ): Promise<StoreMemberRow>;
  abstract markMemberHasPassword(
    storeId: string,
    memberId: string,
  ): Promise<StoreMemberRow>;
  abstract setMemberDisabled(
    storeId: string,
    memberId: string,
    disabledAt: Date | null,
  ): Promise<StoreMemberRow>;
  abstract setMemberProvisionalExpiresAt(
    storeId: string,
    memberId: string,
    provisionalExpiresAt: Date | null,
  ): Promise<StoreMemberRow>;
  abstract deleteMember(storeId: string, memberId: string): Promise<void>;
  abstract recordAuditEvent(input: RecordStoreAuditEventInput): Promise<void>;
  abstract listAuditEvents(criteria: StoreAuditLogCriteria): Promise<{
    items: StoreAuditEventRow[];
    total: number;
  }>;
}
