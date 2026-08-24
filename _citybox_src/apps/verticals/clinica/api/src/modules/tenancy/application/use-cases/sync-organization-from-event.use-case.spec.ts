import type { StorePlatformEventData } from '@citybox/messaging';
import { SyncOrganizationFromEventUseCase } from './sync-organization-from-event.use-case';
import {
  InMemoryClinicRepository,
  InMemoryOrganizationRepository,
} from '../../tests/in-memory-tenancy.repositories';

const STORE_ID = '11111111-1111-4111-8111-111111111111';

function buildEvent(
  overrides: Partial<StorePlatformEventData> = {},
): StorePlatformEventData {
  return {
    storeId: STORE_ID,
    vertical: 'Clínica',
    tradeName: 'Clínica Demo',
    slug: 'clinica-demo',
    timezone: 'America/Sao_Paulo',
    updatedAt: '2026-08-11T12:00:00.000Z',
    ...overrides,
  };
}

describe('SyncOrganizationFromEventUseCase — clinicStrand', () => {
  it('defaults to odontologia when the event has no strand', async () => {
    const organizations = new InMemoryOrganizationRepository();
    const clinics = new InMemoryClinicRepository();
    const useCase = new SyncOrganizationFromEventUseCase(
      organizations,
      clinics,
    );

    const saved = await useCase.execute(buildEvent());

    expect(saved.clinicStrand).toBe('odontologia');
  });

  it('persists fisioterapia from the event', async () => {
    const organizations = new InMemoryOrganizationRepository();
    const clinics = new InMemoryClinicRepository();
    const useCase = new SyncOrganizationFromEventUseCase(
      organizations,
      clinics,
    );

    const saved = await useCase.execute(
      buildEvent({ clinicStrand: 'fisioterapia' }),
    );

    expect(saved.clinicStrand).toBe('fisioterapia');
  });

  it('does not change clinicStrand on a later store.updated', async () => {
    const organizations = new InMemoryOrganizationRepository();
    const clinics = new InMemoryClinicRepository();
    const useCase = new SyncOrganizationFromEventUseCase(
      organizations,
      clinics,
    );

    await useCase.execute(buildEvent({ clinicStrand: 'fisioterapia' }));
    const updated = await useCase.execute(
      buildEvent({
        clinicStrand: 'odontologia',
        tradeName: 'Clínica Demo Renomeada',
      }),
    );

    expect(updated.clinicStrand).toBe('fisioterapia');
    expect(updated.name).toBe('Clínica Demo Renomeada');
  });
});
