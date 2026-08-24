import {
  toProfessionalCouncilSnapshot,
  type ProfessionalCouncilFields,
  type ProfessionalCouncilType,
} from '@citybox/messaging/professional-council';

export {
  CREFITO_REGIONALS,
  formatCrefitoRegionalOptionLabel,
  formatCrefitoRegionalStorage,
  formatProfessionalCouncilLabel,
  hasCompleteProfessionalCouncil as hasProfessionalCouncil,
  parseProfessionalCouncilInput,
  toProfessionalCouncilSnapshot,
  type ProfessionalCouncilFields,
  type ProfessionalCouncilSnapshot,
  type ProfessionalCouncilType,
} from '@citybox/messaging/professional-council';

/** Perfil usado no PDF / preview do sheet. */
export type ProfessionalClinicalProfile = {
  displayName: string;
  councilType?: ProfessionalCouncilType | null;
  councilNumber?: string | null;
  councilUf?: string | null;
};

export function toProfessionalClinicalProfile(
  fields: ProfessionalCouncilFields | null | undefined,
  displayName: string,
): ProfessionalClinicalProfile {
  const snapshot = fields ? toProfessionalCouncilSnapshot(fields) : null;
  return {
    displayName,
    councilType: snapshot?.councilType ?? null,
    councilNumber: snapshot?.councilNumber ?? null,
    councilUf: snapshot?.councilUf ?? null,
  };
}
