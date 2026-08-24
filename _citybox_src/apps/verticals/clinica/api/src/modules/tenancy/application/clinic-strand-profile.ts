import {
  getClinicStrandDefinition,
  type ClinicStrand,
  type ClinicStrandCopy,
  type ClinicStrandFeatures,
} from '@citybox/messaging';

export type ClinicStrandProfile = {
  clinicStrand: ClinicStrand;
  label: string;
  features: ClinicStrandFeatures;
  copy: ClinicStrandCopy;
};

export function toClinicStrandProfile(
  strand: ClinicStrand,
): ClinicStrandProfile {
  const definition = getClinicStrandDefinition(strand);
  return {
    clinicStrand: definition.id,
    label: definition.label,
    features: definition.features,
    copy: definition.copy,
  };
}
