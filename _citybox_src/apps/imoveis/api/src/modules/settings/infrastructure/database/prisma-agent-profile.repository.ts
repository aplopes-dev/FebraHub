import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma, type $Enums } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  AgentProfileEntity,
  type AgentLegalDocument,
  type AgentProfilePhoto,
  type LegalDocKind,
} from '../../domain/entities/agent-profile.entity';
import {
  AgentProfileRepository,
  type AgentProfileWritePayload,
} from '../../domain/repositories/agent-profile.repository.interface';

type AgentProfileRow = Prisma.AgentProfileGetPayload<{
  include: { legalDocuments: true };
}>;

const INCLUDE_DOCUMENTS = {
  legalDocuments: { orderBy: { kind: Prisma.SortOrder.asc } },
} as const;

const EMPTY_PROFILE_FIELDS = {
  name: '',
  role: '',
  email: '',
  phone: '',
  region: '',
  stateId: '',
  taxId: '',
} as const;

@Injectable()
export class PrismaAgentProfileRepository extends AgentProfileRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByAgentId(
    storeId: string,
    agentId: string,
  ): Promise<AgentProfileEntity | null> {
    const row = await this.prisma.agentProfile.findUnique({
      where: { storeId_agentId: { storeId, agentId } },
      include: INCLUDE_DOCUMENTS,
    });
    return row ? this.toEntity(row) : null;
  }

  async ensure(storeId: string, agentId: string): Promise<AgentProfileEntity> {
    const row = await this.prisma.agentProfile.upsert({
      where: { storeId_agentId: { storeId, agentId } },
      create: {
        id: randomUUID(),
        storeId,
        agentId,
        ...EMPTY_PROFILE_FIELDS,
      },
      update: {},
      include: INCLUDE_DOCUMENTS,
    });
    return this.toEntity(row);
  }

  /** Campo `undefined` no payload é ignorado pelo Prisma — update parcial. */
  async upsert(
    storeId: string,
    agentId: string,
    payload: AgentProfileWritePayload,
  ): Promise<AgentProfileEntity> {
    const row = await this.prisma.agentProfile.upsert({
      where: { storeId_agentId: { storeId, agentId } },
      create: {
        id: randomUUID(),
        storeId,
        agentId,
        ...EMPTY_PROFILE_FIELDS,
        ...payload,
      },
      update: { ...payload },
      include: INCLUDE_DOCUMENTS,
    });
    return this.toEntity(row);
  }

  async setTwoFactor(
    storeId: string,
    agentId: string,
    enabled: boolean,
  ): Promise<AgentProfileEntity | null> {
    const existing = await this.prisma.agentProfile.findUnique({
      where: { storeId_agentId: { storeId, agentId } },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await this.prisma.agentProfile.update({
      where: { id: existing.id },
      data: { twoFactorEnabled: enabled },
      include: INCLUDE_DOCUMENTS,
    });
    return this.toEntity(row);
  }

  async setGoogleCalendarCredentials(
    storeId: string,
    agentId: string,
    credentials: {
      googleCalendarEnabled: boolean;
      googleRefreshToken: string | null;
      googleCalendarId?: string | null;
    },
  ): Promise<AgentProfileEntity> {
    const calendarId = credentials.googleCalendarId?.trim() || 'primary';
    const row = await this.prisma.agentProfile.upsert({
      where: { storeId_agentId: { storeId, agentId } },
      create: {
        id: randomUUID(),
        storeId,
        agentId,
        ...EMPTY_PROFILE_FIELDS,
        googleCalendarEnabled: credentials.googleCalendarEnabled,
        googleRefreshToken: credentials.googleRefreshToken,
        googleCalendarId: calendarId,
      },
      update: {
        googleCalendarEnabled: credentials.googleCalendarEnabled,
        googleRefreshToken: credentials.googleRefreshToken,
        googleCalendarId: calendarId,
      },
      include: INCLUDE_DOCUMENTS,
    });
    return this.toEntity(row);
  }

  async delete(storeId: string, agentId: string): Promise<boolean> {
    const { count } = await this.prisma.agentProfile.deleteMany({
      where: { storeId, agentId },
    });
    return count > 0;
  }

  async setPhoto(
    storeId: string,
    agentId: string,
    photo: AgentProfilePhoto | null,
  ): Promise<AgentProfileEntity | null> {
    const existing = await this.prisma.agentProfile.findUnique({
      where: { storeId_agentId: { storeId, agentId } },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await this.prisma.agentProfile.update({
      where: { id: existing.id },
      data: {
        photoObjectKey: photo?.objectKey ?? null,
        photoMimeType: photo?.mimeType ?? null,
      },
      include: INCLUDE_DOCUMENTS,
    });
    return this.toEntity(row);
  }

  async upsertLegalDocument(
    storeId: string,
    agentId: string,
    document: AgentLegalDocument,
  ): Promise<AgentProfileEntity | null> {
    const existing = await this.prisma.agentProfile.findUnique({
      where: { storeId_agentId: { storeId, agentId } },
      select: { id: true },
    });
    if (!existing) return null;

    const data = {
      name: document.name,
      sizeLabel: document.sizeLabel,
      objectKey: document.objectKey,
      mimeType: document.mimeType,
    };

    await this.prisma.agentLegalDocument.upsert({
      where: {
        profileId_kind: {
          profileId: existing.id,
          kind: this.toPrismaKind(document.kind),
        },
      },
      create: {
        id: randomUUID(),
        profileId: existing.id,
        kind: this.toPrismaKind(document.kind),
        ...data,
      },
      update: data,
    });

    return this.findByAgentId(storeId, agentId);
  }

  async removeLegalDocument(
    storeId: string,
    agentId: string,
    kind: LegalDocKind,
  ): Promise<AgentProfileEntity | null> {
    const existing = await this.prisma.agentProfile.findUnique({
      where: { storeId_agentId: { storeId, agentId } },
      select: { id: true },
    });
    if (!existing) return null;

    await this.prisma.agentLegalDocument.deleteMany({
      where: { profileId: existing.id, kind: this.toPrismaKind(kind) },
    });

    return this.findByAgentId(storeId, agentId);
  }

  /** Enum Prisma e domínio compartilham os mesmos literais. */
  private toPrismaKind(kind: LegalDocKind): $Enums.AgentLegalDocKind {
    return kind;
  }

  private toEntity(row: AgentProfileRow): AgentProfileEntity {
    const photo =
      row.photoObjectKey && row.photoMimeType
        ? { objectKey: row.photoObjectKey, mimeType: row.photoMimeType }
        : null;

    return AgentProfileEntity.create(
      {
        storeId: row.storeId,
        agentId: row.agentId,
        name: row.name,
        role: row.role,
        email: row.email,
        phone: row.phone,
        region: row.region,
        stateId: row.stateId,
        taxId: row.taxId,
        twoFactorEnabled: row.twoFactorEnabled,
        googleCalendarEnabled: row.googleCalendarEnabled,
        googleRefreshToken: row.googleRefreshToken,
        googleCalendarId: row.googleCalendarId ?? 'primary',
        photo,
        legalDocuments: row.legalDocuments.map((doc) => ({
          kind: doc.kind,
          name: doc.name,
          sizeLabel: doc.sizeLabel,
          objectKey: doc.objectKey,
          mimeType: doc.mimeType,
        })),
      },
      row.id,
    );
  }
}
