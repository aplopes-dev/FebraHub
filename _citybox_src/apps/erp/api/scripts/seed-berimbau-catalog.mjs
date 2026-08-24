#!/usr/bin/env node
/**
 * Seed ponta a ponta (catálogo + estoque) para a org Berimbau via erp-api.
 * Uso: node scripts/seed-berimbau-catalog.mjs
 *
 * Requer AUTH_DEV_BYPASS + Bearer dev-admin (ou TOKEN no env).
 */
const BASE = process.env.ERP_API_URL?.replace(/\/$/, '') || 'http://127.0.0.1:3114/api';
const ORG = process.env.ORG_ID || '8cdd57eb-98d8-4695-9eef-a62da63fd1d4';
const BRANCH = process.env.BRANCH_ID || '50302e19-5d89-4032-8ab1-39a97ab99975';
const TOKEN = process.env.ERP_TOKEN || 'dev-admin';

const state = {
  ok: [],
  fail: [],
  ids: {
    categories: {},
    uom: {},
    variations: {},
    products: {},
    stockId: null,
    entradaCategoryId: null,
    supplierId: null,
  },
};

function log(step, msg) {
  console.log(`[${step}] ${msg}`);
}

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'X-Organization-Id': ORG,
      'X-Branch-Id': BRANCH,
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
    const err = new Error(
      `${method} ${path} → ${res.status}: ${JSON.stringify(json)?.slice(0, 500)}`,
    );
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

function unwrap(res) {
  return res?.data ?? res;
}

async function step(name, fn) {
  try {
    const result = await fn();
    state.ok.push(name);
    log('OK', name);
    return result;
  } catch (e) {
    state.fail.push({ name, message: e.message, status: e.status, body: e.body });
    log('FAIL', `${name}: ${e.message}`);
    throw e;
  }
}

async function ensureCategories() {
  const existing = unwrap(await api('GET', '/v1/product-categories?perPage=100'));
  for (const c of existing) state.ids.categories[c.name] = c.id;

  const names = [
    'Bebidas',
    'Lanches',
    'Pratos',
    'Sobremesas',
    'Acompanhamentos',
    'Insumos',
    'Porções',
  ];
  for (const name of names) {
    if (state.ids.categories[name]) continue;
    const created = unwrap(
      await api('POST', '/v1/product-categories', { name, active: true }),
    );
    state.ids.categories[name] = created.id;
  }
}

async function loadUom() {
  const list = unwrap(await api('GET', '/v1/units-of-measure?active=true&perPage=100'));
  for (const u of list) state.ids.uom[u.abbreviation] = u.id;
}

async function loadStock() {
  const list = unwrap(await api('GET', '/v1/stocks?perPage=20'));
  const def = list.find((s) => s.isDefault) || list[0];
  if (!def) throw new Error('Nenhum depósito encontrado');
  state.ids.stockId = def.id;

  const cats = unwrap(await api('GET', '/v1/movement-categories/options?type=entrada'));
  const entrada = cats.find((c) => /entrada avulsa/i.test(c.name)) || cats[0];
  if (!entrada) throw new Error('Sem categoria de movimentação de entrada');
  state.ids.entradaCategoryId = entrada.id;
}

async function ensureVariations() {
  const existing = unwrap(await api('GET', '/v1/variations?perPage=100'));
  for (const v of existing) state.ids.variations[v.name] = v;

  const defs = [
    {
      name: 'Tamanho',
      calculation: {
        chooseFrom: 1,
        chooseTo: 1,
        chargeFromSelectedQuantity: false,
        chargeFromQuantity: 0,
        priceMethod: 'sum',
      },
      options: [
        { name: 'P', priceCents: 0, code: 'P', sortOrder: 0 },
        { name: 'M', priceCents: 300, code: 'M', sortOrder: 1 },
        { name: 'G', priceCents: 600, code: 'G', sortOrder: 2 },
      ],
    },
    {
      name: 'Ponto da carne',
      calculation: {
        chooseFrom: 1,
        chooseTo: 1,
        chargeFromSelectedQuantity: false,
        chargeFromQuantity: 0,
        priceMethod: 'sum',
      },
      options: [
        { name: 'Mal passado', priceCents: 0, sortOrder: 0 },
        { name: 'Ao ponto', priceCents: 0, sortOrder: 1 },
        { name: 'Bem passado', priceCents: 0, sortOrder: 2 },
      ],
    },
    {
      name: 'Molhos',
      calculation: {
        chooseFrom: 0,
        chooseTo: 3,
        chargeFromSelectedQuantity: true,
        chargeFromQuantity: 1,
        priceMethod: 'sum',
      },
      options: [
        { name: 'Barbecue', priceCents: 200, sortOrder: 0 },
        { name: 'Mostarda e mel', priceCents: 200, sortOrder: 1 },
        { name: 'Maionese da casa', priceCents: 250, sortOrder: 2 },
        { name: 'Pimenta', priceCents: 150, sortOrder: 3 },
      ],
    },
  ];

  for (const def of defs) {
    if (state.ids.variations[def.name]) continue;
    const created = unwrap(await api('POST', '/v1/variations', def));
    state.ids.variations[def.name] = created;
  }

  // refresh to get option ids
  const refreshed = unwrap(await api('GET', '/v1/variations?perPage=100'));
  for (const v of refreshed) {
    const detail = unwrap(await api('GET', `/v1/variations/${v.id}`));
    state.ids.variations[v.name] = detail;
  }
}

async function ensureSupplier() {
  const list = unwrap(await api('GET', '/v1/suppliers?tab=active&perPage=20'));
  if (list.length) {
    state.ids.supplierId = list[0].id;
    return;
  }
  const created = unwrap(
    await api('POST', '/v1/suppliers', {
      personType: 'PJ',
      name: 'Atacado Costa do Cacau',
      legalName: 'Atacado Costa do Cacau LTDA',
      document: '11222333000181',
      email: 'compras@costadocacau.com.br',
      city: 'Ilhéus',
      state: 'BA',
      branchIds: [BRANCH],
    }),
  );
  state.ids.supplierId = created.id;
}

function cat(name) {
  const id = state.ids.categories[name];
  if (!id) throw new Error(`Categoria ausente: ${name}`);
  return id;
}
function uom(abbr) {
  const id = state.ids.uom[abbr];
  if (!id) throw new Error(`UoM ausente: ${abbr}`);
  return id;
}

function variationLink(name, optionNames) {
  const v = state.ids.variations[name];
  if (!v) throw new Error(`Variação ausente: ${name}`);
  const options = v.options || [];
  const optionIds = optionNames.map((n) => {
    const opt = options.find((o) => o.name === n);
    if (!opt) throw new Error(`Opção ${n} ausente em ${name}`);
    return opt.id;
  });
  return {
    variationId: v.id,
    optionIds,
    minChoices: 1,
    maxChoices: 1,
  };
}

async function createProduct(def) {
  if (state.ids.products[def.sku]) return state.ids.products[def.sku];
  // skip if already exists by sku search
  const found = unwrap(
    await api('GET', `/v1/products?search=${encodeURIComponent(def.sku)}&perPage=5`),
  );
  const hit = found.find((p) => p.sku === def.sku);
  if (hit) {
    state.ids.products[def.sku] = hit;
    return hit;
  }

  const body = {
    name: def.name,
    sku: def.sku,
    categoryId: cat(def.category),
    unitOfMeasureId: uom(def.unit),
    type: def.type,
    basePriceCents: def.priceCents,
    perishable: def.perishable ?? false,
    description: def.description ?? '',
    trackStock: def.trackStock ?? true,
    barcodes: def.barcodes ?? [],
    branchIds: [BRANCH],
    suppliers: state.ids.supplierId
      ? [{ supplierId: state.ids.supplierId, supplierCode: def.sku, conversion: 1 }]
      : [],
  };
  if (def.variationFormat && def.variations) {
    body.variationFormat = def.variationFormat;
    body.variations = def.variations;
  }
  const created = unwrap(await api('POST', '/v1/products', body));
  state.ids.products[def.sku] = created;
  return created;
}

async function ensureProducts() {
  const tamanhoAll = () =>
    variationLink('Tamanho', ['P', 'M', 'G']);
  const ponto = () => variationLink('Ponto da carne', ['Mal passado', 'Ao ponto', 'Bem passado']);
  const molhos = () => {
    const v = state.ids.variations['Molhos'];
    return {
      variationId: v.id,
      optionIds: v.options.map((o) => o.id),
      minChoices: 0,
      maxChoices: 3,
    };
  };

  /** Insumos (supply) — para fichas técnicas e produção */
  const supplies = [
    { name: 'Pão de hambúrguer', sku: 'INS-PAO-001', category: 'Insumos', unit: 'un', type: 'supply', priceCents: 120, trackStock: true },
    { name: 'Carne bovina moída', sku: 'INS-CAR-002', category: 'Insumos', unit: 'kg', type: 'supply', priceCents: 3200, trackStock: true, perishable: true },
    { name: 'Queijo mussarela', sku: 'INS-QUE-003', category: 'Insumos', unit: 'kg', type: 'supply', priceCents: 4500, trackStock: true, perishable: true },
    { name: 'Alface americana', sku: 'INS-ALF-004', category: 'Insumos', unit: 'un', type: 'supply', priceCents: 350, trackStock: true, perishable: true },
    { name: 'Tomate', sku: 'INS-TOM-005', category: 'Insumos', unit: 'kg', type: 'supply', priceCents: 800, trackStock: true, perishable: true },
    { name: 'Batata palito congelada', sku: 'INS-BAT-006', category: 'Insumos', unit: 'kg', type: 'supply', priceCents: 1500, trackStock: true },
    { name: 'Farinha de trigo', sku: 'INS-FAR-007', category: 'Insumos', unit: 'kg', type: 'supply', priceCents: 550, trackStock: true },
    { name: 'Óleo de soja', sku: 'INS-OLE-008', category: 'Insumos', unit: 'L', type: 'supply', priceCents: 890, trackStock: true },
    { name: 'Leite condensado', sku: 'INS-LEI-009', category: 'Insumos', unit: 'un', type: 'supply', priceCents: 620, trackStock: true },
    { name: 'Café em grãos', sku: 'INS-CAF-010', category: 'Insumos', unit: 'kg', type: 'supply', priceCents: 4200, trackStock: true },
  ];

  const finished = [
    {
      name: 'X-Burguer Clássico',
      sku: 'LAN-XBC-001',
      category: 'Lanches',
      unit: 'un',
      type: 'simple',
      priceCents: 1890,
      trackStock: true,
      perishable: true,
      description: 'Pão, carne, queijo, alface e tomate',
      variationFormat: 'grid',
      variations: [tamanhoAll(), molhos()],
    },
    {
      name: 'X-Bacon',
      sku: 'LAN-XBA-002',
      category: 'Lanches',
      unit: 'un',
      type: 'simple',
      priceCents: 2290,
      trackStock: true,
      perishable: true,
      variationFormat: 'grid',
      variations: [tamanhoAll()],
    },
    {
      name: 'X-Salada',
      sku: 'LAN-XSA-003',
      category: 'Lanches',
      unit: 'un',
      type: 'simple',
      priceCents: 1990,
      trackStock: true,
      perishable: true,
    },
    {
      name: 'Picanha na chapa',
      sku: 'PRA-PIC-004',
      category: 'Pratos',
      unit: 'un',
      type: 'simple',
      priceCents: 4590,
      trackStock: true,
      perishable: true,
      variationFormat: 'grid',
      variations: [ponto()],
    },
    {
      name: 'Filé de frango grelhado',
      sku: 'PRA-FRA-005',
      category: 'Pratos',
      unit: 'un',
      type: 'simple',
      priceCents: 3290,
      trackStock: true,
      perishable: true,
    },
    {
      name: 'Moqueca de peixe',
      sku: 'PRA-MOQ-006',
      category: 'Pratos',
      unit: 'un',
      type: 'simple',
      priceCents: 5290,
      trackStock: true,
      perishable: true,
      description: 'Peixe fresco, leite de coco e dendê',
    },
    {
      name: 'Batata frita',
      sku: 'ACO-BAT-007',
      category: 'Acompanhamentos',
      unit: 'un',
      type: 'simple',
      priceCents: 1290,
      trackStock: true,
      variationFormat: 'grid',
      variations: [tamanhoAll()],
    },
    {
      name: 'Onion rings',
      sku: 'ACO-ONI-008',
      category: 'Acompanhamentos',
      unit: 'un',
      type: 'simple',
      priceCents: 1490,
      trackStock: true,
    },
    {
      name: 'Refrigerante lata',
      sku: 'BEB-REF-009',
      category: 'Bebidas',
      unit: 'un',
      type: 'simple',
      priceCents: 650,
      trackStock: true,
    },
    {
      name: 'Suco de acerola',
      sku: 'BEB-ACE-010',
      category: 'Bebidas',
      unit: 'un',
      type: 'simple',
      priceCents: 900,
      trackStock: true,
      perishable: true,
      variationFormat: 'grid',
      variations: [tamanhoAll()],
    },
    {
      name: 'Água mineral 500ml',
      sku: 'BEB-AGU-011',
      category: 'Bebidas',
      unit: 'un',
      type: 'simple',
      priceCents: 400,
      trackStock: true,
    },
    {
      name: 'Café espresso',
      sku: 'BEB-CAF-012',
      category: 'Bebidas',
      unit: 'un',
      type: 'simple',
      priceCents: 550,
      trackStock: false,
    },
    {
      name: 'Pudim de leite',
      sku: 'SOB-PUD-013',
      category: 'Sobremesas',
      unit: 'un',
      type: 'simple',
      priceCents: 1200,
      trackStock: true,
      perishable: true,
    },
    {
      name: 'Brownie com sorvete',
      sku: 'SOB-BRO-014',
      category: 'Sobremesas',
      unit: 'un',
      type: 'simple',
      priceCents: 1600,
      trackStock: true,
      perishable: true,
    },
    {
      name: 'Porção de calabresa',
      sku: 'POR-CAL-015',
      category: 'Porções',
      unit: 'un',
      type: 'simple',
      priceCents: 2890,
      trackStock: true,
      perishable: true,
      variationFormat: 'grid',
      variations: [molhos()],
    },
    {
      name: 'Combo Família',
      sku: 'COL-FAM-016',
      category: 'Lanches',
      unit: 'cx',
      type: 'collection',
      priceCents: 8990,
      trackStock: false,
      description: '4 lanches + 2 batatas + 4 bebidas',
    },
  ];

  for (const def of [...supplies, ...finished]) {
    await createProduct(def);
  }
}

async function ensureTechnicalSheets() {
  const burger = state.ids.products['LAN-XBC-001'];
  const fries = state.ids.products['ACO-BAT-007'];
  const coffee = state.ids.products['BEB-CAF-012'];
  const supplies = {
    pao: state.ids.products['INS-PAO-001'],
    carne: state.ids.products['INS-CAR-002'],
    queijo: state.ids.products['INS-QUE-003'],
    alface: state.ids.products['INS-ALF-004'],
    tomate: state.ids.products['INS-TOM-005'],
    batata: state.ids.products['INS-BAT-006'],
    oleo: state.ids.products['INS-OLE-008'],
    cafe: state.ids.products['INS-CAF-010'],
  };

  const sheets = [
    {
      productId: burger.id,
      body: {
        productionType: 'productive_process',
        maxRemovableComponents: 2,
        markupPercent: 180,
        components: [
          { componentProductId: supplies.pao.id, optional: false, quantity: 1, sortOrder: 0 },
          { componentProductId: supplies.carne.id, optional: false, quantity: 0.15, sortOrder: 1 },
          { componentProductId: supplies.queijo.id, optional: false, quantity: 0.03, sortOrder: 2 },
          { componentProductId: supplies.alface.id, optional: true, quantity: 0.05, sortOrder: 3 },
          { componentProductId: supplies.tomate.id, optional: true, quantity: 0.04, sortOrder: 4 },
        ],
        optionComponents: [],
      },
    },
    {
      productId: fries.id,
      body: {
        productionType: 'productive_process',
        maxRemovableComponents: 0,
        markupPercent: 250,
        components: [
          { componentProductId: supplies.batata.id, optional: false, quantity: 0.2, sortOrder: 0 },
          { componentProductId: supplies.oleo.id, optional: false, quantity: 0.05, sortOrder: 1 },
        ],
        optionComponents: [],
      },
    },
    {
      productId: coffee.id,
      body: {
        productionType: 'automatic',
        maxRemovableComponents: 0,
        markupPercent: 300,
        components: [
          { componentProductId: supplies.cafe.id, optional: false, quantity: 0.018, sortOrder: 0 },
        ],
        optionComponents: [],
      },
    },
  ];

  for (const s of sheets) {
    await api('PUT', `/v1/technical-sheets/${s.productId}`, s.body);
  }
}

async function ensureStockMovements() {
  const trackableSkus = Object.values(state.ids.products)
    .filter((p) => p.trackStock)
    .map((p) => p.sku);

  // Entrada em lote — insumos + acabados
  const lines = [];
  for (const sku of trackableSkus) {
    const p = state.ids.products[sku];
    const qty = p.type === 'supply' ? '50' : '30';
    lines.push({
      productId: p.id,
      quantity: qty,
      costCents: Math.max(1, Math.round(p.basePriceCents * 0.4)),
    });
  }

  // API may limit lines — split in chunks of 15
  const today = new Date().toISOString().slice(0, 10);
  for (let i = 0; i < lines.length; i += 15) {
    const chunk = lines.slice(i, i + 15);
    await api('POST', '/v1/stock-movements', {
      stockId: state.ids.stockId,
      categoryId: state.ids.entradaCategoryId,
      type: 'entrada',
      operatedAt: today,
      lines: chunk,
    });
  }
}

async function ensurePurchase() {
  const supplies = ['INS-PAO-001', 'INS-CAR-002', 'INS-QUE-003', 'INS-BAT-006'].map(
    (sku) => state.ids.products[sku],
  );
  await api('POST', '/v1/purchases', {
    stockId: state.ids.stockId,
    supplierId: state.ids.supplierId,
    deliveryStatus: 'received',
    purchasedAt: new Date().toISOString().slice(0, 10),
    invoiceNumber: 'NF-BER-1001',
    series: '1',
    notes: 'Compra seed Berimbau',
    freightCents: 2500,
    discountsCents: 0,
    otherExpensesCents: 0,
    lines: supplies.map((p) => ({
      productId: p.id,
      quantity: '20',
      costCents: Math.max(1, Math.round(p.basePriceCents * 0.5)),
      status: 'received',
    })),
  });
}

async function ensureProduction() {
  const burger = state.ids.products['LAN-XBC-001'];
  const order = unwrap(
    await api('POST', '/v1/production-orders', {
      productId: burger.id,
      plannedQuantity: '10',
      sourceStockId: state.ids.stockId,
      destinationStockId: state.ids.stockId,
      expectedDate: new Date().toISOString().slice(0, 10),
      observation: 'Lote seed PDV',
    }),
  );
  await api('POST', `/v1/production-orders/${order.id}/start`, {});
  await api('POST', `/v1/production-orders/${order.id}/finalize`, {
    producedQuantity: '10',
    observation: 'Produção seed OK',
  });
  return order.id;
}

async function validate() {
  const products = await api('GET', '/v1/products?perPage=100');
  const supplies = await api('GET', '/v1/products?tab=supplies&perPage=100');
  const withVar = await api('GET', '/v1/products?tab=with_variants&perPage=100');
  const sheets = await api('GET', '/v1/technical-sheets?perPage=50');
  const balance = await api(
    'GET',
    `/v1/stocks/${state.ids.stockId}/balance?perPage=100`,
  );
  const movements = await api('GET', '/v1/stock-movements?perPage=20');
  const production = await api('GET', '/v1/production-orders?perPage=20');
  const purchases = await api('GET', '/v1/purchases?perPage=20');

  const summary = {
    products: products.meta?.total ?? products.data?.length,
    supplies: supplies.meta?.total ?? supplies.data?.length,
    withVariants: withVar.meta?.total ?? withVar.data?.length,
    technicalSheets: sheets.meta?.total ?? sheets.data?.length,
    balanceLines: balance.meta?.total ?? balance.data?.length,
    movements: movements.meta?.total ?? movements.data?.length,
    productionOrders: production.meta?.total ?? production.data?.length,
    purchases: purchases.meta?.total ?? purchases.data?.length,
  };

  console.log('\n=== RESUMO ===');
  console.log(JSON.stringify(summary, null, 2));

  const checks = [
    ['>=20 produtos', summary.products >= 20],
    ['>=8 insumos', summary.supplies >= 8],
    ['>=4 com variação', summary.withVariants >= 4],
    ['>=3 fichas técnicas', summary.technicalSheets >= 3],
    ['>=10 linhas de saldo', summary.balanceLines >= 10],
    ['>=1 movimentação', summary.movements >= 1],
    ['>=1 produção', summary.productionOrders >= 1],
    ['>=1 compra', summary.purchases >= 1],
  ];

  let allPass = true;
  for (const [label, pass] of checks) {
    console.log(`${pass ? '✓' : '✗'} ${label}`);
    if (!pass) allPass = false;
  }
  return { summary, allPass, checks };
}

async function main() {
  console.log(`Seed Berimbau → ${BASE} org=${ORG}`);
  await step('categories', ensureCategories);
  await step('uom', loadUom);
  await step('stock', loadStock);
  await step('variations', ensureVariations);
  await step('supplier', ensureSupplier);
  await step('products', ensureProducts);
  await step('technical-sheets', ensureTechnicalSheets);
  await step('stock-movements', ensureStockMovements);
  await step('purchase', ensurePurchase);
  await step('production', ensureProduction);
  const result = await validate();

  const report = {
    finishedAt: new Date().toISOString(),
    ok: state.ok,
    fail: state.fail,
    ...result,
  };
  console.log('\nAGENT_SEED_REPORT ' + JSON.stringify(report));
  process.exit(result.allPass ? 0 : 2);
}

main().catch((e) => {
  console.error(e);
  console.log(
    '\nAGENT_SEED_REPORT ' +
      JSON.stringify({
        finishedAt: new Date().toISOString(),
        ok: state.ok,
        fail: state.fail,
        allPass: false,
        fatal: e.message,
      }),
  );
  process.exit(1);
});
