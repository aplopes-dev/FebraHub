import {
  AppointmentKind,
  DealStage,
  DealStatus,
  LeadActivityType,
  LeadPurpose,
  LeadSource,
  LeadStatus,
  ListingType,
  PrismaClient,
  PropertyStatus,
  PropertyType,
  TransactionPaymentMethod,
  TransactionStatus,
  TransactionType,
} from '../generated/prisma/client';

export type SeedStoreContext = {
  storeId: string;
  agentId: string;
  actorName: string;
};

type DemoProperty = {
  key: string;
  name: string;
  city: string;
  state: string;
  type: PropertyType;
  listingType: ListingType;
  status: PropertyStatus;
  cost: number;
  bedrooms: number;
  floors: number;
  sizeSqm: number;
  yearBuilt: number;
  address: string;
  zipCode: string;
  mapCoordinate: string;
  description: string;
  highlights: string[];
  negotiable: boolean;
  views: number;
};

type DemoDeal = {
  stage: DealStage;
  type: TransactionType;
  transaction?: {
    status: TransactionStatus;
    paymentMethod: TransactionPaymentMethod;
    commissionPercent: number;
    rental?: {
      landlordName: string;
      tenantName: string;
      condoCents: number;
      iptuCents: number;
      adminFeePercent: number;
      dueDay: number;
    };
  };
};

type DemoLead = {
  key: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  status: LeadStatus;
  leadSource: LeadSource;
  interestedPropertyType: PropertyType;
  budgetRange: string;
  preferredLocation: string;
  purpose: LeadPurpose;
  latestFollowUp: string;
  nextFollowUp: string;
  notes: string;
  propertyKey?: string;
  deal?: DemoDeal;
  visit?: { title: string; startsAt: string; endsAt: string; location: string };
};

const AGENCY = 40;
const CAPTOR = 30;
const SELLER = 30;

export const DEMO_PROPERTIES: readonly DemoProperty[] = [
  {
    key: 'casa-pontal',
    name: 'Casa em Pontal',
    city: 'Ilhéus',
    state: 'BA',
    type: PropertyType.house,
    listingType: ListingType.sale,
    status: PropertyStatus.reserved,
    cost: 850_000,
    bedrooms: 3,
    floors: 2,
    sizeSqm: 186,
    yearBuilt: 2018,
    address: 'Rua da Praia, 210',
    zipCode: '45654-000',
    mapCoordinate: '-14.8142, -39.0340',
    description: 'Casa ampla a dois quarteirões da orla de Pontal, com quintal e edícula.',
    highlights: ['Quintal', 'Edícula', 'Perto da praia'],
    negotiable: true,
    views: 412,
  },
  {
    key: 'apto-orla',
    name: 'Apartamento Orla Centro',
    city: 'Ilhéus',
    state: 'BA',
    type: PropertyType.apartment,
    listingType: ListingType.sale,
    status: PropertyStatus.reserved,
    cost: 420_000,
    bedrooms: 2,
    floors: 8,
    sizeSqm: 78,
    yearBuilt: 2021,
    address: 'Av. Soares Lopes, 890',
    zipCode: '45653-000',
    mapCoordinate: '-14.7973, -39.0348',
    description: 'Apto com varanda e vista parcial para o mar, prédio com portaria 24h.',
    highlights: ['Varanda', 'Portaria 24h', 'Vista parcial mar'],
    negotiable: false,
    views: 880,
  },
  {
    key: 'casa-olivencia',
    name: 'Casa Olivença',
    city: 'Ilhéus',
    state: 'BA',
    type: PropertyType.house,
    listingType: ListingType.sale,
    status: PropertyStatus.occupied,
    cost: 1_100_000,
    bedrooms: 4,
    floors: 2,
    sizeSqm: 240,
    yearBuilt: 2015,
    address: 'Alameda dos Coqueiros, 45',
    zipCode: '45660-000',
    mapCoordinate: '-14.9510, -39.0180',
    description: 'Casa de praia em Olivença com piscina e área gourmet.',
    highlights: ['Piscina', 'Área gourmet', '4 suítes'],
    negotiable: true,
    views: 654,
  },
  {
    key: 'apto-jardim',
    name: 'Apartamento Jardim Atlântico',
    city: 'Ilhéus',
    state: 'BA',
    type: PropertyType.apartment,
    listingType: ListingType.sale,
    status: PropertyStatus.occupied,
    cost: 380_000,
    bedrooms: 2,
    floors: 6,
    sizeSqm: 68,
    yearBuilt: 2019,
    address: 'Rua C, 112',
    zipCode: '45655-210',
    mapCoordinate: '-14.7890, -39.0460',
    description: 'Apartamento reformado, silencioso, próximo a escolas e comércio.',
    highlights: ['Reformado', '1 vaga', 'Próximo a escolas'],
    negotiable: true,
    views: 301,
  },
  {
    key: 'cobertura-sao-francisco',
    name: 'Cobertura São Francisco',
    city: 'Ilhéus',
    state: 'BA',
    type: PropertyType.apartment,
    listingType: ListingType.sale,
    status: PropertyStatus.occupied,
    cost: 1_450_000,
    bedrooms: 3,
    floors: 12,
    sizeSqm: 162,
    yearBuilt: 2022,
    address: 'Rua Adolfo Viana, 300',
    zipCode: '45652-110',
    mapCoordinate: '-14.7884, -39.0452',
    description: 'Cobertura duplex com terraço e churrasqueira, condomínio completo.',
    highlights: ['Duplex', 'Terraço', 'Academia'],
    negotiable: false,
    views: 1204,
  },
  {
    key: 'sala-soares',
    name: 'Sala comercial Soares Lopes',
    city: 'Ilhéus',
    state: 'BA',
    type: PropertyType.commercial,
    listingType: ListingType.rent,
    status: PropertyStatus.occupied,
    cost: 4_500,
    bedrooms: 0,
    floors: 4,
    sizeSqm: 62,
    yearBuilt: 2016,
    address: 'Av. Soares Lopes, 455',
    zipCode: '45653-000',
    mapCoordinate: '-14.7968, -39.0355',
    description: 'Sala comercial com recepção compartilhada, ideal para clínica ou escritório.',
    highlights: ['Recepção', 'Ar-condicionado', '2 vagas'],
    negotiable: true,
    views: 198,
  },
  {
    key: 'casa-iguape',
    name: 'Casa Iguape',
    city: 'Ilhéus',
    state: 'BA',
    type: PropertyType.house,
    listingType: ListingType.sale,
    status: PropertyStatus.occupied,
    cost: 720_000,
    bedrooms: 3,
    floors: 1,
    sizeSqm: 154,
    yearBuilt: 2012,
    address: 'Rua do Porto, 77',
    zipCode: '45658-000',
    mapCoordinate: '-14.8400, -39.0300',
    description: 'Casa térrea com quintal arborizado em Iguape.',
    highlights: ['Térrea', 'Quintal', 'Garagem para 2 carros'],
    negotiable: true,
    views: 267,
  },
  {
    key: 'apto-malhado',
    name: 'Apartamento Malhado',
    city: 'Ilhéus',
    state: 'BA',
    type: PropertyType.apartment,
    listingType: ListingType.sale,
    status: PropertyStatus.occupied,
    cost: 310_000,
    bedrooms: 2,
    floors: 5,
    sizeSqm: 58,
    yearBuilt: 2014,
    address: 'Rua do Malhado, 918',
    zipCode: '45651-680',
    mapCoordinate: '-14.8055, -39.0330',
    description: 'Apto compacto para moradia ou investimento, perto do comércio local.',
    highlights: ['Investimento', '1 vaga', 'Próximo ao comércio'],
    negotiable: false,
    views: 445,
  },
  {
    key: 'villa-olivencia',
    name: 'Villa Olivença',
    city: 'Ilhéus',
    state: 'BA',
    type: PropertyType.villa,
    listingType: ListingType.sale,
    status: PropertyStatus.sold_out,
    cost: 1_850_000,
    bedrooms: 5,
    floors: 2,
    sizeSqm: 320,
    yearBuilt: 2020,
    address: 'Estrada de Olivença, km 8',
    zipCode: '45660-000',
    mapCoordinate: '-14.9600, -39.0100',
    description: 'Villa com vista para o mar, piscina infinita e casa de hóspedes.',
    highlights: ['Vista mar', 'Piscina infinita', 'Casa de hóspedes'],
    negotiable: false,
    views: 2103,
  },
  {
    key: 'loft-centro',
    name: 'Loft Centro',
    city: 'Ilhéus',
    state: 'BA',
    type: PropertyType.apartment,
    listingType: ListingType.sale,
    status: PropertyStatus.sold_out,
    cost: 490_000,
    bedrooms: 1,
    floors: 3,
    sizeSqm: 52,
    yearBuilt: 2023,
    address: 'Rua Antônio Lavigne, 18',
    zipCode: '45653-130',
    mapCoordinate: '-14.7978, -39.0366',
    description: 'Loft novo no centro histórico, pé-direito alto e vaga privativa.',
    highlights: ['Novo', 'Pé-direito alto', 'Vaga'],
    negotiable: false,
    views: 733,
  },
  {
    key: 'apto-nelson',
    name: 'Apartamento Nelson Costa',
    city: 'Ilhéus',
    state: 'BA',
    type: PropertyType.apartment,
    listingType: ListingType.sale,
    status: PropertyStatus.available,
    cost: 265_000,
    bedrooms: 2,
    floors: 4,
    sizeSqm: 61,
    yearBuilt: 2010,
    address: 'Av. Itabuna, 1500',
    zipCode: '45655-100',
    mapCoordinate: '-14.7880, -39.0520',
    description: 'Bom custo-benefício, condomínio baixo, pronto para morar.',
    highlights: ['Condomínio baixo', 'Pronto para morar'],
    negotiable: true,
    views: 156,
  },
  {
    key: 'casa-hernani',
    name: 'Casa Hernani Sá',
    city: 'Ilhéus',
    state: 'BA',
    type: PropertyType.house,
    listingType: ListingType.sale,
    status: PropertyStatus.available,
    cost: 980_000,
    bedrooms: 4,
    floors: 2,
    sizeSqm: 210,
    yearBuilt: 2017,
    address: 'Rua das Palmeiras, 88',
    zipCode: '45655-400',
    mapCoordinate: '-14.7860, -39.0480',
    description: 'Casa em condomínio fechado com área de lazer completa.',
    highlights: ['Condomínio fechado', 'Lazer', '4 quartos'],
    negotiable: true,
    views: 522,
  },
  {
    key: 'terreno-salobrinho',
    name: 'Terreno Salobrinho',
    city: 'Ilhéus',
    state: 'BA',
    type: PropertyType.land,
    listingType: ListingType.sale,
    status: PropertyStatus.available,
    cost: 180_000,
    bedrooms: 0,
    floors: 0,
    sizeSqm: 450,
    yearBuilt: 0,
    address: 'Rodovia Ilhéus–Itabuna, km 12',
    zipCode: '45662-000',
    mapCoordinate: '-14.7900, -39.1700',
    description: 'Terreno plano, 450 m², documentação regularizada.',
    highlights: ['Plano', 'Documentação ok', 'Água e luz na rua'],
    negotiable: true,
    views: 89,
  },
  {
    key: 'apto-pontal-aluguel',
    name: 'Apartamento Pontal para alugar',
    city: 'Ilhéus',
    state: 'BA',
    type: PropertyType.apartment,
    listingType: ListingType.rent,
    status: PropertyStatus.available,
    cost: 2_800,
    bedrooms: 2,
    floors: 7,
    sizeSqm: 70,
    yearBuilt: 2018,
    address: 'Rua 2 de Julho, 55',
    zipCode: '45654-100',
    mapCoordinate: '-14.8130, -39.0335',
    description: 'Locação mobiliada a 400 m da praia de Pontal.',
    highlights: ['Mobiliado', 'Perto da praia', 'Aceita pets'],
    negotiable: false,
    views: 340,
  },
  {
    key: 'comercial-itabuna',
    name: 'Sala Centro Itabuna',
    city: 'Itabuna',
    state: 'BA',
    type: PropertyType.commercial,
    listingType: ListingType.rent,
    status: PropertyStatus.available,
    cost: 3_500,
    bedrooms: 0,
    floors: 6,
    sizeSqm: 48,
    yearBuilt: 2011,
    address: 'Av. Cinquentenário, 220',
    zipCode: '45600-025',
    mapCoordinate: '-14.7876, -39.2803',
    description: 'Sala no centro comercial de Itabuna, fluxo intenso de pedestres.',
    highlights: ['Centro', 'Elevador', 'Banheiro privativo'],
    negotiable: true,
    views: 121,
  },
  {
    key: 'casa-praia-sul',
    name: 'Casa Praia do Sul',
    city: 'Ilhéus',
    state: 'BA',
    type: PropertyType.house,
    listingType: ListingType.sale,
    status: PropertyStatus.available,
    cost: 1_350_000,
    bedrooms: 4,
    floors: 2,
    sizeSqm: 268,
    yearBuilt: 2019,
    address: 'Alameda Atlântica, 12',
    zipCode: '45659-000',
    mapCoordinate: '-14.8300, -39.0250',
    description: 'Casa de alto padrão a 150 m da Praia do Sul, com piscina e home office.',
    highlights: ['Alto padrão', 'Piscina', 'Home office'],
    negotiable: true,
    views: 978,
  },
];

export const DEMO_LEADS: readonly DemoLead[] = [
  {
    key: 'camila',
    name: 'Camila Rocha',
    email: 'camila.rocha@email.com',
    phone: '(73) 99101-1001',
    city: 'Ilhéus',
    state: 'BA',
    status: LeadStatus.new,
    leadSource: LeadSource.website,
    interestedPropertyType: PropertyType.house,
    budgetRange: 'R$ 700 mil – 900 mil',
    preferredLocation: 'Pontal, Ilhéus',
    purpose: LeadPurpose.buying,
    latestFollowUp: '2026-08-12',
    nextFollowUp: '2026-08-20',
    notes: 'Quer casa com quintal para os filhos.',
    deal: { stage: DealStage.awaiting_property, type: TransactionType.SALE },
  },
  {
    key: 'diego',
    name: 'Diego Martins',
    email: 'diego.martins@email.com',
    phone: '(73) 99101-1002',
    city: 'Ilhéus',
    state: 'BA',
    status: LeadStatus.new,
    leadSource: LeadSource.whatsapp,
    interestedPropertyType: PropertyType.apartment,
    budgetRange: 'R$ 350 mil – 500 mil',
    preferredLocation: 'Centro, Ilhéus',
    purpose: LeadPurpose.buying,
    latestFollowUp: '2026-08-14',
    nextFollowUp: '2026-08-21',
    notes: 'Primeiro imóvel, precisa de financiamento.',
    deal: { stage: DealStage.awaiting_property, type: TransactionType.SALE },
  },
  {
    key: 'fernanda',
    name: 'Fernanda Lima',
    email: 'fernanda.lima@email.com',
    phone: '(73) 99101-1003',
    city: 'Ilhéus',
    state: 'BA',
    status: LeadStatus.negotiating,
    leadSource: LeadSource.referral,
    interestedPropertyType: PropertyType.house,
    budgetRange: 'R$ 800 mil – 950 mil',
    preferredLocation: 'Pontal, Ilhéus',
    purpose: LeadPurpose.buying,
    latestFollowUp: '2026-08-15',
    nextFollowUp: '2026-08-22',
    notes: 'Visitou a casa em Pontal; pediu contraproposta.',
    propertyKey: 'casa-pontal',
    deal: { stage: DealStage.property_selected, type: TransactionType.SALE },
  },
  {
    key: 'rafael',
    name: 'Rafael Souza',
    email: 'rafael.souza@email.com',
    phone: '(73) 99101-1004',
    city: 'Ilhéus',
    state: 'BA',
    status: LeadStatus.negotiating,
    leadSource: LeadSource.ads,
    interestedPropertyType: PropertyType.apartment,
    budgetRange: 'R$ 400 mil – 450 mil',
    preferredLocation: 'Orla, Ilhéus',
    purpose: LeadPurpose.buying,
    latestFollowUp: '2026-08-16',
    nextFollowUp: '2026-08-23',
    notes: 'Apto da orla selecionado; aguarda análise de crédito.',
    propertyKey: 'apto-orla',
    deal: { stage: DealStage.property_selected, type: TransactionType.SALE },
  },
  {
    key: 'bianca',
    name: 'Bianca Alves',
    email: 'bianca.alves@email.com',
    phone: '(73) 99101-1005',
    city: 'Ilhéus',
    state: 'BA',
    status: LeadStatus.negotiating,
    leadSource: LeadSource.walk_in,
    interestedPropertyType: PropertyType.house,
    budgetRange: 'R$ 1 mi – 1,2 mi',
    preferredLocation: 'Olivença, Ilhéus',
    purpose: LeadPurpose.buying,
    latestFollowUp: '2026-08-11',
    nextFollowUp: '2026-08-19',
    notes: 'Contrato de compra da casa em Olivença enviado.',
    propertyKey: 'casa-olivencia',
    deal: { stage: DealStage.contract_sent, type: TransactionType.SALE },
  },
  {
    key: 'otavio',
    name: 'Otávio Nunes',
    email: 'otavio.nunes@email.com',
    phone: '(73) 99101-1006',
    city: 'Ilhéus',
    state: 'BA',
    status: LeadStatus.negotiating,
    leadSource: LeadSource.social,
    interestedPropertyType: PropertyType.apartment,
    budgetRange: 'R$ 350 mil – 400 mil',
    preferredLocation: 'Jardim Atlântico',
    purpose: LeadPurpose.buying,
    latestFollowUp: '2026-08-13',
    nextFollowUp: '2026-08-20',
    notes: 'Minuta enviada ao advogado do comprador.',
    propertyKey: 'apto-jardim',
    deal: { stage: DealStage.contract_sent, type: TransactionType.SALE },
  },
  {
    key: 'marina',
    name: 'Marina Duarte',
    email: 'marina.duarte@email.com',
    phone: '(73) 99101-1007',
    city: 'Ilhéus',
    state: 'BA',
    status: LeadStatus.negotiating,
    leadSource: LeadSource.referral,
    interestedPropertyType: PropertyType.apartment,
    budgetRange: 'R$ 1,3 mi – 1,5 mi',
    preferredLocation: 'São Francisco',
    purpose: LeadPurpose.buying,
    latestFollowUp: '2026-08-10',
    nextFollowUp: '2026-08-25',
    notes: 'Contrato assinado; aguarda FGTS + financiamento.',
    propertyKey: 'cobertura-sao-francisco',
    deal: {
      stage: DealStage.contract_signed,
      type: TransactionType.SALE,
      transaction: {
        status: TransactionStatus.CONTRACT_SIGNED,
        paymentMethod: TransactionPaymentMethod.financing,
        commissionPercent: 6,
      },
    },
  },
  {
    key: 'paulo',
    name: 'Paulo Henrique',
    email: 'paulo.henrique@email.com',
    phone: '(73) 99101-1008',
    city: 'Ilhéus',
    state: 'BA',
    status: LeadStatus.negotiating,
    leadSource: LeadSource.website,
    interestedPropertyType: PropertyType.commercial,
    budgetRange: 'R$ 4 mil – 5 mil / mês',
    preferredLocation: 'Soares Lopes',
    purpose: LeadPurpose.renting,
    latestFollowUp: '2026-08-09',
    nextFollowUp: '2026-08-24',
    notes: 'Locação comercial para clínica; contrato assinado.',
    propertyKey: 'sala-soares',
    deal: {
      stage: DealStage.contract_signed,
      type: TransactionType.RENTAL,
      transaction: {
        status: TransactionStatus.CONTRACT_SIGNED,
        paymentMethod: TransactionPaymentMethod.pix,
        commissionPercent: 10,
        rental: {
          landlordName: 'Roberto Almeida',
          tenantName: 'Paulo Henrique',
          condoCents: 65_000,
          iptuCents: 22_000,
          adminFeePercent: 10,
          dueDay: 10,
        },
      },
    },
  },
  {
    key: 'juliana',
    name: 'Juliana Santos',
    email: 'juliana.santos@email.com',
    phone: '(73) 99101-1009',
    city: 'Ilhéus',
    state: 'BA',
    status: LeadStatus.negotiating,
    leadSource: LeadSource.walk_in,
    interestedPropertyType: PropertyType.house,
    budgetRange: 'R$ 650 mil – 750 mil',
    preferredLocation: 'Iguape',
    purpose: LeadPurpose.buying,
    latestFollowUp: '2026-08-08',
    nextFollowUp: '2026-08-26',
    notes: 'Pagamento confirmado; escritura em andamento.',
    propertyKey: 'casa-iguape',
    deal: {
      stage: DealStage.payment_confirmed,
      type: TransactionType.SALE,
      transaction: {
        status: TransactionStatus.CONTRACT_SIGNED,
        paymentMethod: TransactionPaymentMethod.pix,
        commissionPercent: 6,
      },
    },
  },
  {
    key: 'roberto',
    name: 'Roberto Almeida',
    email: 'roberto.almeida@email.com',
    phone: '(73) 99101-1010',
    city: 'Itabuna',
    state: 'BA',
    status: LeadStatus.negotiating,
    leadSource: LeadSource.referral,
    interestedPropertyType: PropertyType.apartment,
    budgetRange: 'R$ 280 mil – 330 mil',
    preferredLocation: 'Malhado, Ilhéus',
    purpose: LeadPurpose.buying,
    latestFollowUp: '2026-08-07',
    nextFollowUp: '2026-08-21',
    notes: 'Sinal pago; saldo via transferência.',
    propertyKey: 'apto-malhado',
    deal: {
      stage: DealStage.payment_confirmed,
      type: TransactionType.SALE,
      transaction: {
        status: TransactionStatus.CONTRACT_SIGNED,
        paymentMethod: TransactionPaymentMethod.transfer,
        commissionPercent: 6,
      },
    },
  },
  {
    key: 'larissa',
    name: 'Larissa Costa',
    email: 'larissa.costa@email.com',
    phone: '(73) 99101-1011',
    city: 'Ilhéus',
    state: 'BA',
    status: LeadStatus.closed_won,
    leadSource: LeadSource.social,
    interestedPropertyType: PropertyType.villa,
    budgetRange: 'R$ 1,7 mi – 2 mi',
    preferredLocation: 'Olivença',
    purpose: LeadPurpose.buying,
    latestFollowUp: '2026-07-30',
    nextFollowUp: '2026-08-30',
    notes: 'Venda concluída — chaves entregues.',
    propertyKey: 'villa-olivencia',
    deal: {
      stage: DealStage.handover,
      type: TransactionType.SALE,
      transaction: {
        status: TransactionStatus.COMPLETED,
        paymentMethod: TransactionPaymentMethod.pix,
        commissionPercent: 6,
      },
    },
  },
  {
    key: 'thiago',
    name: 'Thiago Mendes',
    email: 'thiago.mendes@email.com',
    phone: '(73) 99101-1012',
    city: 'Ilhéus',
    state: 'BA',
    status: LeadStatus.closed_won,
    leadSource: LeadSource.website,
    interestedPropertyType: PropertyType.apartment,
    budgetRange: 'R$ 450 mil – 520 mil',
    preferredLocation: 'Centro, Ilhéus',
    purpose: LeadPurpose.buying,
    latestFollowUp: '2026-07-28',
    nextFollowUp: '2026-09-01',
    notes: 'Loft escriturado e entregue.',
    propertyKey: 'loft-centro',
    deal: {
      stage: DealStage.handover,
      type: TransactionType.SALE,
      transaction: {
        status: TransactionStatus.COMPLETED,
        paymentMethod: TransactionPaymentMethod.fgts,
        commissionPercent: 5,
      },
    },
  },
  {
    key: 'beatriz',
    name: 'Beatriz Nascimento',
    email: 'beatriz.nascimento@email.com',
    phone: '(73) 99200-2001',
    city: 'Itabuna',
    state: 'BA',
    status: LeadStatus.scheduled_visit,
    leadSource: LeadSource.referral,
    interestedPropertyType: PropertyType.apartment,
    budgetRange: 'R$ 2,5 mil – 3 mil / mês',
    preferredLocation: 'Pontal, Ilhéus',
    purpose: LeadPurpose.renting,
    latestFollowUp: '2026-08-16',
    nextFollowUp: '2026-08-19',
    notes: 'Visita ao apto mobiliado de Pontal.',
    propertyKey: 'apto-pontal-aluguel',
    visit: {
      title: 'Visita — Apto Pontal',
      startsAt: '2026-08-19T13:00:00-03:00',
      endsAt: '2026-08-19T14:00:00-03:00',
      location: 'Rua 2 de Julho, 55 — Pontal',
    },
  },
  {
    key: 'gabriel',
    name: 'Gabriel Ferreira',
    email: 'gabriel.ferreira@email.com',
    phone: '(73) 99200-2002',
    city: 'Ilhéus',
    state: 'BA',
    status: LeadStatus.scheduled_visit,
    leadSource: LeadSource.whatsapp,
    interestedPropertyType: PropertyType.house,
    budgetRange: 'R$ 900 mil – 1,1 mi',
    preferredLocation: 'Hernani Sá',
    purpose: LeadPurpose.buying,
    latestFollowUp: '2026-08-17',
    nextFollowUp: '2026-08-20',
    notes: 'Quer ver a casa no condomínio.',
    propertyKey: 'casa-hernani',
    visit: {
      title: 'Visita — Casa Hernani Sá',
      startsAt: '2026-08-20T10:00:00-03:00',
      endsAt: '2026-08-20T11:00:00-03:00',
      location: 'Rua das Palmeiras, 88',
    },
  },
  {
    key: 'helena',
    name: 'Helena Barbosa',
    email: 'helena.barbosa@email.com',
    phone: '(73) 99200-2003',
    city: 'Ilhéus',
    state: 'BA',
    status: LeadStatus.scheduled_visit,
    leadSource: LeadSource.ads,
    interestedPropertyType: PropertyType.house,
    budgetRange: 'R$ 1,2 mi – 1,4 mi',
    preferredLocation: 'Praia do Sul',
    purpose: LeadPurpose.buying,
    latestFollowUp: '2026-08-15',
    nextFollowUp: '2026-08-21',
    notes: 'Família vindo de Salvador no fim de semana.',
    propertyKey: 'casa-praia-sul',
    visit: {
      title: 'Visita — Casa Praia do Sul',
      startsAt: '2026-08-21T16:00:00-03:00',
      endsAt: '2026-08-21T17:00:00-03:00',
      location: 'Alameda Atlântica, 12',
    },
  },
  {
    key: 'igor',
    name: 'Igor Carvalho',
    email: 'igor.carvalho@email.com',
    phone: '(73) 99200-2004',
    city: 'Itabuna',
    state: 'BA',
    status: LeadStatus.scheduled_visit,
    leadSource: LeadSource.walk_in,
    interestedPropertyType: PropertyType.commercial,
    budgetRange: 'R$ 3 mil – 4 mil / mês',
    preferredLocation: 'Centro, Itabuna',
    purpose: LeadPurpose.renting,
    latestFollowUp: '2026-08-14',
    nextFollowUp: '2026-08-22',
    notes: 'Sala para escritório de advocacia.',
    propertyKey: 'comercial-itabuna',
    visit: {
      title: 'Visita — Sala Centro Itabuna',
      startsAt: '2026-08-22T09:30:00-03:00',
      endsAt: '2026-08-22T10:00:00-03:00',
      location: 'Av. Cinquentenário, 220',
    },
  },
  {
    key: 'mariana',
    name: 'Mariana Souza',
    email: 'mariana.souza@email.com',
    phone: '(73) 99300-3001',
    city: 'Ilhéus',
    state: 'BA',
    status: LeadStatus.new,
    leadSource: LeadSource.website,
    interestedPropertyType: PropertyType.apartment,
    budgetRange: 'R$ 250 mil – 300 mil',
    preferredLocation: 'Nelson Costa',
    purpose: LeadPurpose.buying,
    latestFollowUp: '2026-08-17',
    nextFollowUp: '2026-08-24',
    notes: 'Lead do site — ainda sem contato telefônico.',
    propertyKey: 'apto-nelson',
  },
  {
    key: 'lucas',
    name: 'Lucas Pereira',
    email: 'lucas.pereira@email.com',
    phone: '(73) 99300-3002',
    city: 'Ilhéus',
    state: 'BA',
    status: LeadStatus.new,
    leadSource: LeadSource.ads,
    interestedPropertyType: PropertyType.land,
    budgetRange: 'R$ 150 mil – 200 mil',
    preferredLocation: 'Salobrinho',
    purpose: LeadPurpose.buying,
    latestFollowUp: '2026-08-16',
    nextFollowUp: '2026-08-23',
    notes: 'Interesse em terreno para construir.',
    propertyKey: 'terreno-salobrinho',
  },
  {
    key: 'sofia',
    name: 'Sofia Andrade',
    email: 'sofia.andrade@email.com',
    phone: '(73) 99300-3003',
    city: 'Ilhéus',
    state: 'BA',
    status: LeadStatus.new,
    leadSource: LeadSource.social,
    interestedPropertyType: PropertyType.apartment,
    budgetRange: 'R$ 2,5 mil – 3,2 mil / mês',
    preferredLocation: 'Pontal',
    purpose: LeadPurpose.renting,
    latestFollowUp: '2026-08-18',
    nextFollowUp: '2026-08-25',
    notes: 'Instagram — pergunta sobre pets.',
  },
  {
    key: 'andre',
    name: 'André Teixeira',
    email: 'andre.teixeira@email.com',
    phone: '(73) 99300-3004',
    city: 'Ilhéus',
    state: 'BA',
    status: LeadStatus.new,
    leadSource: LeadSource.whatsapp,
    interestedPropertyType: PropertyType.house,
    budgetRange: 'R$ 600 mil – 800 mil',
    preferredLocation: 'Iguape / Pontal',
    purpose: LeadPurpose.buying,
    latestFollowUp: '2026-08-18',
    nextFollowUp: '2026-08-27',
    notes: 'Pediu opções com 3 quartos e quintal.',
  },
  {
    key: 'carla',
    name: 'Carla Mendes',
    email: 'carla.mendes.lead@email.com',
    phone: '(73) 99400-4001',
    city: 'Ilhéus',
    state: 'BA',
    status: LeadStatus.cancelled,
    leadSource: LeadSource.walk_in,
    interestedPropertyType: PropertyType.apartment,
    budgetRange: 'R$ 300 mil – 400 mil',
    preferredLocation: 'Centro',
    purpose: LeadPurpose.buying,
    latestFollowUp: '2026-07-20',
    nextFollowUp: '2026-08-01',
    notes: 'Desistiu — comprou direto com o proprietário.',
  },
  {
    key: 'felipe',
    name: 'Felipe Araujo',
    email: 'felipe.araujo@email.com',
    phone: '(73) 99400-4002',
    city: 'Itabuna',
    state: 'BA',
    status: LeadStatus.cancelled,
    leadSource: LeadSource.ads,
    interestedPropertyType: PropertyType.house,
    budgetRange: 'R$ 500 mil – 600 mil',
    preferredLocation: 'Ilhéus',
    purpose: LeadPurpose.buying,
    latestFollowUp: '2026-07-12',
    nextFollowUp: '2026-07-25',
    notes: 'Crédito recusado no banco.',
  },
  {
    key: 'natalia',
    name: 'Natália Ribeiro',
    email: 'natalia.ribeiro@email.com',
    phone: '(73) 99500-5001',
    city: 'Ilhéus',
    state: 'BA',
    status: LeadStatus.negotiating,
    leadSource: LeadSource.referral,
    interestedPropertyType: PropertyType.house,
    budgetRange: 'R$ 900 mil – 1,1 mi',
    preferredLocation: 'Hernani Sá',
    purpose: LeadPurpose.buying,
    latestFollowUp: '2026-08-14',
    nextFollowUp: '2026-08-28',
    notes: 'Comparando duas casas; ainda sem imóvel oficial no funil.',
    propertyKey: 'casa-hernani',
  },
  {
    key: 'vinicius',
    name: 'Vinícius Lopes',
    email: 'vinicius.lopes@email.com',
    phone: '(73) 99500-5002',
    city: 'Ilhéus',
    state: 'BA',
    status: LeadStatus.negotiating,
    leadSource: LeadSource.website,
    interestedPropertyType: PropertyType.apartment,
    budgetRange: 'R$ 250 mil – 280 mil',
    preferredLocation: 'Nelson Costa',
    purpose: LeadPurpose.buying,
    latestFollowUp: '2026-08-13',
    nextFollowUp: '2026-08-22',
    notes: 'Pediu desconto no apto Nelson Costa.',
    propertyKey: 'apto-nelson',
  },
];

function atNoon(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00.000Z`);
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter((part) => part.length > 0 && part[0] === part[0].toUpperCase())
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function percentToAmount(totalCents: number, percent: number): number {
  return Math.round((totalCents * percent) / 100);
}

function buildSplit(grossValueCents: number, commissionPercent: number) {
  const totalCommissionCents = percentToAmount(
    grossValueCents,
    commissionPercent,
  );
  return {
    agencyPercent: AGENCY,
    captorPercent: CAPTOR,
    sellerPercent: SELLER,
    agencyAmountCents: percentToAmount(totalCommissionCents, AGENCY),
    captorAmountCents: percentToAmount(totalCommissionCents, CAPTOR),
    sellerAmountCents: percentToAmount(totalCommissionCents, SELLER),
    totalCommissionCents,
  };
}

function dealStatusFor(stage: DealStage): DealStatus {
  return stage === DealStage.handover ? DealStatus.won : DealStatus.active;
}

function dealTitle(leadName: string, propertyName: string | undefined): string {
  return propertyName
    ? `Negócio — ${leadName} · ${propertyName}`
    : `Negócio — ${leadName}`;
}

export async function seedDemoCatalog(
  prisma: PrismaClient,
  ctx: SeedStoreContext,
): Promise<{
  properties: number;
  leads: number;
  deals: number;
  transactions: number;
  appointments: number;
}> {
  const propertyIds = new Map<string, string>();
  let propertiesCreated = 0;

  for (const property of DEMO_PROPERTIES) {
    const existing = await prisma.property.findFirst({
      where: { storeId: ctx.storeId, name: property.name },
      select: { id: true },
    });
    if (existing) {
      propertyIds.set(property.key, existing.id);
      continue;
    }

    const created = await prisma.property.create({
      data: {
        storeId: ctx.storeId,
        agentId: ctx.agentId,
        name: property.name,
        city: property.city,
        state: property.state,
        type: property.type,
        listingType: property.listingType,
        status: property.status,
        cost: property.cost,
        bedrooms: property.bedrooms,
        floors: property.floors,
        sizeSqm: property.sizeSqm,
        yearBuilt: property.yearBuilt,
        address: property.address,
        zipCode: property.zipCode,
        mapCoordinate: property.mapCoordinate,
        description: property.description,
        highlights: [...property.highlights],
        negotiable: property.negotiable,
        views: property.views,
        country: 'Brasil',
        units: 1,
      },
      select: { id: true },
    });
    propertyIds.set(property.key, created.id);
    propertiesCreated += 1;
  }

  let leadsCreated = 0;
  let dealsCreated = 0;
  let transactionsCreated = 0;
  let appointmentsCreated = 0;

  for (const lead of DEMO_LEADS) {
    const existing = await prisma.lead.findFirst({
      where: { storeId: ctx.storeId, email: lead.email },
    });

    const propertyId = lead.propertyKey
      ? propertyIds.get(lead.propertyKey)
      : undefined;
    const propertyName = lead.propertyKey
      ? DEMO_PROPERTIES.find((item) => item.key === lead.propertyKey)?.name
      : undefined;

    const leadRow =
      existing ??
      (await prisma.lead.create({
        data: {
          storeId: ctx.storeId,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          city: lead.city,
          state: lead.state,
          status: lead.status,
          leadSource: lead.leadSource,
          interestedPropertyType: lead.interestedPropertyType,
          budgetRange: lead.budgetRange,
          preferredLocation: lead.preferredLocation,
          purpose: lead.purpose,
          latestFollowUp: atNoon(lead.latestFollowUp),
          nextFollowUp: atNoon(lead.nextFollowUp),
          notes: lead.notes,
          propertyName,
          agentId: ctx.agentId,
          activities: {
            create: [
              {
                type: LeadActivityType.system,
                message: 'Lead criado',
                createdAt: atNoon(lead.latestFollowUp),
              },
            ],
          },
          agents: { create: [{ agentId: ctx.agentId }] },
          ...(propertyId && propertyName
            ? {
                matchedProperties: {
                  create: [
                    {
                      propertyId,
                      propertyName,
                      sortOrder: 0,
                    },
                  ],
                },
              }
            : {}),
        },
      }));

    if (!existing) leadsCreated += 1;

    if (propertyId && propertyName) {
      const alreadyLinked = await prisma.propertyActiveLead.findFirst({
        where: { propertyId, leadId: leadRow.id },
        select: { id: true },
      });
      if (!alreadyLinked) {
        await prisma.propertyActiveLead.create({
          data: {
            propertyId,
            leadId: leadRow.id,
            name: lead.name,
            initials: initialsOf(lead.name),
            sortOrder: 0,
          },
        });
        await prisma.property.update({
          where: { id: propertyId },
          data: { totalActiveLeads: { increment: 1 } },
        });
      }

      const alreadyMatched = await prisma.leadMatchedProperty.findFirst({
        where: { leadId: leadRow.id, propertyId },
        select: { id: true },
      });
      if (existing && !alreadyMatched) {
        await prisma.leadMatchedProperty.create({
          data: {
            leadId: leadRow.id,
            propertyId,
            propertyName,
            sortOrder: 0,
          },
        });
      }
    }

    if (lead.deal) {
      const existingDeal = await prisma.deal.findFirst({
        where: { storeId: ctx.storeId, leadId: leadRow.id },
        select: { id: true },
      });
      if (!existingDeal) {
        const createdDeal = await prisma.deal.create({
          data: {
            storeId: ctx.storeId,
            leadId: leadRow.id,
            leadName: lead.name,
            propertyId: propertyId ?? null,
            propertyName: propertyName ?? '',
            type: lead.deal.type,
            status: dealStatusFor(lead.deal.stage),
            stage: lead.deal.stage,
            title: dealTitle(lead.name, propertyName),
            agentId: ctx.agentId,
          },
        });
        dealsCreated += 1;

        const tx = lead.deal.transaction;
        if (tx) {
          const grossValueCents = Math.round((propertyName
            ? (DEMO_PROPERTIES.find((item) => item.key === lead.propertyKey)
                ?.cost ?? 0)
            : 0) * 100);
          const split = buildSplit(grossValueCents, tx.commissionPercent);
          const prefix =
            lead.deal.type === TransactionType.RENTAL ? 'Locação' : 'Venda';
          await prisma.transaction.create({
            data: {
              storeId: ctx.storeId,
              type: lead.deal.type,
              status: tx.status,
              title: `${prefix} — ${propertyName ?? lead.name}`,
              propertyId: propertyId ?? null,
              propertyName: propertyName ?? lead.name,
              leadId: leadRow.id,
              leadName: lead.name,
              dealId: createdDeal.id,
              captorId: ctx.agentId,
              sellerId: ctx.agentId,
              grossValueCents,
              paymentMethod: tx.paymentMethod,
              commissionPercent: tx.commissionPercent,
              ...split,
              splitOthers: [],
              splitSource: 'GLOBAL',
              rentalLandlordName: tx.rental?.landlordName,
              rentalTenantName: tx.rental?.tenantName,
              rentalBaseRentCents: tx.rental ? grossValueCents : null,
              rentalCondoCents: tx.rental?.condoCents,
              rentalIptuCents: tx.rental?.iptuCents,
              rentalAdminFeePercent: tx.rental?.adminFeePercent,
              rentalDueDay: tx.rental?.dueDay,
              rentalPayoutStatus: tx.rental ? 'AWAITING_PAYMENT' : null,
              rentalReceivedCents: tx.rental ? 0 : null,
              activities: {
                create: [
                  {
                    at: atNoon(lead.latestFollowUp),
                    actorName: ctx.actorName,
                    message:
                      tx.status === TransactionStatus.COMPLETED
                        ? 'Negócio concluído — comissões liberadas.'
                        : 'Negócio criado no funil de vendas.',
                  },
                ],
              },
            },
          });
          transactionsCreated += 1;
        }
      }
    }

    if (lead.visit) {
      const existingVisit = await prisma.appointment.findFirst({
        where: {
          storeId: ctx.storeId,
          leadId: leadRow.id,
          kind: AppointmentKind.visit,
        },
        select: { id: true },
      });
      if (!existingVisit) {
        await prisma.appointment.create({
          data: {
            storeId: ctx.storeId,
            title: lead.visit.title,
            description: lead.notes,
            startsAt: new Date(lead.visit.startsAt),
            endsAt: new Date(lead.visit.endsAt),
            location: lead.visit.location,
            kind: AppointmentKind.visit,
            agentId: ctx.agentId,
            done: false,
            leadId: leadRow.id,
            leadName: lead.name,
            leadEmail: lead.email,
            leadPhone: lead.phone,
            propertyId: propertyId ?? null,
          },
        });
        appointmentsCreated += 1;
      }
    }
  }

  return {
    properties: propertiesCreated,
    leads: leadsCreated,
    deals: dealsCreated,
    transactions: transactionsCreated,
    appointments: appointmentsCreated,
  };
}
