import type { ClinicContractTemplate } from '../types/clinic-contract';

export function resolveConflictingDefaultContract(
  templates: ClinicContractTemplate[],
  editingTemplateId?: string,
): ClinicContractTemplate | null {
  return (
    templates.find(
      (template) => template.isDefault && template.id !== editingTemplateId,
    ) ?? null
  );
}
