import { describe, expect, it, vi } from 'vitest';
import { clinicaFetch } from '@/features/clinic/shared/api/clinica-client';
import {
  getServiceHours,
  saveServiceHours,
} from '@/features/clinic/modules/settings/team/services/service-hours.service';
import { createDefaultServiceHours } from '@/features/clinic/modules/settings/team/data/mock-service-hours';

vi.mock('@/features/clinic/shared/api/clinica-client', () => ({
  clinicaFetch: vi.fn(),
}));

const STORE_ID = '11111111-1111-4111-8111-111111111111';
const MEMBER_ID = '22222222-2222-4222-8222-222222222222';

describe('service-hours.service', () => {
  it('loads service hours from clinica-api', async () => {
    const config = createDefaultServiceHours();
    vi.mocked(clinicaFetch).mockResolvedValueOnce({ data: config });

    const result = await getServiceHours(STORE_ID, MEMBER_ID);

    expect(clinicaFetch).toHaveBeenCalledWith(
      STORE_ID,
      `/v1/team/${MEMBER_ID}/service-hours`,
    );
    expect(result).toEqual(config);
  });

  it('saves service hours via PUT', async () => {
    const config = createDefaultServiceHours();
    config.defaultConsultationMinutes = 60;
    vi.mocked(clinicaFetch).mockResolvedValueOnce({ data: config });

    const result = await saveServiceHours(STORE_ID, MEMBER_ID, config);

    expect(clinicaFetch).toHaveBeenCalledWith(
      STORE_ID,
      `/v1/team/${MEMBER_ID}/service-hours`,
      {
        method: 'PUT',
        body: JSON.stringify(config),
      },
    );
    expect(result.defaultConsultationMinutes).toBe(60);
  });
});
