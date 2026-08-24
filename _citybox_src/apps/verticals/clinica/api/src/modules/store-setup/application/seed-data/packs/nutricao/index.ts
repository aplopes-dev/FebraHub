import type { ClinicSeedPack } from '../types';
import {
  NUTRICAO_ANAMNESIS_EXTRA_QUESTIONS,
  NUTRICAO_ANAMNESIS_TEMPLATES,
  NUTRICAO_FOLLOWUP_ANAMNESIS_QUESTIONS,
  NUTRICAO_FOLLOWUP_ANAMNESIS_TEMPLATE_NAME,
} from './anamnesis';
import {
  DEFAULT_NUTRICAO_CONTRACT_HTML,
  DEFAULT_NUTRICAO_CONTRACT_NAME,
} from './contract';
import { NUTRICAO_SPECIALTIES } from './specialties';

export { NUTRICAO_SPECIALTIES, NUTRICAO_SPECIALTY_NAMES } from './specialties';
export {
  NUTRICAO_ANAMNESIS_EXTRA_QUESTIONS,
  NUTRICAO_ANAMNESIS_TEMPLATES,
  NUTRICAO_FOLLOWUP_ANAMNESIS_QUESTIONS,
  NUTRICAO_FOLLOWUP_ANAMNESIS_TEMPLATE_NAME,
} from './anamnesis';
export {
  DEFAULT_NUTRICAO_CONTRACT_HTML,
  DEFAULT_NUTRICAO_CONTRACT_NAME,
} from './contract';

/** Pack de first-contact para clínicas com `clinicStrand = nutricao`. */
export const NUTRICAO_CLINIC_SEED_PACK: ClinicSeedPack = {
  version: 1,
  plan: {
    name: 'Particular',
    isDefault: true,
    specialties: NUTRICAO_SPECIALTIES,
  },
  anamnesis: {
    librarySource: 'global-plus-extra',
    extraLibrary: NUTRICAO_ANAMNESIS_EXTRA_QUESTIONS,
    templates: NUTRICAO_ANAMNESIS_TEMPLATES,
    followupLibrary: NUTRICAO_FOLLOWUP_ANAMNESIS_QUESTIONS,
    followupTemplateName: NUTRICAO_FOLLOWUP_ANAMNESIS_TEMPLATE_NAME,
  },
  contract: {
    name: DEFAULT_NUTRICAO_CONTRACT_NAME,
    content: DEFAULT_NUTRICAO_CONTRACT_HTML,
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
    { name: 'Materiais nutricionais', color: '#3B82F6' },
    { name: 'Outras', color: '#A855F7' },
  ],
  incomeCategories: [
    { name: 'Consultas nutricionais', color: '#22C55E' },
    { name: 'Acompanhamento nutricional', color: '#3B82F6' },
    { name: 'Avaliações', color: '#6366F1' },
    { name: 'Elaboração de dietas', color: '#14B8A6' },
    { name: 'Produtos / suplementos vendidos', color: '#EC4899' },
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
    { name: 'Acompanhamento', color: 'indigo' },
    { name: 'Urgência', color: 'red' },
  ],
  demo: {
    patientName: 'Paciente Demonstração',
    durationMin: 30,
    appointmentCategoryName: 'Avaliação',
  },
};
