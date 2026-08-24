import { describe, expect, it, vi } from 'vitest';
import { clinicaFetch } from '@/features/clinic/shared/api/clinica-client';
import { getCalendar } from '@/features/clinic/agenda/api/calendar';
import { listCategories } from '@/features/clinic/agenda/api/categories';

vi.mock('@/features/clinic/shared/api/clinica-client', () => ({
  clinicaFetch: vi.fn(),
}));

const STORE_ID = '11111111-1111-4111-8111-111111111111';

describe('agenda calendar api', () => {
  it('loads calendar range from clinica-api', async () => {
    const payload = { appointments: [], schedules: [] };
    vi.mocked(clinicaFetch).mockResolvedValueOnce(payload);

    const result = await getCalendar(STORE_ID, {
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      professionalIds: ['prof-1', 'prof-2'],
    });

    expect(clinicaFetch).toHaveBeenCalledWith(
      STORE_ID,
      '/v1/appointments/calendar?startDate=2026-07-01&endDate=2026-07-31&professionalIds=prof-1%2Cprof-2',
    );
    expect(result).toEqual(payload);
  });
});

describe('agenda categories api', () => {
  it('maps clinicId from store scope', async () => {
    vi.mocked(clinicaFetch).mockResolvedValueOnce({
      data: [
        {
          id: 'cat-1',
          name: 'Consulta',
          color: 'blue',
          appointmentCount: 2,
          createdAt: '2026-07-01T00:00:00.000Z',
          updatedAt: '2026-07-01T00:00:00.000Z',
        },
      ],
    });

    const result = await listCategories(STORE_ID);

    expect(clinicaFetch).toHaveBeenCalledWith(
      STORE_ID,
      '/v1/appointment-categories?perPage=100&page=1',
    );
    expect(result[0]).toMatchObject({
      id: 'cat-1',
      clinicId: STORE_ID,
      name: 'Consulta',
    });
  });
});
