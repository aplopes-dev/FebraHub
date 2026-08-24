import { ODONTOLOGIA_CLINIC_SEED_PACK } from './packs/odontologia';
import {
  ANAMNESIS_QUESTION_LIBRARY,
  ANAMNESIS_TEMPLATES,
} from './anamnesis-templates';

/**
 * Template legado odontologia — preferir `resolveClinicSeedPack(clinicStrand)`.
 * Mantido para testes e referência do pack v4.
 */
export const CLINIC_SEED_TEMPLATE = {
  version: ODONTOLOGIA_CLINIC_SEED_PACK.version,
  plan: ODONTOLOGIA_CLINIC_SEED_PACK.plan,
  anamnesis: {
    library: ANAMNESIS_QUESTION_LIBRARY,
    templates: ANAMNESIS_TEMPLATES,
  },
  contract: ODONTOLOGIA_CLINIC_SEED_PACK.contract,
  financialAccount: ODONTOLOGIA_CLINIC_SEED_PACK.financialAccount,
  expenseCategories: ODONTOLOGIA_CLINIC_SEED_PACK.expenseCategories,
  incomeCategories: ODONTOLOGIA_CLINIC_SEED_PACK.incomeCategories,
  patientCategories: ODONTOLOGIA_CLINIC_SEED_PACK.patientCategories,
  appointmentCategories: ODONTOLOGIA_CLINIC_SEED_PACK.appointmentCategories,
  demo: {
    patientName: ODONTOLOGIA_CLINIC_SEED_PACK.demo.patientName,
    durationMin: ODONTOLOGIA_CLINIC_SEED_PACK.demo.durationMin,
  },
} as const;

export { ODONTOLOGIA_CLINIC_SEED_PACK } from './packs/odontologia';
export { FISIOTERAPIA_CLINIC_SEED_PACK } from './packs/fisioterapia';
export {
  resolveClinicSeedPack,
  resolveClinicSeedPackForStrand,
} from './packs/resolve-clinic-seed-pack';
