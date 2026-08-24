import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infra/prisma/prisma.module';
import { StorageModule } from '../../shared/infra/storage/storage.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { AgentDeviceSessionRepository } from './domain/repositories/agent-device-session.repository.interface';
import { AgentFolderDocumentRepository } from './domain/repositories/agent-folder-document.repository.interface';
import { AgentProfileRepository } from './domain/repositories/agent-profile.repository.interface';
import { StoreSettingsRepository } from './domain/repositories/store-settings.repository.interface';
import { TeamMemberRepository } from './domain/repositories/team-member.repository.interface';
import { PrismaAgentDeviceSessionRepository } from './infrastructure/database/prisma-agent-device-session.repository';
import { PrismaAgentFolderDocumentRepository } from './infrastructure/database/prisma-agent-folder-document.repository';
import { PrismaPortfolioDocumentsReader } from './infrastructure/database/prisma-portfolio-documents.reader';
import { PrismaAgentProfileRepository } from './infrastructure/database/prisma-agent-profile.repository';
import { PrismaStoreSettingsRepository } from './infrastructure/database/prisma-store-settings.repository';
import { PrismaTeamMemberRepository } from './infrastructure/database/prisma-team-member.repository';
import { ChangeAgentPasswordUseCase } from './application/use-cases/change-agent-password/change-agent-password.use-case';
import { CompleteFirstLoginUseCase } from './application/use-cases/complete-first-login/complete-first-login.use-case';
import { CreateTeamMemberUseCase } from './application/use-cases/create-team-member/create-team-member.use-case';
import { DeleteAgentDocumentUseCase } from './application/use-cases/delete-agent-document/delete-agent-document.use-case';
import { DeleteAgentLegalDocumentUseCase } from './application/use-cases/delete-agent-legal-document/delete-agent-legal-document.use-case';
import { DeleteAgentProfilePhotoUseCase } from './application/use-cases/delete-agent-profile-photo/delete-agent-profile-photo.use-case';
import { DeleteAgentSessionUseCase } from './application/use-cases/delete-agent-session/delete-agent-session.use-case';
import { DeleteTeamMemberUseCase } from './application/use-cases/delete-team-member/delete-team-member.use-case';
import { GetAgentDocumentUseCase } from './application/use-cases/get-agent-document/get-agent-document.use-case';
import { GetAgentLegalDocumentUseCase } from './application/use-cases/get-agent-legal-document/get-agent-legal-document.use-case';
import { GetAgentPrivacyUseCase } from './application/use-cases/get-agent-privacy/get-agent-privacy.use-case';
import { GetAgentProfilePhotoUseCase } from './application/use-cases/get-agent-profile-photo/get-agent-profile-photo.use-case';
import { GetAgentProfileUseCase } from './application/use-cases/get-agent-profile/get-agent-profile.use-case';
import { GetStoreBillingUseCase } from './application/use-cases/get-store-billing/get-store-billing.use-case';
import { GetStoreSettingsUseCase } from './application/use-cases/get-store-settings/get-store-settings.use-case';
import { ListAgentDocumentsUseCase } from './application/use-cases/list-agent-documents/list-agent-documents.use-case';
import { ListTeamMembersUseCase } from './application/use-cases/list-team-members/list-team-members.use-case';
import { PutAgentPrivacyUseCase } from './application/use-cases/put-agent-privacy/put-agent-privacy.use-case';
import { PutAgentProfileUseCase } from './application/use-cases/put-agent-profile/put-agent-profile.use-case';
import { PutStoreBillingUseCase } from './application/use-cases/put-store-billing/put-store-billing.use-case';
import { PutStoreNotificationsUseCase } from './application/use-cases/put-store-notifications/put-store-notifications.use-case';
import { PutStoreSettingsUseCase } from './application/use-cases/put-store-settings/put-store-settings.use-case';
import { FindPlatformStoreOwnerUseCase } from './application/use-cases/find-platform-store-owner/find-platform-store-owner.use-case';
import { ResetPlatformStoreOwnerPasswordUseCase } from './application/use-cases/reset-platform-store-owner-password/reset-platform-store-owner-password.use-case';
import { ResetTeamMemberPasswordUseCase } from './application/use-cases/reset-team-member-password/reset-team-member-password.use-case';
import { UpdateAgentDocumentUseCase } from './application/use-cases/update-agent-document/update-agent-document.use-case';
import { UpdateTeamMemberUseCase } from './application/use-cases/update-team-member/update-team-member.use-case';
import { UploadAgentDocumentUseCase } from './application/use-cases/upload-agent-document/upload-agent-document.use-case';
import { UploadAgentProfilePhotoUseCase } from './application/use-cases/upload-agent-profile-photo/upload-agent-profile-photo.use-case';
import { UpsertAgentLegalDocumentUseCase } from './application/use-cases/upsert-agent-legal-document/upsert-agent-legal-document.use-case';
import { ChangeAgentPasswordRoute } from './infrastructure/http/routes/change-agent-password/change-agent-password.route';
import { CompleteFirstLoginRoute } from './infrastructure/http/routes/complete-first-login/complete-first-login.route';
import { CreateTeamMemberRoute } from './infrastructure/http/routes/create-team-member/create-team-member.route';
import { DeleteAgentDocumentRoute } from './infrastructure/http/routes/delete-agent-document/delete-agent-document.route';
import { DeleteAgentLegalDocumentRoute } from './infrastructure/http/routes/delete-agent-legal-document/delete-agent-legal-document.route';
import { DeleteAgentProfilePhotoRoute } from './infrastructure/http/routes/delete-agent-profile-photo/delete-agent-profile-photo.route';
import { DeleteAgentSessionRoute } from './infrastructure/http/routes/delete-agent-session/delete-agent-session.route';
import { DeleteTeamMemberRoute } from './infrastructure/http/routes/delete-team-member/delete-team-member.route';
import { FindPlatformStoreOwnerRoute } from './infrastructure/http/routes/find-platform-store-owner/find-platform-store-owner.route';
import { GetAgentDocumentRoute } from './infrastructure/http/routes/get-agent-document/get-agent-document.route';
import { GetAgentLegalDocumentRoute } from './infrastructure/http/routes/get-agent-legal-document/get-agent-legal-document.route';
import { GetAgentPrivacyRoute } from './infrastructure/http/routes/get-agent-privacy/get-agent-privacy.route';
import { GetAgentProfilePhotoRoute } from './infrastructure/http/routes/get-agent-profile-photo/get-agent-profile-photo.route';
import { GetAgentProfileRoute } from './infrastructure/http/routes/get-agent-profile/get-agent-profile.route';
import { GetStoreBillingRoute } from './infrastructure/http/routes/get-store-billing/get-store-billing.route';
import { GetStoreSettingsRoute } from './infrastructure/http/routes/get-store-settings/get-store-settings.route';
import { ListAgentDocumentsRoute } from './infrastructure/http/routes/list-agent-documents/list-agent-documents.route';
import { ListTeamMembersRoute } from './infrastructure/http/routes/list-team-members/list-team-members.route';
import { PutAgentPrivacyRoute } from './infrastructure/http/routes/put-agent-privacy/put-agent-privacy.route';
import { PutAgentProfileRoute } from './infrastructure/http/routes/put-agent-profile/put-agent-profile.route';
import { PutStoreBillingRoute } from './infrastructure/http/routes/put-store-billing/put-store-billing.route';
import { ResetPlatformStoreOwnerPasswordRoute } from './infrastructure/http/routes/reset-platform-store-owner-password/reset-platform-store-owner-password.route';
import { ResetTeamMemberPasswordRoute } from './infrastructure/http/routes/reset-team-member-password/reset-team-member-password.route';
import { PutStoreNotificationsRoute } from './infrastructure/http/routes/put-store-notifications/put-store-notifications.route';
import { PutStoreSettingsRoute } from './infrastructure/http/routes/put-store-settings/put-store-settings.route';
import { UpdateAgentDocumentRoute } from './infrastructure/http/routes/update-agent-document/update-agent-document.route';
import { UpdateTeamMemberRoute } from './infrastructure/http/routes/update-team-member/update-team-member.route';
import { UploadAgentDocumentRoute } from './infrastructure/http/routes/upload-agent-document/upload-agent-document.route';
import { UploadAgentProfilePhotoRoute } from './infrastructure/http/routes/upload-agent-profile-photo/upload-agent-profile-photo.route';
import { UpsertAgentLegalDocumentRoute } from './infrastructure/http/routes/upsert-agent-legal-document/upsert-agent-legal-document.route';

@Module({
  imports: [PrismaModule, StorageModule, TenancyModule],
  controllers: [
    GetStoreSettingsRoute,
    PutStoreSettingsRoute,
    PutStoreNotificationsRoute,
    GetStoreBillingRoute,
    PutStoreBillingRoute,
    GetAgentProfileRoute,
    PutAgentProfileRoute,
    UploadAgentProfilePhotoRoute,
    GetAgentProfilePhotoRoute,
    DeleteAgentProfilePhotoRoute,
    UpsertAgentLegalDocumentRoute,
    GetAgentLegalDocumentRoute,
    DeleteAgentLegalDocumentRoute,
    GetAgentPrivacyRoute,
    PutAgentPrivacyRoute,
    DeleteAgentSessionRoute,
    ChangeAgentPasswordRoute,
    ListAgentDocumentsRoute,
    UploadAgentDocumentRoute,
    GetAgentDocumentRoute,
    UpdateAgentDocumentRoute,
    DeleteAgentDocumentRoute,
    ListTeamMembersRoute,
    CreateTeamMemberRoute,
    UpdateTeamMemberRoute,
    DeleteTeamMemberRoute,
    CompleteFirstLoginRoute,
    ResetTeamMemberPasswordRoute,
    FindPlatformStoreOwnerRoute,
    ResetPlatformStoreOwnerPasswordRoute,
  ],
  providers: [
    {
      provide: StoreSettingsRepository,
      useClass: PrismaStoreSettingsRepository,
    },
    { provide: AgentProfileRepository, useClass: PrismaAgentProfileRepository },
    {
      provide: AgentDeviceSessionRepository,
      useClass: PrismaAgentDeviceSessionRepository,
    },
    {
      provide: AgentFolderDocumentRepository,
      useClass: PrismaAgentFolderDocumentRepository,
    },
    PrismaPortfolioDocumentsReader,
    { provide: TeamMemberRepository, useClass: PrismaTeamMemberRepository },
    GetStoreSettingsUseCase,
    PutStoreSettingsUseCase,
    PutStoreNotificationsUseCase,
    GetStoreBillingUseCase,
    PutStoreBillingUseCase,
    GetAgentProfileUseCase,
    PutAgentProfileUseCase,
    UploadAgentProfilePhotoUseCase,
    GetAgentProfilePhotoUseCase,
    DeleteAgentProfilePhotoUseCase,
    UpsertAgentLegalDocumentUseCase,
    GetAgentLegalDocumentUseCase,
    DeleteAgentLegalDocumentUseCase,
    GetAgentPrivacyUseCase,
    PutAgentPrivacyUseCase,
    DeleteAgentSessionUseCase,
    ChangeAgentPasswordUseCase,
    ListAgentDocumentsUseCase,
    UploadAgentDocumentUseCase,
    GetAgentDocumentUseCase,
    UpdateAgentDocumentUseCase,
    DeleteAgentDocumentUseCase,
    ListTeamMembersUseCase,
    CreateTeamMemberUseCase,
    UpdateTeamMemberUseCase,
    DeleteTeamMemberUseCase,
    CompleteFirstLoginUseCase,
    ResetTeamMemberPasswordUseCase,
    FindPlatformStoreOwnerUseCase,
    ResetPlatformStoreOwnerPasswordUseCase,
  ],
  exports: [
    StoreSettingsRepository,
    AgentProfileRepository,
    TeamMemberRepository,
    ResetPlatformStoreOwnerPasswordUseCase,
  ],
})
export class SettingsModule {}
