import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { formatAppointmentDate } from '../../../appointments/application/policies/appointment-datetime.policy';
import { SearchRepository, type SearchHitRow } from './search.repository';

type LeadRow = {
  id: string;
  name: string;
  city: string;
  state: string;
  status: string;
};

type PropertyRow = {
  id: string;
  name: string;
  city: string;
  state: string;
};

type AppointmentRow = {
  id: string;
  title: string;
  lead_name: string | null;
  starts_at: Date;
};

type TransactionRow = {
  id: string;
  title: string;
  type: string;
  status: string;
};

@Injectable()
export class PrismaSearchRepository extends SearchRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async search(
    storeId: string,
    tsq: string,
    limit: number,
    agentId?: string,
  ): Promise<SearchHitRow[]> {
    const agentFilterLeads = agentId
      ? Prisma.sql`AND agent_id = ${agentId}`
      : Prisma.empty;
    const agentFilterProps = agentId
      ? Prisma.sql`AND agent_id = ${agentId}`
      : Prisma.empty;
    const agentFilterAppts = agentId
      ? Prisma.sql`AND agent_id = ${agentId}`
      : Prisma.empty;
    const agentFilterTx = agentId
      ? Prisma.sql`AND (captor_id = ${agentId} OR seller_id = ${agentId})`
      : Prisma.empty;

    const [leads, properties, appointments, transactions] = await Promise.all([
      this.prisma.$queryRaw<LeadRow[]>`
        SELECT id, name, city, state, status::text AS status
        FROM imoveis.leads
        WHERE store_id = ${storeId}
          AND search_vector @@ to_tsquery('portuguese', ${tsq})
          ${agentFilterLeads}
        ORDER BY ts_rank_cd(search_vector, to_tsquery('portuguese', ${tsq})) DESC
        LIMIT ${limit}
      `,
      this.prisma.$queryRaw<PropertyRow[]>`
        SELECT id, name, city, state
        FROM imoveis.properties
        WHERE store_id = ${storeId}
          AND search_vector @@ to_tsquery('portuguese', ${tsq})
          ${agentFilterProps}
        ORDER BY ts_rank_cd(search_vector, to_tsquery('portuguese', ${tsq})) DESC
        LIMIT ${limit}
      `,
      this.prisma.$queryRaw<AppointmentRow[]>`
        SELECT id, title, lead_name, starts_at
        FROM imoveis.appointments
        WHERE store_id = ${storeId}
          AND search_vector @@ to_tsquery('portuguese', ${tsq})
          ${agentFilterAppts}
        ORDER BY ts_rank_cd(search_vector, to_tsquery('portuguese', ${tsq})) DESC
        LIMIT ${limit}
      `,
      this.prisma.$queryRaw<TransactionRow[]>`
        SELECT id, title, type::text AS type, status::text AS status
        FROM imoveis.transactions
        WHERE store_id = ${storeId}
          AND search_vector @@ to_tsquery('portuguese', ${tsq})
          ${agentFilterTx}
        ORDER BY ts_rank_cd(search_vector, to_tsquery('portuguese', ${tsq})) DESC
        LIMIT ${limit}
      `,
    ]);

    return [
      ...leads.map(
        (row): SearchHitRow => ({
          id: `lead-${row.id}`,
          type: 'lead',
          title: row.name,
          subtitle: [row.city, row.state].filter(Boolean).join(', ') || null,
          href: `/leads/${row.id}`,
        }),
      ),
      ...properties.map(
        (row): SearchHitRow => ({
          id: `property-${row.id}`,
          type: 'property',
          title: row.name,
          subtitle: [row.city, row.state].filter(Boolean).join(', ') || null,
          href: `/properties/${row.id}`,
        }),
      ),
      ...appointments.map((row): SearchHitRow => {
        const date = formatAppointmentDate(row.starts_at);
        const params = new URLSearchParams({
          date,
          appointmentId: row.id,
        });
        return {
          id: `appointment-${row.id}`,
          type: 'appointment',
          title: row.title,
          subtitle: row.lead_name,
          href: `/calendar?${params.toString()}`,
        };
      }),
      ...transactions.map(
        (row): SearchHitRow => ({
          id: `transaction-${row.id}`,
          type: 'transaction',
          title: row.title,
          subtitle: `${row.type} · ${row.status}`,
          href: `/transactions/${row.id}`,
        }),
      ),
    ];
  }
}
