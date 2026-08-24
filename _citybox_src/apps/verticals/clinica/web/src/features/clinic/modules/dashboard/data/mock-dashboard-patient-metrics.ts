import type { DashboardPatientMetric } from '../types/clinic-dashboard';

const PATIENT_CONTACTS = {
  'pat-001': {
    id: 'pat-001',
    name: 'Ana Carolina Silva',
    phone: '73999887766',
    email: 'ana.silva@exemplo.com',
    cpf: '123.456.789-00',
  },
  'pat-002': {
    id: 'pat-002',
    name: 'Bruno Henrique Santos',
    phone: '73988776655',
    email: 'bruno.santos@exemplo.com',
    cpf: '234.567.890-11',
  },
  'pat-004': {
    id: 'pat-004',
    name: 'Daniel Oliveira Costa',
    phone: '73966554433',
    email: 'daniel.costa@exemplo.com',
    cpf: '345.678.901-22',
  },
  'pat-005': {
    id: 'pat-005',
    name: 'Elena Ferreira Souza',
    phone: '73955443322',
    email: 'elena.souza@exemplo.com',
    cpf: '456.789.012-33',
  },
  'pat-007': {
    id: 'pat-007',
    name: 'Gabriela Martins Rocha',
    phone: '73933221100',
    email: 'gabriela.rocha@exemplo.com',
    cpf: '567.890.123-44',
  },
  'pat-008': {
    id: 'pat-008',
    name: 'Henrique Barbosa Nunes',
    phone: '73922110099',
    email: 'henrique.nunes@exemplo.com',
    cpf: '678.901.234-55',
  },
  'pat-009': {
    id: 'pat-009',
    name: 'Isabela Teixeira Dias',
    phone: '73911009988',
    email: 'isabela.dias@exemplo.com',
    cpf: '789.012.345-66',
  },
} as const;

export const MOCK_DASHBOARD_PATIENT_METRICS: DashboardPatientMetric[] = [
  {
    id: 'total_registered',
    label: 'Total de pacientes cadastrados',
    patients: [
      PATIENT_CONTACTS['pat-001'],
      PATIENT_CONTACTS['pat-002'],
      PATIENT_CONTACTS['pat-004'],
      PATIENT_CONTACTS['pat-005'],
      PATIENT_CONTACTS['pat-007'],
      PATIENT_CONTACTS['pat-008'],
      PATIENT_CONTACTS['pat-009'],
    ],
  },
  {
    id: 'birthdays',
    label: 'Aniversariantes',
    patients: [
      {
        id: 'pat-001',
        name: 'Ana Carolina Silva',
        phone: '73999887766',
        detail: 'Aniversário em 17/07',
      },
      {
        id: 'pat-009',
        name: 'Isabela Teixeira Dias',
        phone: '73911009988',
        detail: 'Aniversário em 18/07',
      },
      {
        id: 'pat-004',
        name: 'Daniel Oliveira Costa',
        phone: '73966554433',
        detail: 'Aniversário em 20/07',
      },
    ],
  },
  {
    id: 'seen_last_6_months',
    label: 'Pacientes atendidos nos últimos 6 meses',
    patients: [
      PATIENT_CONTACTS['pat-001'],
      PATIENT_CONTACTS['pat-002'],
      PATIENT_CONTACTS['pat-004'],
      PATIENT_CONTACTS['pat-005'],
      PATIENT_CONTACTS['pat-008'],
    ],
  },
  {
    id: 'overdue_debts',
    label: 'Pacientes com débitos em atraso',
    patients: [
      { ...PATIENT_CONTACTS['pat-001'], valueCents: 150000 },
      { ...PATIENT_CONTACTS['pat-002'], valueCents: 28000 },
      { ...PATIENT_CONTACTS['pat-004'], valueCents: 22000 },
    ],
  },
  {
    id: 'new_seen_this_month',
    label: 'Novos pacientes atendidos no mês',
    patients: [PATIENT_CONTACTS['pat-009'], PATIENT_CONTACTS['pat-008']],
  },
  {
    id: 'open_treatment_without_appointment',
    label: 'Pacientes com procedimento em aberto sem consulta',
    patients: [
      PATIENT_CONTACTS['pat-004'],
      PATIENT_CONTACTS['pat-007'],
      PATIENT_CONTACTS['pat-008'],
    ],
  },
];
