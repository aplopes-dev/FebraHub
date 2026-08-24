import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { ReportBirthdaysRepository } from '../../domain/repositories/report-birthdays.repository';
import type {
  ListReportBirthdaysCriteria,
  ListReportBirthdaysResult,
  ReportBirthdayRow,
} from '../../domain/report-birthday.types';

type BirthdayRawRow = {
  id: string;
  patient_name: string;
  phone: string;
  landline_phone: string;
  birth_date: Date;
};

@Injectable()
export class PrismaReportBirthdaysRepository extends ReportBirthdaysRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findMany(
    storeId: string,
    criteria: ListReportBirthdaysCriteria,
  ): Promise<ListReportBirthdaysResult> {
    const startDate = criteria.startDate;
    const endDate = criteria.endDate;
    const status = criteria.status;

    const matchSql = Prisma.sql`
      EXISTS (
        SELECT 1
        FROM generate_series(${startDate}::date, ${endDate}::date, INTERVAL '1 day') AS d(day)
        WHERE EXTRACT(MONTH FROM d.day) = EXTRACT(MONTH FROM p.birth_date)
          AND EXTRACT(DAY FROM d.day) = EXTRACT(DAY FROM p.birth_date)
      )
    `;

    const occurrenceSql = Prisma.sql`
      (
        SELECT MIN(d.day)
        FROM generate_series(${startDate}::date, ${endDate}::date, INTERVAL '1 day') AS d(day)
        WHERE EXTRACT(MONTH FROM d.day) = EXTRACT(MONTH FROM p.birth_date)
          AND EXTRACT(DAY FROM d.day) = EXTRACT(DAY FROM p.birth_date)
      )
    `;

    const [rows, countRows] = await Promise.all([
      this.prisma.$queryRaw<BirthdayRawRow[]>`
        SELECT
          p.id,
          p.name AS patient_name,
          p.landline_phone,
          p.phone,
          p.birth_date
        FROM clinica.patients p
        WHERE p.store_id = ${storeId}
          AND p.status::text = ${status}
          AND p.birth_date IS NOT NULL
          AND ${matchSql}
        ORDER BY ${occurrenceSql} ASC NULLS LAST, p.name ASC
        LIMIT ${criteria.take}
        OFFSET ${criteria.skip}
      `,
      this.prisma.$queryRaw<Array<{ total: bigint }>>`
        SELECT COUNT(*)::bigint AS total
        FROM clinica.patients p
        WHERE p.store_id = ${storeId}
          AND p.status::text = ${status}
          AND p.birth_date IS NOT NULL
          AND ${matchSql}
      `,
    ]);

    const total = Number(countRows[0]?.total ?? 0);
    const items: ReportBirthdayRow[] = rows.map((row) => ({
      id: row.id,
      patientName: row.patient_name,
      phone: row.landline_phone ?? '',
      birthDate: row.birth_date.toISOString().slice(0, 10),
      mobile: row.phone ?? '',
    }));

    return { items, total };
  }
}
