import type { ClinicSeedPack } from '../types';
import {
  FISIOTERAPIA_ANAMNESIS_EXTRA_QUESTIONS,
  FISIOTERAPIA_ANAMNESIS_TEMPLATES,
} from './anamnesis';
import {
  DEFAULT_FISIO_CONTRACT_HTML,
  DEFAULT_FISIO_CONTRACT_NAME,
} from './contract';
import { FISIOTERAPIA_SPECIALTIES } from './specialties';

export { FISIOTERAPIA_SPECIALTIES, FISIOTERAPIA_SPECIALTY_NAMES } from './specialties';
export {
  FISIOTERAPIA_ANAMNESIS_EXTRA_QUESTIONS,
  FISIOTERAPIA_ANAMNESIS_TEMPLATES,
} from './anamnesis';
export {
  DEFAULT_FISIO_CONTRACT_HTML,
  DEFAULT_FISIO_CONTRACT_NAME,
} from './contract';

/** Pack de first-contact para clínicas com `clinicStrand = fisioterapia`. */
export const FISIOTERAPIA_CLINIC_SEED_PACK: ClinicSeedPack = {
  version: 1,
  plan: {
    name: 'Particular',
    isDefault: true,
    specialties: FISIOTERAPIA_SPECIALTIES,
  },
  anamnesis: {
    librarySource: 'global-plus-extra',
    extraLibrary: FISIOTERAPIA_ANAMNESIS_EXTRA_QUESTIONS,
    templates: FISIOTERAPIA_ANAMNESIS_TEMPLATES,
  },
  contract: {
    name: DEFAULT_FISIO_CONTRACT_NAME,
    content: DEFAULT_FISIO_CONTRACT_HTML,
    isDefault: true,
  },
  financialAccount: {
    name: 'Caixa da Clínica',
    type: 'checking',
  },
  expenseCategories: [
    { name: 'Contabilidade', color: '#6366F1' },
    {
      name: 'Custos Fixos (aluguel, telefone, internet, licença de software)',
      color: '#F97316',
    },
    { name: 'Despesas bancárias', color: '#6B7280' },
    { name: 'Encargos de funcionários', color: '#EF4444' },
    { name: 'Infraestrutura', color: '#F59E0B' },
    { name: 'Laboratórios', color: '#14B8A6' },
    { name: 'Materiais fisioterapêuticos', color: '#3B82F6' },
    { name: 'Outras', color: '#A855F7' },
  ],
  incomeCategories: [
    { name: 'Sessões de fisioterapia', color: '#22C55E' },
    { name: 'Consultas', color: '#3B82F6' },
    { name: 'Pilates', color: '#6366F1' },
    { name: 'RPG / Reeducação postural', color: '#14B8A6' },
    { name: 'Avaliações e exames funcionais', color: '#F59E0B' },
    { name: 'Produtos / Materiais vendidos', color: '#EC4899' },
    { name: 'Outras receitas', color: '#6B7280' },
  ],
  patientCategories: [
    { name: 'Particular', colorId: '#3b82f6', isProtected: true },
    { name: 'Ouro', colorId: '#f59e0b', isProtected: false },
    { name: 'Prata', colorId: '#6366f1', isProtected: false },
    { name: 'Bronze', colorId: '#f97316', isProtected: false },
    { name: 'Platina', colorId: '#a855f7', isProtected: false },
  ],
  appointmentCategories: [
    { name: 'Particular', color: 'blue' },
    { name: 'Avaliação', color: 'green' },
    { name: 'Retorno', color: 'teal' },
    { name: 'RPG', color: 'indigo' },
    { name: 'Pilates', color: 'lime' },
    { name: 'Urgência', color: 'red' },
  ],
  demo: {
    patientName: 'Paciente Demonstração',
    durationMin: 30,
    appointmentCategoryName: 'Avaliação',
  },
};
