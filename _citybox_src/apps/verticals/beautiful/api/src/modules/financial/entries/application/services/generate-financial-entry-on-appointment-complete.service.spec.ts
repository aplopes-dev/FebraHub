import { FinancialCategory } from '../../../categories/domain/entities/financial-category.entity';
import { InMemoryFinancialCategoryRepository } from '../../../categories/tests/in-memory-financial-category.repository';
import { InMemoryFinancialEntryRepository } from '../../tests/in-memory-financial-entry.repository';
import { GenerateFinancialEntryOnAppointmentCompleteService } from './generate-financial-entry-on-appointment-complete.service';

const STORE_ID = '019c0000-0000-7000-8000-000000000001';

describe('GenerateFinancialEntryOnAppointmentCompleteService', () => {
  let entries: InMemoryFinancialEntryRepository;
  let categories: InMemoryFinancialCategoryRepository;
  let sut: GenerateFinancialEntryOnAppointmentCompleteService;

  beforeEach(() => {
    entries = new InMemoryFinancialEntryRepository();
    categories = new InMemoryFinancialCategoryRepository();
    sut = new GenerateFinancialEntryOnAppointmentCompleteService(
      entries,
      categories,
    );
  });

  it('creates pending income with source appointment_complete', async () => {
    const category = FinancialCategory.create({
      storeId: STORE_ID,
      kind: 'income',
      name: 'Serviços',
      color: '#22C55E',
    });
    categories.seed([category]);

    const entry = await sut.execute({
      storeId: STORE_ID,
      appointmentId: 'appt-1',
      clientId: 'client-1',
      clientName: 'Ana',
      totalPriceBrl: 120.5,
      dueDateIso: '2026-08-12',
      serviceNames: ['Corte', 'Escova'],
    });

    expect(entry).not.toBeNull();
    expect(entry!.source).toBe('appointment_complete');
    expect(entry!.type).toBe('income');
    expect(entry!.status).toBe('pending');
    expect(entry!.valueCents).toBe(12050);
    expect(entry!.appointmentId).toBe('appt-1');
    expect(entry!.clientId).toBe('client-1');
    expect(entry!.incomeCategoryId).toBe(category.id);
    expect(entry!.description).toContain('Corte, Escova');
    expect(entry!.description).toContain('Ana');
  });

  it('is idempotent for the same appointment', async () => {
    const input = {
      storeId: STORE_ID,
      appointmentId: 'appt-dup',
      clientId: 'client-1',
      totalPriceBrl: 80,
      dueDateIso: '2026-08-12',
      serviceNames: ['Corte'],
    };

    const first = await sut.execute(input);
    const second = await sut.execute(input);

    expect(first).not.toBeNull();
    expect(second).toBeNull();
    expect(entries.items).toHaveLength(1);
  });
});
