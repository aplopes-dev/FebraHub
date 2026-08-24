import type { ClinicContractTemplate } from '../types/clinic-contract';
import type { ClinicContractFormData } from '../types/clinic-contract-form';

export function createEmptyClinicContractForm(): ClinicContractFormData {
  return {
    name: '',
    isDefault: false,
    content: '',
  };
}

export function createClinicContractFormFromTemplate(
  template: ClinicContractTemplate,
): ClinicContractFormData {
  return {
    name: template.name,
    isDefault: template.isDefault,
    content: template.content,
  };
}
