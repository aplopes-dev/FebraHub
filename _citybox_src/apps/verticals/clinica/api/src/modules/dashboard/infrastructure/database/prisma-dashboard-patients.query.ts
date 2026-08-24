import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { toIsoDateOnly } from '../../../financial/entries/application/utils/financial-entry.utils';
import { resolvePatientSearchFilter } from '../../../patients/domain/utils/patient-search.utils';
import {
  OPEN_APPOINTMENT_STATUSES,
  resolveCurrentMonthRange,
  resolveLastMonthsRange,
} from '../../application/utils/dashboard-patients.dates';
import { buildDashboardPatientSearchWhere } from '../../application/utils/dashboard-patient-search';
import {
  DashboardPatientsQuery,
  type DashboardPatientListItem,
  type DashboardPatientsListCriteria,
  type DashboardPatientsListResult,
  type DashboardPatientsSummary,
} from '../../application/utils/dashboard-patients.types';

type PatientRow = {
  id: string;
  name: string;
  phone: string;
  landlinePhone: string;
  email: string;
  cpf: string | null;
};

@Injectable()
export class PrismaDashboardPatientsQuery extends DashboardPatientsQuery {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getSummary(
    storeId: string,
    now: Date,
  ): Promise<DashboardPatientsSummary> {
    const [
      totalRegisteredCount,
      seenLast6MonthsCount,
      overdueDebtsPatientsCount,
      newSeenThisMonthCount,
      openTreatmentWithoutAppointmentCount,
    ] = await Promise.all([
      this.countTotalRegistered(storeId),
      this.countSeenLast6Months(storeId, now),
      this.countOverdueDebts(storeId, now),
      this.countNewSeenThisMonth(storeId, now),
      this.countOpenTreatmentWithoutAppointment(storeId, now),
    ]);

    return {
      totalRegisteredCount,
      seenLast6MonthsCount,
      overdueDebtsPatientsCount,
      newSeenThisMonthCount,
      openTreatmentWithoutAppointmentCount,
    };
  }

  async listByMetric(
    storeId: string,
    criteria: DashboardPatientsListCriteria,
  ): Promise<DashboardPatientsListResult> {
    switch (criteria.metric) {
      case 'total_registered':
        return this.listTotalRegistered(storeId, criteria);
      case 'seen_last_6_months':
        return this.listSeenLast6Months(storeId, criteria);
      case 'overdue_debts':
        return this.listOverdueDebts(storeId, criteria);
      case 'new_seen_this_month':
        return this.listNewSeenThisMonth(storeId, criteria);
      case 'open_treatment_without_appointment':
        return this.listOpenTreatmentWithoutAppointment(storeId, criteria);
      default: {
        const _exhaustive: never = criteria.metric;
        return _exhaustive;
      }
    }
  }

  private searchWhere(search?: string): Prisma.PatientWhereInput {
    const trimmed = search?.trim();
    if (!trimmed) return {};
    return buildDashboardPatientSearchWhere(trimmed);
  }

  private toListItem(
    row: PatientRow,
    valueCents?: number,
  ): DashboardPatientListItem {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      landlinePhone: row.landlinePhone ?? '',
      email: row.email,
      cpf: row.cpf,
      ...(valueCents !== undefined ? { valueCents } : {}),
    };
  }

  private async countTotalRegistered(storeId: string): Promise<number> {
    return this.prisma.patient.count({
      where: { storeId, status: 'active' },
    });
  }

  private async listTotalRegistered(
    storeId: string,
    criteria: DashboardPatientsListCriteria,
  ): Promise<DashboardPatientsListResult> {
    const where: Prisma.PatientWhereInput = {
      storeId,
      status: 'active',
      ...this.searchWhere(criteria.search),
    };
    const [total, rows] = await Promise.all([
      this.prisma.patient.count({ where }),
      this.prisma.patient.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          landlinePhone: true,
          email: true,
          cpf: true,
        },
        orderBy: { name: 'asc' },
        skip: criteria.skip,
        take: criteria.take,
      }),
    ]);
    return { total, items: rows.map((row) => this.toListItem(row)) };
  }

  private async countSeenLast6Months(
    storeId: string,
    now: Date,
  ): Promise<number> {
    const { startAt, endAt } = resolveLastMonthsRange(now, 6);
    const groups = await this.prisma.appointment.groupBy({
      by: ['patientId'],
      where: {
        storeId,
        status: 'finished',
        startAt: { gte: startAt, lte: endAt },
      },
    });
    return groups.length;
  }

  private async listSeenLast6Months(
    storeId: string,
    criteria: DashboardPatientsListCriteria,
  ): Promise<DashboardPatientsListResult> {
    const { startAt, endAt } = resolveLastMonthsRange(criteria.now, 6);
    return this.listPatientsMatchingIds(
      storeId,
      criteria,
      Prisma.sql`
        SELECT DISTINCT a.patient_id AS id
        FROM clinica.appointments a
        WHERE a.store_id = ${storeId}
          AND a.status = 'finished'
          AND a.start_at >= ${startAt}
          AND a.start_at <= ${endAt}
      `,
    );
  }

  private async countOverdueDebts(storeId: string, now: Date): Promise<number> {
    const todayIso = toIsoDateOnly(now);
    const groups = await this.prisma.financialEntry.groupBy({
      by: ['patientId'],
      where: {
        storeId,
        type: 'income',
        status: 'pending',
        patientId: { not: null },
        dueDate: { lt: new Date(`${todayIso}T00:00:00.000Z`) },
      },
    });
    return groups.filter((g) => g.patientId !== null).length;
  }

  private async listOverdueDebts(
    storeId: string,
    criteria: DashboardPatientsListCriteria,
  ): Promise<DashboardPatientsListResult> {
    const todayIso = toIsoDateOnly(criteria.now);
    const dueBefore = new Date(`${todayIso}T00:00:00.000Z`);
    const searchClause = this.buildRawPatientSearchClause(criteria.search, 'p');

    const countRows = await this.prisma.$queryRaw<Array<{ total: bigint }>>`
      SELECT COUNT(*)::bigint AS total
      FROM (
        SELECT e.patient_id
        FROM clinica.financial_entries e
        INNER JOIN clinica.patients p ON p.id = e.patient_id
        WHERE e.store_id = ${storeId}
          AND e.type = 'income'
          AND e.status = 'pending'
          AND e.patient_id IS NOT NULL
          AND e.due_date < ${dueBefore}
          AND p.store_id = ${storeId}
          ${searchClause}
        GROUP BY e.patient_id
      ) overdue
    `;
    const total = Number(countRows[0]?.total ?? 0);

    const rows = await this.prisma.$queryRaw<
      Array<PatientRow & { value_cents: number }>
    >`
      SELECT
        p.id,
        p.name,
        p.phone,
        p.landline_phone AS "landlinePhone",
        p.email,
        p.cpf,
        SUM(e.value_cents)::int AS value_cents
      FROM clinica.financial_entries e
      INNER JOIN clinica.patients p ON p.id = e.patient_id
      WHERE e.store_id = ${storeId}
        AND e.type = 'income'
        AND e.status = 'pending'
        AND e.patient_id IS NOT NULL
        AND e.due_date < ${dueBefore}
        AND p.store_id = ${storeId}
        ${searchClause}
      GROUP BY p.id, p.name, p.phone, p.landline_phone, p.email, p.cpf
      ORDER BY p.name ASC
      LIMIT ${criteria.take}
      OFFSET ${criteria.skip}
    `;

    return {
      total,
      items: rows.map((row) => this.toListItem(row, row.value_cents)),
    };
  }

  private async countNewSeenThisMonth(
    storeId: string,
    now: Date,
  ): Promise<number> {
    const { startAt, endAt } = resolveCurrentMonthRange(now);
    const rows = await this.prisma.$queryRaw<Array<{ total: bigint }>>`
      SELECT COUNT(*)::bigint AS total
      FROM (
        SELECT a.patient_id
        FROM clinica.appointments a
        WHERE a.store_id = ${storeId}
          AND a.status = 'finished'
        GROUP BY a.patient_id
        HAVING MIN(a.start_at) >= ${startAt}
           AND MIN(a.start_at) <= ${endAt}
      ) first_seen
    `;
    return Number(rows[0]?.total ?? 0);
  }

  private async listNewSeenThisMonth(
    storeId: string,
    criteria: DashboardPatientsListCriteria,
  ): Promise<DashboardPatientsListResult> {
    const { startAt, endAt } = resolveCurrentMonthRange(criteria.now);
    return this.listPatientsMatchingIds(
      storeId,
      criteria,
      Prisma.sql`
        SELECT a.patient_id AS id
        FROM clinica.appointments a
        WHERE a.store_id = ${storeId}
          AND a.status = 'finished'
        GROUP BY a.patient_id
        HAVING MIN(a.start_at) >= ${startAt}
           AND MIN(a.start_at) <= ${endAt}
      `,
    );
  }

  private openStatusSql(): Prisma.Sql {
    return Prisma.join(
      OPEN_APPOINTMENT_STATUSES.map((status) => Prisma.sql`${status}`),
    );
  }

  private async countOpenTreatmentWithoutAppointment(
    storeId: string,
    now: Date,
  ): Promise<number> {
    const openStatuses = this.openStatusSql();
    const rows = await this.prisma.$queryRaw<Array<{ total: bigint }>>`
      SELECT COUNT(DISTINCT pt.patient_id)::bigint AS total
      FROM clinica.patient_treatments pt
      WHERE pt.store_id = ${storeId}
        AND pt.status = 'active'
        AND NOT EXISTS (
          SELECT 1
          FROM clinica.appointments a
          WHERE a.store_id = pt.store_id
            AND a.patient_id = pt.patient_id
            AND a.status IN (${openStatuses})
            AND a.start_at >= ${now}
        )
    `;
    return Number(rows[0]?.total ?? 0);
  }

  private async listOpenTreatmentWithoutAppointment(
    storeId: string,
    criteria: DashboardPatientsListCriteria,
  ): Promise<DashboardPatientsListResult> {
    const openStatuses = this.openStatusSql();
    return this.listPatientsMatchingIds(
      storeId,
      criteria,
      Prisma.sql`
        SELECT DISTINCT pt.patient_id AS id
        FROM clinica.patient_treatments pt
        WHERE pt.store_id = ${storeId}
          AND pt.status = 'active'
          AND NOT EXISTS (
            SELECT 1
            FROM clinica.appointments a
            WHERE a.store_id = pt.store_id
              AND a.patient_id = pt.patient_id
              AND a.status IN (${openStatuses})
              AND a.start_at >= ${criteria.now}
          )
      `,
    );
  }

  private async listPatientsMatchingIds(
    storeId: string,
    criteria: DashboardPatientsListCriteria,
    idSubquery: Prisma.Sql,
  ): Promise<DashboardPatientsListResult> {
    const searchClause = this.buildRawPatientSearchClause(criteria.search, 'p');

    const countRows = await this.prisma.$queryRaw<Array<{ total: bigint }>>`
      SELECT COUNT(*)::bigint AS total
      FROM clinica.patients p
      WHERE p.store_id = ${storeId}
        AND p.id IN (${idSubquery})
        ${searchClause}
    `;
    const total = Number(countRows[0]?.total ?? 0);

    const rows = await this.prisma.$queryRaw<PatientRow[]>`
      SELECT p.id, p.name, p.phone, p.landline_phone AS "landlinePhone", p.email, p.cpf
      FROM clinica.patients p
      WHERE p.store_id = ${storeId}
        AND p.id IN (${idSubquery})
        ${searchClause}
      ORDER BY p.name ASC
      LIMIT ${criteria.take}
      OFFSET ${criteria.skip}
    `;

    return { total, items: rows.map((row) => this.toListItem(row)) };
  }

  private buildRawPatientSearchClause(
    search: string | undefined,
    alias: string,
  ): Prisma.Sql {
    const trimmed = search?.trim();
    if (!trimmed) return Prisma.empty;

    const filter = resolvePatientSearchFilter(trimmed);
    if (filter.type === 'name') {
      const pattern = `%${filter.term}%`;
      return Prisma.sql`AND (
        ${Prisma.raw(alias)}.name ILIKE ${pattern}
        OR ${Prisma.raw(alias)}.email ILIKE ${pattern}
      )`;
    }

    const parts: Prisma.Sql[] = [
      Prisma.sql`${Prisma.raw(alias)}.phone = ${filter.digits}`,
      Prisma.sql`${Prisma.raw(alias)}.landline_phone = ${filter.digits}`,
    ];
    if (filter.digits.length === 11) {
      parts.unshift(
        Prisma.sql`${Prisma.raw(alias)}.cpf = ${filter.digits}`,
      );
    }
    return Prisma.sql`AND (${Prisma.join(parts, ' OR ')})`;
  }
}
