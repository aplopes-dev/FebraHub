import { Prisma } from '../../../../../../generated/prisma/client';

import type { SalesOpportunityListCriteria } from '../../domain/repositories/sales-opportunity.repository';
import {
  isSameCivilDay,
  startOfMonth,
  startOfWeekMonday,
} from '../../domain/sales-opportunity.types';

export function buildOpportunityListWhere(
  storeId: string,
  criteria: Omit<SalesOpportunityListCriteria, 'skip' | 'take'>,
): Prisma.SalesOpportunityWhereInput {
  const where: Prisma.SalesOpportunityWhereInput = { storeId };

  if (criteria.funnelId) where.funnelId = criteria.funnelId;
  else if (criteria.funnelIds?.length) {
    where.funnelId = { in: criteria.funnelIds };
  }
  if (criteria.stageId) where.stageId = criteria.stageId;
  if (criteria.patientId) where.patientId = criteria.patientId;
  if (criteria.labelId) where.labelId = criteria.labelId;
  if (criteria.origin) where.origin = criteria.origin;

  if (criteria.nextContactDate) {
    const day = criteria.nextContactDate;
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);
    where.nextContact = { gte: start, lte: end };
  }

  if (criteria.search?.trim()) {
    const search = criteria.search.trim();
    const digits = search.replace(/\D/g, '');
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { patient: { name: { contains: search, mode: 'insensitive' } } },
      ...(digits.length > 0 ? [{ phone: { contains: digits } }] : []),
    ];
  }

  const period = criteria.period ?? 'all';
  if (period !== 'all') {
    const now = new Date();
    if (period === 'this_week') {
      const from = startOfWeekMonday(now);
      where.AND = [
        ...(Array.isArray(where.AND)
          ? where.AND
          : where.AND
            ? [where.AND]
            : []),
        {
          OR: [
            { lastInteractionAt: { gte: from } },
            {
              AND: [{ lastInteractionAt: null }, { createdAt: { gte: from } }],
            },
          ],
        },
      ];
    } else if (period === 'this_month') {
      const from = startOfMonth(now);
      where.AND = [
        ...(Array.isArray(where.AND)
          ? where.AND
          : where.AND
            ? [where.AND]
            : []),
        {
          OR: [
            { lastInteractionAt: { gte: from } },
            {
              AND: [{ lastInteractionAt: null }, { createdAt: { gte: from } }],
            },
          ],
        },
      ];
    } else if (period === 'custom') {
      // startDate/endDate: instante de meia-noite do DatePicker OU yyyy-MM-dd.
      // Sempre expandimos para o dia civil em America/Sao_Paulo (UTC−3, sem DST).
      const range: Prisma.DateTimeFilter = {};
      const startBound = toBrazilCivilDayStart(criteria.startDate);
      let endBound = toBrazilCivilDayEnd(criteria.endDate);
      // Se o usuário inverter as datas no DatePicker, normaliza o intervalo.
      if (startBound && endBound && startBound > endBound) {
        const swappedStart = toBrazilCivilDayStart(criteria.endDate);
        endBound = toBrazilCivilDayEnd(criteria.startDate);
        if (swappedStart) {
          range.gte = swappedStart;
          if (endBound) range.lte = endBound;
        }
      } else {
        if (startBound) range.gte = startBound;
        if (endBound) range.lte = endBound;
      }
      if (Object.keys(range).length > 0) {
        where.AND = [
          ...(Array.isArray(where.AND)
            ? where.AND
            : where.AND
              ? [where.AND]
              : []),
          {
            OR: [
              { lastInteractionAt: range },
              {
                AND: [{ lastInteractionAt: null }, { createdAt: range }],
              },
            ],
          },
        ];
      }
    }
  }

  return where;
}

/** In-memory period filter (mirrors mock / Prisma logic). */
export function matchesOpportunityPeriod(
  lastInteractionAt: Date | null,
  createdAt: Date,
  criteria: Omit<SalesOpportunityListCriteria, 'skip' | 'take'>,
): boolean {
  const period = criteria.period ?? 'all';
  if (period === 'all') return true;
  const reference = lastInteractionAt ?? createdAt;
  const now = new Date();
  if (period === 'this_week') return reference >= startOfWeekMonday(now);
  if (period === 'this_month') return reference >= startOfMonth(now);
  if (period === 'custom') {
    if (
      criteria.startDate &&
      reference < (toBrazilCivilDayStart(criteria.startDate) as Date)
    ) {
      return false;
    }
    if (
      criteria.endDate &&
      reference > (toBrazilCivilDayEnd(criteria.endDate) as Date)
    ) {
      return false;
    }
    return true;
  }
  return true;
}

/**
 * Interpreta a data do filtro como dia civil em America/Sao_Paulo (UTC−3).
 * Aceita Date (meia-noite local do browser → ISO) ou string `yyyy-MM-dd`.
 */
function civilYmdFromFilter(value: Date | string): {
  y: number;
  m: number;
  d: number;
} | null {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return { y, m, d };
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  // Instantes vindos do DatePicker em BRT são meia-noite local → ISO com hora UTC 3.
  // Usar partes em UTC−3: adicionar 3h e ler UTC Y/M/D.
  const shifted = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth() + 1,
    d: shifted.getUTCDate(),
  };
}

function toBrazilCivilDayStart(value?: Date | string): Date | undefined {
  if (value == null) return undefined;
  const ymd = civilYmdFromFilter(value);
  if (!ymd) return undefined;
  return new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d, 3, 0, 0, 0));
}

function toBrazilCivilDayEnd(value?: Date | string): Date | undefined {
  if (value == null) return undefined;
  const ymd = civilYmdFromFilter(value);
  if (!ymd) return undefined;
  // 23:59:59.999 BRT = 02:59:59.999 UTC do dia seguinte
  return new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d + 1, 2, 59, 59, 999));
}

export function matchesNextContactDate(
  nextContact: Date | null,
  filter?: Date,
): boolean {
  if (!filter) return true;
  if (!nextContact) return false;
  return isSameCivilDay(nextContact, filter);
}
