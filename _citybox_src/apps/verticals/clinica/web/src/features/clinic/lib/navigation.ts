import type { VerticalBrand, VerticalNavLeaf, VerticalNavModule } from '@/lib/vertical/types';
import {
  activeModuleId as activeVerticalModuleId,
  findNavByPath,
  verticalBasePath,
} from '@/lib/vertical/navigation-utils';

export type ClinicNavLeaf = VerticalNavLeaf;
export type ClinicNavModule = VerticalNavModule;

export const CLINIC_BASE = verticalBasePath('clinic');

export const CLINIC_BRAND: VerticalBrand = {
  name: 'Citybox Clínica',
  shortName: 'Clínica',
  tagline: 'Gestão para clínicas e consultórios',
};

export const CLINIC_NAV_MODULES: ClinicNavModule[] = [
  {
    id: 'clinica',
    label: 'Clínica',
    children: [
      {
        id: 'visao-geral',
        label: 'Visão geral',
        path: '/',
        aliases: ['/relatorios', '/tarefas'],
        description: 'KPIs e métricas em tempo real da clínica.',
      },
      {
        id: 'pacientes',
        label: 'Pacientes',
        path: '/pacientes',
        description: 'Cadastro, histórico e prontuário dos pacientes.',
      },
      {
        id: 'agenda',
        label: 'Agenda',
        path: '/agenda',
        description: 'Agendamento de consultas e gestão de horários.',
      },
      {
        id: 'vendas',
        label: 'Vendas',
        path: '/vendas',
        description: 'Atendimentos, pacotes e cobranças.',
      },
      {
        id: 'marketing',
        label: 'Marketing',
        path: '/marketing',
        aliases: ['/marketing/campaigns', '/marketing/indicacoes'],
        description: 'Campanhas, indicações e relacionamento com pacientes.',
      },
      {
        id: 'loja',
        label: 'Loja',
        path: '/loja',
        aliases: ['/loja/assinatura-eletronica'],
        description: 'Pacotes de comunicação e assinatura eletrônica.',
      },
    ],
  },
  {
    id: 'administrativo',
    label: 'Administrativo',
    children: [
      {
        id: 'estoque',
        label: 'Estoque',
        path: '/estoque',
        description: 'Insumos, materiais e controle de estoque.',
      },
      {
        id: 'financeiro',
        label: 'Financeiro',
        path: '/financeiro',
        description: 'Receitas, despesas e fluxo de caixa.',
      },
      {
        id: 'configuracoes',
        label: 'Configurações',
        path: '/configuracoes',
        description: 'Dados da clínica, equipe e integrações.',
      },
    ],
  },
];

const CLINIC_NAV_OPTIONS = { defaultModuleId: 'clinica', defaultLeafId: 'visao-geral' } as const;

export function findClinicNavByPath(pathname: string) {
  return findNavByPath(pathname, CLINIC_NAV_MODULES, CLINIC_BASE, CLINIC_NAV_OPTIONS);
}

export function activeClinicModuleId(pathname: string): string {
  return activeVerticalModuleId(pathname, CLINIC_NAV_MODULES, CLINIC_BASE, CLINIC_NAV_OPTIONS);
}
