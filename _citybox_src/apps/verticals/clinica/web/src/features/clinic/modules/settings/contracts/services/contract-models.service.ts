import { clinicaFetch } from '@/features/clinic/shared/api';
import type { ClinicContractTemplate } from '../types/clinic-contract';
import type { ClinicContractFormData } from '../types/clinic-contract-form';

type ContractModelEnvelope = { data: ClinicContractTemplate };
type ContractModelListEnvelope = { data: ClinicContractTemplate[] };

export async function listContractModels(
  storeId: string,
): Promise<ClinicContractTemplate[]> {
  const res = await clinicaFetch<ContractModelListEnvelope>(
    storeId,
    '/v1/contract-models',
  );
  return res.data;
}

export async function createContractModel(
  storeId: string,
  values: ClinicContractFormData,
): Promise<ClinicContractTemplate> {
  const res = await clinicaFetch<ContractModelEnvelope>(storeId, '/v1/contract-models', {
    method: 'POST',
    body: JSON.stringify(values),
  });
  return res.data;
}

export async function updateContractModel(
  storeId: string,
  id: string,
  values: ClinicContractFormData,
): Promise<ClinicContractTemplate> {
  const res = await clinicaFetch<ContractModelEnvelope>(
    storeId,
    `/v1/contract-models/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(values),
    },
  );
  return res.data;
}

export async function deleteContractModel(storeId: string, id: string): Promise<void> {
  await clinicaFetch<void>(storeId, `/v1/contract-models/${id}`, { method: 'DELETE' });
}
