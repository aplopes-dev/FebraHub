import { Injectable } from '@nestjs/common';
import {
  ElectronicSignatureKind,
  ElectronicSignatureStatus,
  Prisma,
} from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  ElectronicSignature,
  type ElectronicSigner,
  type ElectronicSignatureProps,
} from '../../domain/entities/electronic-signature.entity';
import {
  ElectronicSignatureRepository,
  type ElectronicSignaturePatientListCriteria,
  type ElectronicSignaturePatientListResult,
  type ElectronicSignatureReportCriteria,
  type ElectronicSignatureReportResult,
} from '../../domain/repositories/electronic-signature.repository.interface';

type ElectronicSignatureRow = {
  id: string;
  storeId: string;
  patientId: string;
  kind: ElectronicSignatureKind;
  targetId: string | null;
  targetIds: Prisma.JsonValue | null;
  zapsignDocumentToken: string;
  status: ElectronicSignatureStatus;
  originalPdfObjectKey: string;
  signedPdfObjectKey: string | null;
  signers: Prisma.JsonValue;
  requestedById: string;
  requestedByName: string;
  requestedAt: Date;
  completedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaElectronicSignatureRepository extends ElectronicSignatureRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<ElectronicSignature | null> {
    const row = await this.prisma.electronicSignature.findFirst({
      where: { id, storeId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByZapsignToken(
    zapsignDocumentToken: string,
  ): Promise<ElectronicSignature | null> {
    const row = await this.prisma.electronicSignature.findUnique({
      where: { zapsignDocumentToken },
    });
    return row ? this.toEntity(row) : null;
  }

  async findPendingByTarget(
    storeId: string,
    kind: ElectronicSignatureKind,
    targetId: string,
  ): Promise<ElectronicSignature | null> {
    if (kind === 'evolution_batch') {
      return this.findLatestMatchingTargetIds(storeId, kind, targetId, 'pending');
    }

    const row = await this.prisma.electronicSignature.findFirst({
      where: {
        storeId,
        kind,
        targetId,
        status: 'pending',
      },
    });
    return row ? this.toEntity(row) : null;
  }

  async findLatestByTarget(
    storeId: string,
    kind: ElectronicSignatureKind,
    targetId: string,
  ): Promise<ElectronicSignature | null> {
    if (kind === 'evolution_batch') {
      return this.findLatestMatchingTargetIds(storeId, kind, targetId);
    }

    const row = await this.prisma.electronicSignature.findFirst({
      where: {
        storeId,
        kind,
        targetId,
      },
      orderBy: { requestedAt: 'desc' },
    });
    return row ? this.toEntity(row) : null;
  }

  private async findLatestMatchingTargetIds(
    storeId: string,
    kind: ElectronicSignatureKind,
    targetId: string,
    status?: ElectronicSignatureStatus,
  ): Promise<ElectronicSignature | null> {
    const rows = await this.prisma.electronicSignature.findMany({
      where: {
        storeId,
        kind,
        ...(status ? { status } : {}),
      },
      orderBy: { requestedAt: 'desc' },
    });

    for (const row of rows) {
      const ids = this.parseTargetIds(row.targetIds) ?? [];
      if (ids.includes(targetId) || row.targetId === targetId) {
        return this.toEntity(row);
      }
    }
    return null;
  }

  async findPendingOverlappingTargets(
    storeId: string,
    patientId: string,
    targetIds: string[],
  ): Promise<ElectronicSignature | null> {
    if (targetIds.length === 0) return null;

    const rows = await this.prisma.electronicSignature.findMany({
      where: {
        storeId,
        patientId,
        kind: 'evolution_batch',
        status: 'pending',
      },
    });

    const targetSet = new Set(targetIds);
    for (const row of rows) {
      const ids = this.parseTargetIds(row.targetIds) ?? [];
      if (ids.some((id) => targetSet.has(id))) {
        return this.toEntity(row);
      }
    }
    return null;
  }

  async findManyForReport(
    storeId: string,
    criteria: ElectronicSignatureReportCriteria,
  ): Promise<ElectronicSignatureReportResult> {
    const requestedAtGte = new Date(`${criteria.startDate}T00:00:00.000Z`);
    const requestedAtLte = new Date(`${criteria.endDate}T23:59:59.999Z`);

    const baseWhere: Prisma.ElectronicSignatureWhereInput = {
      storeId,
      requestedAt: { gte: requestedAtGte, lte: requestedAtLte },
      ...(criteria.kinds && criteria.kinds.length > 0
        ? { kind: { in: criteria.kinds } }
        : {}),
    };

    const listWhere: Prisma.ElectronicSignatureWhereInput = {
      ...baseWhere,
      ...(criteria.statuses && criteria.statuses.length > 0
        ? { status: { in: criteria.statuses } }
        : {}),
    };

    const [rows, total, grouped] = await Promise.all([
      this.prisma.electronicSignature.findMany({
        where: listWhere,
        include: { patient: { select: { name: true } } },
        orderBy: { requestedAt: 'desc' },
        skip: criteria.skip,
        take: criteria.take,
      }),
      this.prisma.electronicSignature.count({ where: listWhere }),
      this.prisma.electronicSignature.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { _all: true },
      }),
    ]);

    let enviados = 0;
    let pendentes = 0;
    let assinados = 0;
    for (const group of grouped) {
      const count = group._count._all;
      enviados += count;
      if (group.status === 'pending') pendentes = count;
      if (group.status === 'signed') assinados = count;
    }

    return {
      items: rows.map((row) => ({
        signature: this.toEntity(row),
        patientName: row.patient.name,
      })),
      total,
      stats: { enviados, pendentes, assinados },
    };
  }

  async findManyByPatient(
    storeId: string,
    patientId: string,
    criteria: ElectronicSignaturePatientListCriteria,
  ): Promise<ElectronicSignaturePatientListResult> {
    const where = {
      storeId,
      patientId,
      status: criteria.status,
    };

    const [rows, total] = await Promise.all([
      this.prisma.electronicSignature.findMany({
        where,
        orderBy: { requestedAt: 'desc' },
        skip: criteria.skip,
        take: criteria.take,
      }),
      this.prisma.electronicSignature.count({ where }),
    ]);

    return {
      items: rows.map((row) => this.toEntity(row)),
      total,
    };
  }

  async save(signature: ElectronicSignature): Promise<ElectronicSignature> {
    const row = await this.prisma.electronicSignature.upsert({
      where: { id: signature.id },
      create: {
        id: signature.id,
        storeId: signature.storeId,
        patientId: signature.patientId,
        kind: signature.kind,
        targetId: signature.targetId,
        targetIds:
          signature.targetIds === null
            ? Prisma.DbNull
            : signature.targetIds,
        zapsignDocumentToken: signature.zapsignDocumentToken,
        status: signature.status,
        originalPdfObjectKey: signature.originalPdfObjectKey,
        signedPdfObjectKey: signature.signedPdfObjectKey,
        signers: signature.signers,
        requestedById: signature.requestedById,
        requestedByName: signature.requestedByName,
        requestedAt: signature.requestedAt,
        completedAt: signature.completedAt,
        cancelledAt: signature.cancelledAt,
        createdAt: signature.createdAt,
        updatedAt: signature.updatedAt,
      },
      update: {
        status: signature.status,
        signedPdfObjectKey: signature.signedPdfObjectKey,
        signers: signature.signers,
        completedAt: signature.completedAt,
        cancelledAt: signature.cancelledAt,
        updatedAt: signature.updatedAt,
      },
    });
    return this.toEntity(row);
  }

  private toEntity(row: ElectronicSignatureRow): ElectronicSignature {
    const props: ElectronicSignatureProps = {
      storeId: row.storeId,
      patientId: row.patientId,
      kind: row.kind,
      targetId: row.targetId,
      targetIds: this.parseTargetIds(row.targetIds),
      zapsignDocumentToken: row.zapsignDocumentToken,
      status: row.status,
      originalPdfObjectKey: row.originalPdfObjectKey,
      signedPdfObjectKey: row.signedPdfObjectKey,
      signers: this.parseSigners(row.signers),
      requestedById: row.requestedById,
      requestedByName: row.requestedByName,
      requestedAt: row.requestedAt,
      completedAt: row.completedAt,
      cancelledAt: row.cancelledAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return ElectronicSignature.with(props, row.id);
  }

  private parseTargetIds(value: Prisma.JsonValue | null): string[] | null {
    if (value === null) return null;
    if (!Array.isArray(value)) return null;
    return value.filter((item): item is string => typeof item === 'string');
  }

  private parseSigners(value: Prisma.JsonValue): ElectronicSigner[] {
    if (!Array.isArray(value)) return [];
    const result: ElectronicSigner[] = [];
    for (const raw of value) {
      if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        continue;
      }
      const item = raw as Record<string, unknown>;
      result.push({
        role: item.role === 'responsible' ? 'responsible' : 'patient',
        name: typeof item.name === 'string' ? item.name : '',
        email: typeof item.email === 'string' ? item.email : '',
        phone: typeof item.phone === 'string' ? item.phone : '',
        zapsignSignerToken:
          typeof item.zapsignSignerToken === 'string'
            ? item.zapsignSignerToken
            : '',
        signUrl: typeof item.signUrl === 'string' ? item.signUrl : '',
        status:
          item.status === 'signed' ||
          item.status === 'pending' ||
          item.status === 'refused'
            ? item.status
            : 'new',
        signedAt: typeof item.signedAt === 'string' ? item.signedAt : null,
      });
    }
    return result;
  }
}
