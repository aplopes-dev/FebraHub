import type { ClinicSeedPack } from '../types';
import { ANAMNESIS_TEMPLATES } from '../../anamnesis-templates';
import {
  DEFAULT_CONTRACT_HTML,
  DEFAULT_CONTRACT_NAME,
} from '../../contract-odontologico-padrao';
import { PARTICULAR_SPECIALTIES } from '../../particular-specialties';

/** Pack de first-contact para clínicas com `clinicStrand = odontologia` (template v4). */
export const ODONTOLOGIA_CLINIC_SEED_PACK: ClinicSeedPack = {
  version: 4,
  plan: {
    name: 'Particular',
    isDefault: true,
    specialties: PARTICULAR_SPECIALTIES,
  },
  anamnesis: {
    librarySource: 'odontologia-full',
    extraLibrary: [],
    templates: ANAMNESIS_TEMPLATES,
  },
  contract: {
    name: DEFAULT_CONTRACT_NAME,
    content: DEFAULT_CONTRACT_HTML,
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
    { name: 'Materiais odontológicos', color: '#3B82F6' },
    { name: 'Outras', color: '#A855F7' },
  ],
  incomeCategories: [
    { name: 'Consultas', color: '#22C55E' },
    { name: 'Tratamentos odontológicos', color: '#3B82F6' },
    { name: 'Ortodontia', color: '#6366F1' },
    { name: 'Harmonização facial / Estética', color: '#EC4899' },
    { name: 'Radiologia / Exames', color: '#14B8A6' },
    { name: 'Produtos / Materiais vendidos', color: '#F59E0B' },
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
    { name: 'Avaliação / Primeira consulta', color: 'green' },
    { name: 'Retorno', color: 'teal' },
    { name: 'Urgência', color: 'red' },
    { name: 'Limpeza / Prevenção', color: 'lime' },
    { name: 'Ortodontia', color: 'indigo' },
    { name: 'Harmonização / Estética', color: 'pink' },
  ],
  demo: {
    patientName: 'Paciente Demonstração',
    durationMin: 30,
    appointmentCategoryName: 'Particular',
  },
};
