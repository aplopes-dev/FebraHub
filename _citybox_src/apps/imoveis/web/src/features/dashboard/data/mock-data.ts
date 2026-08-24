/**
 * Dados mockados do dashboard.
 * Enquanto não existe API, tudo o que a tela mostra sai daqui — nenhum componente
 * declara dado próprio. Ao plugar o back-end, só o `dashboard-service` muda.
 */
import type { Person } from '@/features/shared/types';
import type {
  ActiveListing,
  ContactLead,
  DashboardMetric,
  DealsSummary,
  FeaturedProperty,
  PerformanceSeries,
  Reminder,
} from '../types';
import { formatCompactCurrency, formatNumber } from '@/features/shared/utils/format';

const PEOPLE: Record<string, Person> = {
  'per-1': { id: 'per-1', name: 'Camila Rocha', initials: 'CR' },
  'per-2': { id: 'per-2', name: 'Diego Martins', initials: 'DM' },
  'per-3': { id: 'per-3', name: 'Fernanda Lima', initials: 'FL' },
  'per-4': { id: 'per-4', name: 'Rafael Souza', initials: 'RS' },
  'per-5': { id: 'per-5', name: 'Bianca Alves', initials: 'BA' },
  'per-6': { id: 'per-6', name: 'Otávio Nunes', initials: 'ON' },
  'per-7': { id: 'per-7', name: 'Marina Duarte', initials: 'MD' },
  'per-8': { id: 'per-8', name: 'Paulo Henrique', initials: 'PH' },
};

export const METRICS: readonly DashboardMetric[] = [
  {
    key: 'active-leads',
    label: 'Leads ativos',
    value: formatNumber(120),
    trend: { value: 12, direction: 'up' },
  },
  {
    key: 'total-revenue',
    label: 'Receita total',
    value: formatCompactCurrency(96_700_050),
    trend: { value: 12, direction: 'up' },
  },
  {
    key: 'active-listings',
    label: 'Imóveis ativos',
    value: formatNumber(23),
    trend: { value: 12, direction: 'down' },
  },
  {
    key: 'total-closed',
    label: 'Negócios fechados',
    value: formatNumber(42),
    trend: { value: 12, direction: 'up' },
  },
];

export const PERFORMANCE_SERIES: PerformanceSeries = {
  period: 'monthly',
  highlightedIndex: 5,
  targetAmount: 120_000_000,
  points: [
    { label: 'Jan', revenue: 68, visits: 66, revenueAmount: 54_200_000 },
    { label: 'Fev', revenue: 47, visits: 58, revenueAmount: 41_800_000 },
    { label: 'Mar', revenue: 63, visits: 47, revenueAmount: 58_500_000 },
    { label: 'Abr', revenue: 60, visits: 62, revenueAmount: 56_900_000 },
    { label: 'Mai', revenue: 79, visits: 70, revenueAmount: 79_300_000 },
    { label: 'Jun', revenue: 74, visits: 47, revenueAmount: 96_700_050 },
    { label: 'Jul', revenue: 62, visits: 66, revenueAmount: 61_400_000 },
    { label: 'Ago', revenue: 82, visits: 74, revenueAmount: 88_100_000 },
  ],
};

export const FEATURED_PROPERTY: FeaturedProperty = {
  id: 'prop-somerset',
  name: 'Residencial Somerset',
  typeLabel: 'Casa',
  highlights: [
    'Varanda gourmet',
    '2 vagas cobertas',
    'Área de lazer',
    'Vista mar',
  ],
  recommendedToLeads: 14,
};

export const DEALS_SUMMARY: DealsSummary = {
  closed: 42,
  inProgress: 132,
};

export const ACTIVE_LISTINGS: readonly ActiveListing[] = [
  {
    id: 'lst-1',
    name: 'Maison Sterling',
    city: 'Belo Horizonte',
    state: 'MG',
    type: 'house',
    units: 12,
    cost: 1_500_000,
    views: 125,
    status: 'occupied',
    occupiedUnits: 8,
    activeLeads: [PEOPLE['per-1'], PEOPLE['per-2']],
    totalActiveLeads: 34,
  },
  {
    id: 'lst-2',
    name: 'The Orchid',
    city: 'Curitiba',
    state: 'PR',
    type: 'villa',
    units: 9_300,
    cost: 520_000,
    views: 930,
    status: 'available',
    activeLeads: [PEOPLE['per-3'], PEOPLE['per-4']],
    totalActiveLeads: 17,
  },
  {
    id: 'lst-3',
    name: 'Echelon West',
    city: 'Curitiba',
    state: 'PR',
    type: 'house',
    units: 25,
    cost: 700_000,
    views: 355,
    status: 'available',
    activeLeads: [PEOPLE['per-5'], PEOPLE['per-6']],
    totalActiveLeads: 42,
  },
  {
    id: 'lst-4',
    name: 'La Residence',
    city: 'Curitiba',
    state: 'PR',
    type: 'apartment',
    units: 17,
    cost: 700_000,
    views: 425,
    status: 'sold-out',
    activeLeads: [PEOPLE['per-7'], PEOPLE['per-8']],
    totalActiveLeads: 13,
  },
];

export const CONTACT_LEADS: readonly ContactLead[] = [
  {
    id: 'lead-1',
    name: 'Jéssica Chen',
    initials: 'JC',
    city: 'São Paulo',
    state: 'SP',
    phone: '(11) 98812-4410',
  },
  {
    id: 'lead-2',
    name: 'João Dias',
    initials: 'JD',
    city: 'Campinas',
    state: 'SP',
    phone: '(19) 99715-2288',
  },
  {
    id: 'lead-3',
    name: 'Helena S.',
    initials: 'HS',
    city: 'Niterói',
    state: 'RJ',
    phone: '(21) 99422-6103',
  },
  {
    id: 'lead-4',
    name: 'Evandro Cris',
    initials: 'EC',
    city: 'Curitiba',
    state: 'PR',
    phone: '(41) 98330-7742',
  },
  {
    id: 'lead-5',
    name: 'Emily Paris',
    initials: 'EP',
    city: 'Santos',
    state: 'SP',
    phone: '(13) 99120-5567',
  },
];

export const REMINDERS: readonly Reminder[] = [
  {
    kind: 'follow-up',
    title: 'Follow-ups',
    description: '15 leads precisam de retorno',
    progress: 20,
    people: [PEOPLE['per-1'], PEOPLE['per-2'], PEOPLE['per-3'], PEOPLE['per-4']],
    totalPeople: 15,
    isHighlighted: true,
  },
  {
    kind: 'visit',
    title: 'Visitas',
    description: '2 imóveis e 3 leads com visita hoje',
    progress: 65,
  },
  {
    kind: 'expiring',
    title: 'Anúncios expirando',
    description: '2 anúncios expiram em 3 dias',
    progress: 45,
  },
];
