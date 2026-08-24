import { Injectable } from '@nestjs/common';
import { FinancialEntry } from '../../domain/entities/financial-entry.entity';
import { FinancialEntryRepository } from '../../domain/repositories/financial-entry.repository.interface';
import { FinancialCategoryRepository } from '../../../categories/domain/repositories/financial-category.repository.interface';
import { parseIsoDateOnly } from '../utils/financial-entry.utils';

export type GenerateOnAppointmentCompleteInput = {
  storeId: string;
  appointmentId: string;
  clientId: string;
  clientName?: string | null;
  /** Preço total do agendamento em BRL (Float do domínio Agenda). */
  totalPriceBrl: number;
  /** Data civil `yyyy-MM-dd` (dueDate do lançamento). */
  dueDateIso: string;
  serviceNames: string[];
};

/**
 * Cria lançamento de receita `source=appointment_complete` ao concluir agendamento.
 * Idempotente por `@@unique([storeId, appointmentId])` / `existsByAppointmentId`.
 */
@Injectable()
export class GenerateFinancialEntryOnAppointmentCompleteService {
  constructor(
    private readonly entryRepository: FinancialEntryRepository,
    private readonly categoryRepository: FinancialCategoryRepository,
  ) {}

  async execute(
    input: GenerateOnAppointmentCompleteInput,
  ): Promise<FinancialEntry | null> {
    const exists = await this.entryRepository.existsByAppointmentId(
      input.storeId,
      input.appointmentId,
    );
    if (exists) {
      return null;
    }

    const valueCents = Math.max(0, Math.round(input.totalPriceBrl * 100));
    const incomeCategoryId = await this.resolveDefaultIncomeCategoryId(
      input.storeId,
    );
    const description = this.buildDescription(input);

    const entry = FinancialEntry.create({
      storeId: input.storeId,
      type: 'income',
      status: 'pending',
      source: 'appointment_complete',
      description,
      valueCents,
      dueDate: parseIsoDateOnly(input.dueDateIso),
      clientId: input.clientId,
      appointmentId: input.appointmentId,
      incomeCategoryId,
    });

    return this.entryRepository.save(entry);
  }

  private buildDescription(input: GenerateOnAppointmentCompleteInput): string {
    const services =
      input.serviceNames
        .map((n) => n.trim())
        .filter(Boolean)
        .join(', ') || 'Serviços';
    const client = input.clientName?.trim();
    return client
      ? `${client} - ${services}`
      : `${services}`;
  }

  /** Prefere categoria seed "Serviços"; senão a primeira income da loja. */
  private async resolveDefaultIncomeCategoryId(
    storeId: string,
  ): Promise<string | null> {
    const categories = await this.categoryRepository.findMany(storeId, {
      kind: 'income',
    });
    if (categories.length === 0) return null;
    const preferred = categories.find(
      (c) => c.name.trim().toLowerCase() === 'serviços',
    );
    return preferred?.id ?? categories[0]?.id ?? null;
  }
}
