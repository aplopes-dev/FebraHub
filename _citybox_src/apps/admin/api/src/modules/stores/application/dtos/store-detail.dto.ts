import type { StoreStatus } from '../../domain/entities/store.entity';

export interface UpdateStoreSettingsDto {
  id: string;
  maintenanceMode: boolean;
  visibleInApp: boolean;
  status: StoreStatus;
  trialEndsAt?: string;
  sefazHomologacao: boolean;
  contingenciaOffline: boolean;
  actor: string;
}

export interface UpdateStoreModuleDto {
  storeId: string;
  moduleKey: string;
  enabled: boolean;
  actor: string;
}

export interface UpsertStoreMemberDto {
  storeId: string;
  memberId?: string;
  firstName: string;
  lastName: string;
  username: string;
  email?: string;
  role: string;
  permissions: string[];
  generateProvisionalPassword?: boolean;
  sendInviteEmail?: boolean;
  actor: string;
}

export interface DeleteStoreMemberDto {
  storeId: string;
  memberId: string;
  actor: string;
}

export interface CreateStoreMembersBatchItemDto {
  memberId: string;
  role: string;
  permissions: string[];
}

export interface CreateStoreMembersBatchDto {
  storeId: string;
  members: CreateStoreMembersBatchItemDto[];
  actor: string;
}

export interface ListStoreAuditLogDto {
  storeId: string;
  page?: number;
  perPage?: number;
  severity?: Array<'info' | 'aviso' | 'erro' | 'critico'>;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}
