import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  SearchRepository,
  type SearchHitRow,
  type SearchScope,
} from './search.repository';

type PatientRow = {
  id: string;
  name: string;
  phone: string;
  cpf: string | null;
};

type AppointmentRow = {
  id: string;
  patient_name: string;
  professional_name: string | null;
  start_at: Date;
  duration_min: number;
};

type OpportunityRow = {
  id: string;
  title: string;
  phone: string | null;
  origin: string | null;
};

type StockProductRow = {
  id: string;
  name: string;
  category: string;
  sku: string | null;
};

function formatAppointmentDateParam(startAt: Date): string {
  return startAt.toISOString().slice(0, 10);
}

@Injectable()
export class PrismaSearchRepository extends SearchRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async search(
    storeId: string,
    tsq: string,
    limit: number,
    scope: SearchScope,
  ): Promise<SearchHitRow[]> {
    const tasks: Array<Promise<SearchHitRow[]>> = [];

    if (scope.includePatients) {
      tasks.push(this.searchPatients(storeId, tsq, limit));
    }
    if (scope.includeAppointments) {
      tasks.push(
        this.searchAppointments(storeId, tsq, limit, scope.professionalIds),
      );
    }
    if (scope.includeOpportunities) {
      if (
        scope.visibleFunnelIds === undefined ||
        scope.visibleFunnelIds.length > 0
      ) {
        tasks.push(
          this.searchOpportunities(storeId, tsq, limit, scope.visibleFunnelIds),
        );
      }
    }
    if (scope.includeStock) {
      tasks.push(this.searchStockProducts(storeId, tsq, limit));
    }

    const chunks = await Promise.all(tasks);
    return chunks.flat();
  }

  private async searchPatients(
    storeId: string,
    tsq: string,
    limit: number,
  ): Promise<SearchHitRow[]> {
    const rows = await this.prisma.$queryRaw<PatientRow[]>`
      SELECT id, name, phone, cpf
      FROM clinica.patients
      WHERE store_id = ${storeId}
        AND search_vector @@ to_tsquery('portuguese', ${tsq})
      ORDER BY ts_rank_cd(search_vector, to_tsquery('portuguese', ${tsq})) DESC
      LIMIT ${limit}
    `;

    return rows.map(
      (row): SearchHitRow => ({
        id: `patient-${row.id}`,
        type: 'patient',
        title: row.name,
        subtitle:
          [row.phone, row.cpf].filter(Boolean).join(' · ') || null,
        href: `/pacientes/${row.id}/sobre`,
      }),
    );
  }

  private async searchAppointments(
    storeId: string,
    tsq: string,
    limit: number,
    professionalIds?: string[],
  ): Promise<SearchHitRow[]> {
    const professionalFilter =
      professionalIds && professionalIds.length > 0
        ? Prisma.sql`AND a.professional_id IN (${Prisma.join(professionalIds)})`
        : Prisma.empty;

    const rows = await this.prisma.$queryRaw<AppointmentRow[]>`
      SELECT
        a.id,
        p.name AS patient_name,
        NULLIF(TRIM(CONCAT(m.first_name, ' ', m.last_name)), '') AS professional_name,
        a.start_at,
        a.duration_min
      FROM clinica.appointments a
      INNER JOIN clinica.patients p ON p.id = a.patient_id
      LEFT JOIN clinica.members m ON m.id = a.professional_id
      WHERE a.store_id = ${storeId}
        AND a.search_vector @@ to_tsquery('portuguese', ${tsq})
        ${professionalFilter}
      ORDER BY ts_rank_cd(a.search_vector, to_tsquery('portuguese', ${tsq})) DESC
      LIMIT ${limit}
    `;

    return rows.map((row): SearchHitRow => {
      const dateParam = formatAppointmentDateParam(row.start_at);
      const params = new URLSearchParams({
        date: dateParam,
        appointmentId: row.id,
      });
      const when =
        `${dateParam}${row.duration_min ? ` · ${row.duration_min} min` : ''}`;
      return {
        id: `appointment-${row.id}`,
        type: 'appointment',
        title: row.patient_name,
        subtitle:
          [row.professional_name, when].filter(Boolean).join(' · ') || null,
        href: `/agenda?${params.toString()}`,
      };
    });
  }

  private async searchOpportunities(
    storeId: string,
    tsq: string,
    limit: number,
    visibleFunnelIds?: string[],
  ): Promise<SearchHitRow[]> {
    const funnelFilter =
      visibleFunnelIds && visibleFunnelIds.length > 0
        ? Prisma.sql`AND funnel_id IN (${Prisma.join(visibleFunnelIds)})`
        : Prisma.empty;

    const rows = await this.prisma.$queryRaw<OpportunityRow[]>`
      SELECT id, title, phone, origin::text AS origin
      FROM clinica.sales_opportunities
      WHERE store_id = ${storeId}
        AND search_vector @@ to_tsquery('portuguese', ${tsq})
        ${funnelFilter}
      ORDER BY ts_rank_cd(search_vector, to_tsquery('portuguese', ${tsq})) DESC
      LIMIT ${limit}
    `;

    return rows.map((row): SearchHitRow => {
      const params = new URLSearchParams({ opportunityId: row.id });
      return {
        id: `opportunity-${row.id}`,
        type: 'opportunity',
        title: row.title,
        subtitle:
          [row.phone, row.origin].filter(Boolean).join(' · ') || null,
        href: `/vendas?${params.toString()}`,
      };
    });
  }

  private async searchStockProducts(
    storeId: string,
    tsq: string,
    limit: number,
  ): Promise<SearchHitRow[]> {
    const rows = await this.prisma.$queryRaw<StockProductRow[]>`
      SELECT id, name, category, sku
      FROM clinica.stock_products
      WHERE store_id = ${storeId}
        AND search_vector @@ to_tsquery('portuguese', ${tsq})
      ORDER BY ts_rank_cd(search_vector, to_tsquery('portuguese', ${tsq})) DESC
      LIMIT ${limit}
    `;

    return rows.map(
      (row): SearchHitRow => ({
        id: `stock_product-${row.id}`,
        type: 'stock_product',
        title: row.name,
        subtitle:
          [row.category, row.sku].filter(Boolean).join(' · ') || null,
        href: '/estoque',
      }),
    );
  }
}
