import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  INDICACOES_REFERRED_BY_UNINFORMED,
  INDICACOES_REFERRED_ORIGIN_SYSTEM_KEYS,
  type IndicacoesPeriodCriteria,
  type IndicacoesReferrerKind,
  type IndicacoesReferrerRow,
  type IndicacoesReferredPatientRow,
  type ListIndicacoesReferrersCriteria,
  type ListIndicacoesReferredPatientsCriteria,
  type PaginatedIndicacoesResult,
} from '../../domain/indicacoes.types';
import { mapFirstAppointmentStatus } from '../../domain/map-first-appointment-status';
import { IndicacoesRepository } from '../../domain/repositories/indicacoes.repository';
import { parseCivilDate } from '../../../../reports/domain/utils/birthday-civil-range';

function toInclusiveEnd(endDate: string): Date {
  return new Date(`${endDate}T23:59:59.999Z`);
}

function formatCivilDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function referredPatientsWhere(
  storeId: string,
  criteria: IndicacoesPeriodCriteria & {
    referrerKind?: IndicacoesReferrerKind;
    referrerId?: string;
  },
): Prisma.PatientWhereInput {
  const where: Prisma.PatientWhereInput = {
    storeId,
    createdAt: {
      gte: parseCivilDate(criteria.startDate),
      lte: toInclusiveEnd(criteria.endDate),
    },
    referralOrigin: {
      systemKey: {
        in: [...INDICACOES_REFERRED_ORIGIN_SYSTEM_KEYS],
      },
    },
  };

  if (criteria.referrerKind && criteria.referrerId) {
    if (criteria.referrerKind === 'patient') {
      return { ...where, referredByPatientId: criteria.referrerId };
    }
    if (criteria.referrerKind === 'team') {
      return { ...where, referredByMemberId: criteria.referrerId };
    }
    return {
      ...where,
      referredByExternalProfessionalId: criteria.referrerId,
    };
  }

  return where;
}

function resolveReferredBy(row: {
  referredByPatient: { name: string } | null;
  referredByMemberName: string | null;
  referredByExternalProfessional: { name: string } | null;
}): string {
  return (
    row.referredByPatient?.name?.trim() ||
    row.referredByMemberName?.trim() ||
    row.referredByExternalProfessional?.name?.trim() ||
    INDICACOES_REFERRED_BY_UNINFORMED
  );
}

type ReferrerAggKey = string;

function buildReferrerKey(input: {
  referredByPatientId: string | null;
  referredByMemberId: string | null;
  referredByExternalProfessionalId: string | null;
}): { key: ReferrerAggKey; kind: IndicacoesReferrerKind; id: string } | null {
  if (input.referredByPatientId) {
    return {
      key: `patient:${input.referredByPatientId}`,
      kind: 'patient',
      id: input.referredByPatientId,
    };
  }
  if (input.referredByMemberId) {
    return {
      key: `team:${input.referredByMemberId}`,
      kind: 'team',
      id: input.referredByMemberId,
    };
  }
  if (input.referredByExternalProfessionalId) {
    return {
      key: `external:${input.referredByExternalProfessionalId}`,
      kind: 'external',
      id: input.referredByExternalProfessionalId,
    };
  }
  return null;
}

@Injectable()
export class PrismaIndicacoesRepository extends IndicacoesRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getKpis(
    storeId: string,
    criteria: IndicacoesPeriodCriteria,
  ): Promise<{
    totalReferrals: number;
    approvedBudgetsValueCents: number;
    withoutScheduledAppointment: number;
  }> {
    const where = referredPatientsWhere(storeId, criteria);

    const patients = await this.prisma.patient.findMany({
      where,
      select: {
        id: true,
        appointments: {
          where: {
            status: { notIn: ['cancelled_patient', 'cancelled_pro'] },
          },
          orderBy: { startAt: 'asc' },
          take: 1,
          select: { status: true },
        },
      },
    });

    const patientIds = patients.map((row) => row.id);
    const withoutScheduledAppointment = patients.filter(
      (row) =>
        mapFirstAppointmentStatus(row.appointments[0]?.status) ===
        'nao_realizada',
    ).length;

    let approvedBudgetsValueCents = 0;
    if (patientIds.length > 0) {
      const aggregate = await this.prisma.budget.aggregate({
        where: {
          storeId,
          status: 'approved',
          patientId: { in: patientIds },
        },
        _sum: { finalValueCents: true },
      });
      approvedBudgetsValueCents = aggregate._sum.finalValueCents ?? 0;
    }

    return {
      totalReferrals: patients.length,
      approvedBudgetsValueCents,
      withoutScheduledAppointment,
    };
  }

  async listYears(storeId: string): Promise<number[]> {
    const yearRows = await this.prisma.$queryRaw<Array<{ year: number }>>`
      SELECT DISTINCT EXTRACT(YEAR FROM p.created_at AT TIME ZONE 'UTC')::int AS year
      FROM clinica.patients p
      INNER JOIN clinica.patient_referral_origins o ON o.id = p.referral_origin_id
      WHERE p.store_id = ${storeId}
        AND o.system_key IN (
          'indicacao',
          'indicacao_profissional',
          'indicacao_profissional_externo'
        )
      ORDER BY year DESC
    `;

    return yearRows.map((row) => row.year);
  }

  async listReferredPatients(
    storeId: string,
    criteria: ListIndicacoesReferredPatientsCriteria,
  ): Promise<PaginatedIndicacoesResult<IndicacoesReferredPatientRow>> {
    const where = referredPatientsWhere(storeId, criteria);
    const orderBy: Prisma.PatientOrderByWithRelationInput[] = [
      { createdAt: criteria.sortOrder },
      { id: criteria.sortOrder },
    ];

    const [rows, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        orderBy,
        skip: criteria.skip,
        take: criteria.take,
        select: {
          id: true,
          name: true,
          phone: true,
          createdAt: true,
          referredByMemberName: true,
          referredByPatient: { select: { name: true } },
          referredByExternalProfessional: { select: { name: true } },
          _count: {
            select: {
              budgets: { where: { status: 'approved' } },
            },
          },
          appointments: {
            where: {
              status: { notIn: ['cancelled_patient', 'cancelled_pro'] },
            },
            orderBy: { startAt: 'asc' },
            take: 1,
            select: { startAt: true, status: true },
          },
        },
      }),
      this.prisma.patient.count({ where }),
    ]);

    const items: IndicacoesReferredPatientRow[] = rows.map((row) => {
      const first = row.appointments[0] ?? null;
      return {
        id: row.id,
        name: row.name,
        phone: row.phone,
        referredBy: resolveReferredBy(row),
        referralDate: formatCivilDate(row.createdAt),
        firstAppointmentDate: first?.startAt
          ? formatCivilDate(first.startAt)
          : null,
        firstAppointmentStatus: mapFirstAppointmentStatus(first?.status),
        approvedBudgetsCount: row._count.budgets,
      };
    });

    return { items, total };
  }

  async listReferrers(
    storeId: string,
    criteria: ListIndicacoesReferrersCriteria,
  ): Promise<PaginatedIndicacoesResult<IndicacoesReferrerRow>> {
    const where = referredPatientsWhere(storeId, criteria);

    const rows = await this.prisma.patient.findMany({
      where,
      select: {
        referredByPatientId: true,
        referredByMemberId: true,
        referredByMemberName: true,
        referredByExternalProfessionalId: true,
        referredByPatient: { select: { id: true, name: true, phone: true } },
        referredByExternalProfessional: {
          select: { id: true, name: true, phone: true },
        },
        _count: {
          select: {
            budgets: { where: { status: 'approved' } },
          },
        },
      },
    });

    const aggregates = new Map<
      ReferrerAggKey,
      {
        id: string;
        name: string;
        phone: string;
        kind: IndicacoesReferrerKind;
        totalReferrals: number;
        approvedBudgetsCount: number;
      }
    >();

    for (const row of rows) {
      const identity = buildReferrerKey(row);
      if (!identity) continue;

      const existing = aggregates.get(identity.key);
      const name =
        identity.kind === 'patient'
          ? row.referredByPatient?.name?.trim() || INDICACOES_REFERRED_BY_UNINFORMED
          : identity.kind === 'external'
            ? row.referredByExternalProfessional?.name?.trim() ||
              INDICACOES_REFERRED_BY_UNINFORMED
            : row.referredByMemberName?.trim() || INDICACOES_REFERRED_BY_UNINFORMED;
      const phone =
        identity.kind === 'patient'
          ? row.referredByPatient?.phone ?? ''
          : identity.kind === 'external'
            ? row.referredByExternalProfessional?.phone ?? ''
            : '';

      if (existing) {
        existing.totalReferrals += 1;
        existing.approvedBudgetsCount += row._count.budgets;
        continue;
      }

      aggregates.set(identity.key, {
        id: identity.id,
        name,
        phone,
        kind: identity.kind,
        totalReferrals: 1,
        approvedBudgetsCount: row._count.budgets,
      });
    }

    const sorted = [...aggregates.values()].sort((a, b) => {
      const left = a[criteria.sortBy];
      const right = b[criteria.sortBy];
      const cmp = left - right;
      if (cmp !== 0) {
        return criteria.sortOrder === 'asc' ? cmp : -cmp;
      }
      return a.name.localeCompare(b.name, 'pt-BR');
    });

    const total = sorted.length;
    const items = sorted.slice(criteria.skip, criteria.skip + criteria.take);

    return { items, total };
  }
}
