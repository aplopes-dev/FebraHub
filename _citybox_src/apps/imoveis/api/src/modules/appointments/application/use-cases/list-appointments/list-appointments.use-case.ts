import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { AppointmentEntity } from '../../../domain/entities/appointment.entity';
import {
  AppointmentRepository,
  type ListAppointmentsFilters,
} from '../../../domain/repositories/appointment.repository.interface';
import { parseCsvAppointmentKinds } from '../../../domain/mappers/appointment-enum.mapper';
import {
  civilDateEndExclusiveInBahia,
  civilDateStartInBahia,
} from '../../policies/appointment-datetime.policy';

export type ListAppointmentsInput = {
  storeId: string;
  from: string;
  to: string;
  page?: number;
  perPage?: number;
  agentId?: string;
  excludeAgentId?: string;
  kind?: string[];
  done?: boolean;
};

export type ListAppointmentsOutput = {
  items: AppointmentEntity[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListAppointmentsUseCase implements IUseCase<
  ListAppointmentsInput,
  ListAppointmentsOutput
> {
  constructor(private readonly appointments: AppointmentRepository) {}

  async execute(input: ListAppointmentsInput): Promise<ListAppointmentsOutput> {
    const page = Math.max(1, Number(input.page ?? 1) || 1);
    const perPage = Math.min(
      200,
      Math.max(1, Number(input.perPage ?? 100) || 100),
    );

    let filters: ListAppointmentsFilters;
    try {
      if (!input.from?.trim() || !input.to?.trim()) {
        throw new Error('from and to are required');
      }
      const from = civilDateStartInBahia(input.from.trim());
      const toExclusive = civilDateEndExclusiveInBahia(input.to.trim());
      if (toExclusive.getTime() <= from.getTime()) {
        throw new Error('to must be on or after from');
      }
      filters = {
        page,
        perPage,
        from,
        toExclusive,
        agentId: input.agentId?.trim() || undefined,
        excludeAgentId: input.excludeAgentId?.trim() || undefined,
        kind: parseCsvAppointmentKinds(input.kind),
        done: input.done,
      };
    } catch (err) {
      throw new ValidatorDomainError({
        internalMessage: err instanceof Error ? err.message : 'Invalid filters',
        externalMessage: 'Filtros de listagem inválidos.',
        context: ListAppointmentsUseCase.name,
      });
    }

    const { items, total } = await this.appointments.findMany(
      input.storeId,
      filters,
    );
    const totalPages = Math.max(1, Math.ceil(total / perPage) || 1);

    return { items, total, page, perPage, totalPages };
  }
}
