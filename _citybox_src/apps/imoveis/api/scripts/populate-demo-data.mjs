#!/usr/bin/env node
/**
 * Popula loja Imóveis via API (local/prod) — 50 leads + 30 imóveis.
 *
 * Uso:
 *   ACCESS_TOKEN=... STORE_ID=... AGENT_ID=daniel-lopes \
 *   API_BASE=http://127.0.0.1:3112/api \
 *   node apps/imoveis/api/scripts/populate-demo-data.mjs
 *
 * Não versiona senhas. Token via ROPC/PKCE fora deste arquivo.
 */
const API_BASE = (process.env.API_BASE ?? 'http://127.0.0.1:3112/api').replace(
  /\/$/,
  '',
);
const TOKEN = process.env.ACCESS_TOKEN?.trim();
const STORE_ID = process.env.STORE_ID?.trim();
const AGENT_ID = process.env.AGENT_ID?.trim() || 'daniel-lopes';
const LEAD_COUNT = Number(process.env.LEAD_COUNT ?? 50);
const PROPERTY_COUNT = Number(process.env.PROPERTY_COUNT ?? 30);

if (!TOKEN || !STORE_ID) {
  console.error('ACCESS_TOKEN e STORE_ID são obrigatórios');
  process.exit(1);
}

const FIRST = [
  'Ana',
  'Bruno',
  'Carla',
  'Diego',
  'Elena',
  'Fábio',
  'Gabriela',
  'Henrique',
  'Isabela',
  'João',
  'Karina',
  'Lucas',
  'Marina',
  'Nicolas',
  'Olívia',
  'Paulo',
  'Queila',
  'Rafael',
  'Sofia',
  'Thiago',
  'Úrsula',
  'Vitor',
  'Wendy',
  'Xavier',
  'Yasmin',
  'Zeca',
];
const LAST = [
  'Almeida',
  'Barbosa',
  'Costa',
  'Dias',
  'Esteves',
  'Ferreira',
  'Gomes',
  'Henriques',
  'Ibrahim',
  'Jesus',
  'Klein',
  'Lima',
  'Moura',
  'Nascimento',
  'Oliveira',
  'Pereira',
  'Queiroz',
  'Rocha',
  'Santos',
  'Teixeira',
  'Uchoa',
  'Vieira',
  'Wagner',
  'Xavier',
  'Yamamoto',
  'Zanetti',
];
const CITIES = [
  ['Ilhéus', 'BA'],
  ['Itabuna', 'BA'],
  ['Salvador', 'BA'],
  ['Porto Seguro', 'BA'],
  ['Una', 'BA'],
];
const STATUSES = [
  'new',
  'negotiating',
  'scheduled-visit',
  'closed-won',
  'cancelled',
];
const SOURCES = [
  'walk-in',
  'website',
  'referral',
  'social',
  'ads',
  'whatsapp',
];
const PROP_TYPES = ['house', 'apartment', 'villa', 'land', 'commercial'];
const PURPOSES = ['buying', 'renting', 'selling'];
const BUDGETS = [
  'Até R$ 250 mil',
  'R$ 250–400 mil',
  'R$ 400–600 mil',
  'R$ 600–900 mil',
  'Acima de R$ 1 mi',
  'Aluguel até R$ 2.500',
  'Aluguel R$ 2.500–4.000',
];
const LOCATIONS = [
  'Centro / Pontal',
  'São Francisco',
  'Nelson Costa',
  'Conquista',
  'Olivença',
  'Jardim Atlântico',
];
const HIGHLIGHTS_POOL = [
  'Varanda gourmet',
  '2 vagas cobertas',
  'Área de lazer completa',
  'Vista mar',
  'Mobiliado',
  'Aceita financiamento',
  'Pronto para morar',
  'Energia solar',
  'Piscina',
  'Churrasqueira',
  'Portaria 24h',
  'Próximo à praia',
];
const STREETS = [
  'Rua Castro Alves',
  'Av. Soares Lopes',
  'Rua Jorge Amado',
  'Travessa do Porto',
  'Rua Dom Eduardo',
  'Av. Itabuna',
];

function isoDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function isoDateTime(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

function pick(arr, i) {
  return arr[i % arr.length];
}

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

async function api(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'X-Store-Id': STORE_ID,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(`${method} ${path} → ${res.status}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

function buildProperty(i) {
  const type = pick(PROP_TYPES, i);
  const listingType = i % 3 === 0 ? 'rent' : 'sale';
  const [city, state] = pick(CITIES, i);
  const street = pick(STREETS, i);
  const bedrooms = type === 'land' ? 0 : 1 + (i % 4);
  const sizeSqm =
    type === 'land' ? 300 + i * 15 : type === 'commercial' ? 80 + i * 5 : 45 + i * 8;
  const cost =
    listingType === 'rent'
      ? 1800 + i * 120
      : type === 'land'
        ? 180_000 + i * 12_000
        : 280_000 + i * 35_000;
  const highlights = [
    pick(HIGHLIGHTS_POOL, i),
    pick(HIGHLIGHTS_POOL, i + 3),
    pick(HIGHLIGHTS_POOL, i + 7),
    pick(HIGHLIGHTS_POOL, i + 11),
  ].filter((v, idx, arr) => arr.indexOf(v) === idx);

  return {
    name: `${type === 'apartment' ? 'Apto' : type === 'house' ? 'Casa' : type === 'villa' ? 'Villa' : type === 'land' ? 'Terreno' : 'Sala'} Demo ${String(i + 1).padStart(2, '0')} — ${street}`,
    city,
    state,
    type,
    units: type === 'apartment' ? 1 + (i % 3) : 1,
    cost,
    views: 40 + i * 7,
    status: 'available',
    occupiedUnits: 0,
    listingType,
    negotiable: i % 2 === 0,
    bedrooms,
    floors: type === 'apartment' ? 1 + (i % 8) : type === 'house' ? 1 + (i % 2) : 1,
    sizeSqm,
    yearBuilt: 1998 + (i % 26),
    address: `${street}, ${100 + i}`,
    country: 'Brasil',
    zipCode: `4565${String(i % 10).padStart(1, '0')}-0${String(10 + (i % 80)).padStart(2, '0')}`,
    mapCoordinate: `-14.79${i % 10},-39.03${i % 10}`,
    typeCode: `DEMO-${String(i + 1).padStart(3, '0')}`,
    description: `Imóvel de demonstração ${i + 1} em ${city}/${state}. ${bedrooms ? `${bedrooms} quarto(s), ` : ''}${sizeSqm} m², ${listingType === 'sale' ? 'à venda' : 'para alugar'}. Ideal para apresentações e testes locais.`,
    highlights,
    agentId: AGENT_ID,
    totalActiveLeads: 0,
    activeLeads: [],
  };
}

function buildLead(i, matchedProperties) {
  const first = pick(FIRST, i);
  const last = pick(LAST, i + 5);
  const name = `${first} ${last}`;
  const [city, state] = pick(CITIES, i + 2);
  const status = pick(STATUSES, i);
  const purpose = pick(PURPOSES, i);
  const matched =
    i % 5 < 2 && matchedProperties.length > 0
      ? [pick(matchedProperties, i)].map((p) => ({ id: p.id, name: p.name }))
      : [];

  return {
    name,
    email: `${first.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')}.${last.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')}.demo${i + 1}@example.com`,
    phone: `(73) 9${String(8000 + (i % 1000)).padStart(4, '0')}-${String(1000 + i).padStart(4, '0')}`,
    city,
    state,
    status,
    leadSource: pick(SOURCES, i),
    interestedPropertyType: pick(PROP_TYPES, i),
    budgetRange: pick(BUDGETS, i),
    preferredLocation: pick(LOCATIONS, i),
    purpose,
    latestFollowUp: status === 'new' ? null : isoDate(-((i % 10) + 1)),
    nextFollowUp:
      status === 'closed-won' || status === 'cancelled'
        ? null
        : isoDate((i % 14) + 1),
    notes: `Lead demo local #${i + 1}. Interesse em ${purpose}. Contato preferencial WhatsApp.`,
    photoUrl: null,
    propertyName: matched[0]?.name ?? null,
    hasSuggestion: matched.length > 0,
    agentId: AGENT_ID,
    agentIds: [AGENT_ID],
    matchedProperties: matched,
    documents: [
      {
        name: 'RG (cópia).pdf',
        sizeLabel: '240 KB',
        kind: 'other',
        addedAt: isoDate(-3),
      },
      {
        name: 'Comprovante de renda.pdf',
        sizeLabel: '180 KB',
        kind: 'other',
        addedAt: isoDate(-2),
      },
    ],
    activities: [
      {
        type: 'system',
        message: 'Lead criado via script de população local',
        authorName: 'Sistema',
        createdAt: isoDateTime(-1),
      },
      {
        type: 'note',
        message: `Primeiro contato com ${first}. Orçamento: ${pick(BUDGETS, i)}.`,
        authorName: 'Daniel Lopes',
        createdAt: isoDateTime(0),
      },
    ],
  };
}

async function main() {
  console.log(
    `API=${API_BASE} store=${STORE_ID} agent=${AGENT_ID} properties=${PROPERTY_COUNT} leads=${LEAD_COUNT}`,
  );

  const createdProperties = [];
  for (let i = 0; i < PROPERTY_COUNT; i++) {
    const body = buildProperty(i);
    const res = await api('POST', '/v1/properties', body);
    const data = res?.data ?? res;
    createdProperties.push({ id: data.id, name: data.name });
    process.stdout.write(`P${i + 1} `);
  }
  console.log(`\n✓ ${createdProperties.length} imóveis`);

  let leadsOk = 0;
  for (let i = 0; i < LEAD_COUNT; i++) {
    const body = buildLead(i, createdProperties);
    const res = await api('POST', '/v1/leads', body);
    if (res?.data?.id || res?.id) leadsOk += 1;
    process.stdout.write(`L${i + 1} `);
  }
  console.log(`\n✓ ${leadsOk} leads`);

  const leadsList = await api(
    'GET',
    `/v1/leads?page=1&perPage=5&agentId=${encodeURIComponent(AGENT_ID)}`,
  );
  const propsList = await api(
    'GET',
    `/v1/properties?page=1&perPage=5&agentId=${encodeURIComponent(AGENT_ID)}`,
  );
  console.log(
    `Totais listagem agent=${AGENT_ID}: leads=${leadsList?.meta?.total ?? '?'} properties=${propsList?.meta?.total ?? '?'}`,
  );
}

main().catch((err) => {
  console.error(err.message);
  if (err.body) console.error(JSON.stringify(err.body, null, 2));
  process.exit(1);
});
