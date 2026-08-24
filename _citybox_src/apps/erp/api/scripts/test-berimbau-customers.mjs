#!/usr/bin/env node
/**
 * E2E do módulo customers (Berimbau) via erp-api.
 * Uso: ERP_TOKEN='…' node scripts/test-berimbau-customers.mjs
 */
const BASE = process.env.ERP_API_URL?.replace(/\/$/, '') || 'http://127.0.0.1:3114/api';
const ORG = process.env.ORG_ID || '8cdd57eb-98d8-4695-9eef-a62da63fd1d4';
const BRANCH = process.env.BRANCH_ID || '50302e19-5d89-4032-8ab1-39a97ab99975';
const TOKEN = process.env.ERP_TOKEN;
if (!TOKEN) {
  console.error('ERP_TOKEN obrigatório');
  process.exit(1);
}

const results = [];
const ids = { categories: {}, customers: {} };

function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`);
}
function fail(name, detail) {
  results.push({ name, ok: false, detail });
  console.log(`✗ ${name} — ${detail}`);
}

async function api(method, path, body, expectStatus) {
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
  if (expectStatus !== undefined && res.status !== expectStatus) {
    const err = new Error(
      `${method} ${path} esperado ${expectStatus}, veio ${res.status}: ${JSON.stringify(json)?.slice(0, 400)}`,
    );
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return { status: res.status, json };
}

function data(res) {
  return res.json?.data ?? res.json;
}

async function run(name, fn) {
  try {
    await fn();
  } catch (e) {
    fail(name, e.message);
  }
}

async function main() {
  console.log(`Customers E2E → ${BASE} org=${ORG}\n`);

  // Auth + escopo
  await run('auth: GET /organizations/current', async () => {
    const res = await api('GET', '/v1/organizations/current', undefined, 200);
    const org = data(res);
    if (org.id !== ORG) throw new Error(`org inesperada ${org.id}`);
    if (org.tradeName !== 'Berimbau') throw new Error(`tradeName=${org.tradeName}`);
    pass('auth: GET /organizations/current', org.tradeName);
  });

  // --- Categorias ---
  await run('categories: list vazia/inicial', async () => {
    const res = await api('GET', '/v1/customer-categories?perPage=50', undefined, 200);
    const list = data(res);
    pass('categories: list', `total=${res.json.meta?.total ?? list.length}`);
  });

  await run('categories: create VIP', async () => {
    const res = await api(
      'POST',
      '/v1/customer-categories',
      { name: 'VIP Berimbau', discountPercentage: 10 },
      201,
    ).catch(async (e) => {
      // 409 se já existe de run anterior — busca e reusa
      if (e.status === 409 || String(e.message).includes('409')) {
        const list = data(
          await api('GET', '/v1/customer-categories?search=VIP%20Berimbau&perPage=5', undefined, 200),
        );
        const hit = list.find((c) => c.name === 'VIP Berimbau');
        if (!hit) throw e;
        return { status: 200, json: { data: hit } };
      }
      // create pode retornar 200 em alguns presenters
      throw e;
    });
    // Aceitar 200 ou 201
    if (![200, 201].includes(res.status) && !res.json?.data?.id) {
      const retry = await api(
        'POST',
        '/v1/customer-categories',
        { name: 'VIP Berimbau', discountPercentage: 10 },
      );
      if (![200, 201].includes(retry.status)) {
        // try list
        const list = data(
          await api('GET', '/v1/customer-categories?search=VIP&perPage=20', undefined, 200),
        );
        const hit = list.find((c) => c.name === 'VIP Berimbau');
        if (!hit) throw new Error(`create falhou: ${retry.status} ${JSON.stringify(retry.json)}`);
        ids.categories.vip = hit.id;
        await api(
          'PUT',
          `/v1/customer-categories/${ids.categories.vip}`,
          { name: 'VIP Berimbau', discountPercentage: 10 },
          200,
        );
        pass('categories: create VIP', `reused ${hit.id}`);
        return;
      }
      ids.categories.vip = data(retry).id;
    } else {
      ids.categories.vip = data(res).id;
    }
    // Normaliza desconto para runs idempotentes (reuso após update 12.5%).
    await api(
      'PUT',
      `/v1/customer-categories/${ids.categories.vip}`,
      { name: 'VIP Berimbau', discountPercentage: 10 },
      200,
    );
    pass('categories: create VIP', ids.categories.vip);
  });

  await run('categories: create Atacado', async () => {
    let cat;
    try {
      const res = await api('POST', '/v1/customer-categories', {
        name: 'Atacado Berimbau',
        discountPercentage: 5,
      });
      if ([200, 201].includes(res.status)) {
        cat = data(res);
      } else if (res.status === 409) {
        const list = data(
          await api('GET', '/v1/customer-categories?search=Atacado%20Berimbau&perPage=5', undefined, 200),
        );
        cat = list.find((c) => c.name === 'Atacado Berimbau');
      } else {
        throw new Error(`${res.status} ${JSON.stringify(res.json)}`);
      }
    } catch (e) {
      if (String(e.message).includes('409')) {
        const list = data(
          await api('GET', '/v1/customer-categories?search=Atacado&perPage=20', undefined, 200),
        );
        cat = list.find((c) => c.name === 'Atacado Berimbau');
      } else throw e;
    }
    if (!cat?.id) throw new Error('Atacado não criado');
    ids.categories.atacado = cat.id;
    pass('categories: create Atacado', cat.id);
  });

  await run('categories: create Varejo (0%)', async () => {
    const name = `Varejo ${Date.now()}`;
    const res = await api('POST', '/v1/customer-categories', {
      name,
      discountPercentage: 0,
    });
    if (![200, 201].includes(res.status)) {
      throw new Error(`${res.status} ${JSON.stringify(res.json)}`);
    }
    ids.categories.varejo = data(res).id;
    ids.categories.varejoName = name;
    pass('categories: create Varejo', ids.categories.varejo);
  });

  await run('categories: get by id', async () => {
    const res = await api(
      'GET',
      `/v1/customer-categories/${ids.categories.vip}`,
      undefined,
      200,
    );
    const cat = data(res);
    if (Number(cat.discountPercentage) !== 10) {
      throw new Error(`discount=${cat.discountPercentage}`);
    }
    pass('categories: get by id', cat.name);
  });

  await run('categories: update discount', async () => {
    const res = await api(
      'PUT',
      `/v1/customer-categories/${ids.categories.vip}`,
      { name: 'VIP Berimbau', discountPercentage: 12.5 },
      200,
    );
    const cat = data(res);
    if (Number(cat.discountPercentage) !== 12.5) {
      throw new Error(`discount=${cat.discountPercentage}`);
    }
    pass('categories: update discount', '12.5%');
  });

  await run('categories: 409 nome duplicado', async () => {
    const res = await api('POST', '/v1/customer-categories', {
      name: 'VIP Berimbau',
      discountPercentage: 1,
    });
    if (res.status !== 409) throw new Error(`status=${res.status}`);
    pass('categories: 409 nome duplicado');
  });

  await run('categories: 422 desconto > 100', async () => {
    const res = await api('POST', '/v1/customer-categories', {
      name: `Inválida ${Date.now()}`,
      discountPercentage: 150,
    });
    if (![400, 422].includes(res.status)) {
      throw new Error(`status=${res.status} body=${JSON.stringify(res.json)}`);
    }
    pass('categories: 422 desconto > 100', `status=${res.status}`);
  });

  // --- Clientes ---
  await run('customers: create PF lead', async () => {
    const res = await api('POST', '/v1/customers', {
      personType: 'PF',
      name: 'Ana Souza',
      document: '39053344705',
      email: 'ana.souza@example.com',
      mobilePhone: '73991001122',
      birthDate: '1990-05-12',
      stage: 'lead',
      categoryId: ids.categories.vip,
      notes: 'Cliente seed E2E',
      branchIds: [BRANCH],
      addresses: [
        {
          addressType: 'principal',
          zipCode: '45650100',
          street: 'Av. Soares Lopes',
          number: '100',
          district: 'Centro',
          city: 'Ilhéus',
          state: 'BA',
        },
      ],
    });
    if (![200, 201].includes(res.status)) {
      // documento pode já existir
      if (res.status === 409) {
        const list = data(
          await api('GET', '/v1/customers?search=Ana%20Souza&perPage=10', undefined, 200),
        );
        const hit = list.find((c) => c.name === 'Ana Souza' || c.document?.includes('39053344705'));
        if (!hit) throw new Error(`409 sem find: ${JSON.stringify(res.json)}`);
        ids.customers.ana = hit.id;
        pass('customers: create PF lead', `reused ${hit.id}`);
        return;
      }
      throw new Error(`${res.status} ${JSON.stringify(res.json)}`);
    }
    const c = data(res);
    ids.customers.ana = c.id;
    if (c.stage !== 'lead') throw new Error(`stage=${c.stage}`);
    pass('customers: create PF lead', c.id);
  });

  await run('customers: create PF opportunity', async () => {
    const doc = '52998224725';
    const res = await api('POST', '/v1/customers', {
      personType: 'PF',
      name: 'Bruno Costa',
      document: doc,
      email: 'bruno.costa@example.com',
      mobilePhone: '73992002233',
      stage: 'opportunity',
      categoryId: ids.categories.atacado,
      branchIds: [BRANCH],
      addresses: [],
    });
    if ([200, 201].includes(res.status)) {
      ids.customers.bruno = data(res).id;
    } else if (res.status === 409) {
      const list = data(
        await api('GET', '/v1/customers?search=Bruno%20Costa&perPage=10', undefined, 200),
      );
      ids.customers.bruno = list[0]?.id;
      if (!ids.customers.bruno) throw new Error('Bruno não encontrado após 409');
    } else {
      throw new Error(`${res.status} ${JSON.stringify(res.json)}`);
    }
    pass('customers: create PF opportunity', ids.customers.bruno);
  });

  await run('customers: create PJ active c/ 2 endereços', async () => {
    const res = await api('POST', '/v1/customers', {
      personType: 'PJ',
      name: 'Distribuidora Pontal',
      document: '11222400020002',
      email: 'contato@distribuidorapontal.com.br',
      mobilePhone: '7332334455',
      stage: 'active',
      categoryId: ids.categories.vip,
      branchIds: [BRANCH],
      addresses: [
        {
          addressType: 'principal',
          zipCode: '45654000',
          street: 'Rua das Flores',
          number: '45',
          district: 'Pontal',
          city: 'Ilhéus',
          state: 'BA',
        },
        {
          addressType: 'entrega',
          zipCode: '45654001',
          street: 'Rua do Porto',
          number: '8',
          district: 'Pontal',
          city: 'Ilhéus',
          state: 'BA',
        },
      ],
    });
    if ([200, 201].includes(res.status)) {
      ids.customers.pj = data(res).id;
    } else if (res.status === 409) {
      const list = data(
        await api(
          'GET',
          '/v1/customers?search=Distribuidora%20Pontal&perPage=10',
          undefined,
          200,
        ),
      );
      ids.customers.pj = list[0]?.id;
      if (!ids.customers.pj) throw new Error('PJ não encontrado');
    } else {
      throw new Error(`${res.status} ${JSON.stringify(res.json)}`);
    }
    pass('customers: create PJ active', ids.customers.pj);
  });

  await run('customers: create sem documento (inactive)', async () => {
    const name = `Cliente Avulso ${Date.now()}`;
    const res = await api('POST', '/v1/customers', {
      personType: 'PF',
      name,
      stage: 'inactive',
      branchIds: [BRANCH],
    });
    if (![200, 201].includes(res.status)) {
      throw new Error(`${res.status} ${JSON.stringify(res.json)}`);
    }
    ids.customers.avulso = data(res).id;
    ids.customers.avulsoName = name;
    pass('customers: create sem documento', ids.customers.avulso);
  });

  await run('customers: create PF extra (Carla)', async () => {
    const res = await api('POST', '/v1/customers', {
      personType: 'PF',
      name: 'Carla Mendes',
      document: '15350946056',
      email: 'carla.mendes@example.com',
      stage: 'lead',
      categoryId: ids.categories.atacado,
      branchIds: [BRANCH],
      additionalPhones: ['73993003344'],
    });
    if ([200, 201].includes(res.status)) {
      ids.customers.carla = data(res).id;
    } else if (res.status === 409) {
      const list = data(
        await api('GET', '/v1/customers?search=Carla%20Mendes&perPage=10', undefined, 200),
      );
      ids.customers.carla = list[0]?.id;
    } else {
      throw new Error(`${res.status} ${JSON.stringify(res.json)}`);
    }
    pass('customers: create Carla', ids.customers.carla);
  });

  await run('customers: 422 CPF inválido', async () => {
    const res = await api('POST', '/v1/customers', {
      personType: 'PF',
      name: 'CPF Ruim',
      document: '11111111111',
      stage: 'lead',
      branchIds: [BRANCH],
    });
    if (![400, 422].includes(res.status)) {
      throw new Error(`status=${res.status} ${JSON.stringify(res.json)}`);
    }
    pass('customers: 422 CPF inválido', `status=${res.status}`);
  });

  await run('customers: 422 dois endereços principal', async () => {
    const res = await api('POST', '/v1/customers', {
      personType: 'PF',
      name: 'Dois Principais',
      stage: 'lead',
      branchIds: [BRANCH],
      addresses: [
        { addressType: 'principal', city: 'Ilhéus', state: 'BA' },
        { addressType: 'principal', city: 'Itabuna', state: 'BA' },
      ],
    });
    if (![400, 422].includes(res.status)) {
      throw new Error(`status=${res.status} ${JSON.stringify(res.json)}`);
    }
    pass('customers: 422 dois principais', `status=${res.status}`);
  });

  await run('customers: 409 documento duplicado', async () => {
    const res = await api('POST', '/v1/customers', {
      personType: 'PF',
      name: 'Clone Ana',
      document: '39053344705',
      stage: 'lead',
      branchIds: [BRANCH],
    });
    if (res.status !== 409) throw new Error(`status=${res.status}`);
    pass('customers: 409 documento duplicado');
  });

  await run('customers: 404 categoria inexistente', async () => {
    const res = await api('POST', '/v1/customers', {
      personType: 'PF',
      name: 'Cat Fake',
      stage: 'lead',
      categoryId: '00000000-0000-4000-8000-000000000099',
      branchIds: [BRANCH],
    });
    if (res.status !== 404) throw new Error(`status=${res.status} ${JSON.stringify(res.json)}`);
    pass('customers: 404 categoria inexistente');
  });

  await run('customers: get by id', async () => {
    const res = await api('GET', `/v1/customers/${ids.customers.ana}`, undefined, 200);
    const c = data(res);
    if (!c.addresses?.length) throw new Error('sem endereços');
    if (c.addresses.filter((a) => a.addressType === 'principal').length !== 1) {
      throw new Error('principal count');
    }
    pass('customers: get by id', `${c.name} addrs=${c.addresses.length}`);
  });

  await run('customers: update stage + limpar notes (PUT)', async () => {
    const current = data(
      await api('GET', `/v1/customers/${ids.customers.ana}`, undefined, 200),
    );
    const res = await api(
      'PUT',
      `/v1/customers/${ids.customers.ana}`,
      {
        personType: 'PF',
        name: 'Ana Souza',
        document: current.document || '39053344705',
        email: 'ana.souza@example.com',
        mobilePhone: '73991001122',
        birthDate: '1990-05-12',
        stage: 'active',
        categoryId: ids.categories.vip,
        // notes omitido → limpa
        branchIds: [BRANCH],
        addresses: [
          {
            id: current.addresses?.[0]?.id,
            addressType: 'principal',
            zipCode: '45650100',
            street: 'Av. Soares Lopes',
            number: '200',
            district: 'Centro',
            city: 'Ilhéus',
            state: 'BA',
          },
          {
            addressType: 'entrega',
            zipCode: '45654000',
            street: 'Rua Nova',
            number: '10',
            district: 'Pontal',
            city: 'Ilhéus',
            state: 'BA',
          },
        ],
      },
      200,
    );
    const c = data(res);
    if (c.stage !== 'active') throw new Error(`stage=${c.stage}`);
    if (c.notes) throw new Error(`notes deveria limpar, veio=${c.notes}`);
    if ((c.addresses || []).length < 2) throw new Error(`addrs=${c.addresses?.length}`);
    pass('customers: update stage+PUT clear notes', `addrs=${c.addresses.length}`);
  });

  await run('customers: list tab=all + tabCounts', async () => {
    const res = await api('GET', '/v1/customers?tab=all&perPage=50', undefined, 200);
    const meta = res.json.meta;
    const tabs = res.json.tabCounts;
    if (!meta || meta.total < 4) throw new Error(`total=${meta?.total}`);
    if (!tabs || typeof tabs.lead !== 'number') {
      throw new Error(`tabCounts=${JSON.stringify(tabs)}`);
    }
    pass(
      'customers: list tab=all + tabCounts',
      `total=${meta.total} tabs=${JSON.stringify(tabs)}`,
    );
  });

  await run('customers: list tab=active', async () => {
    const res = await api('GET', '/v1/customers?tab=active&perPage=50', undefined, 200);
    const list = data(res);
    if (!list.every((c) => c.stage === 'active')) {
      throw new Error(`stages=${list.map((c) => c.stage)}`);
    }
    pass('customers: list tab=active', `n=${list.length}`);
  });

  await run('customers: search por nome', async () => {
    const res = await api(
      'GET',
      '/v1/customers?search=Ana&perPage=20',
      undefined,
      200,
    );
    const list = data(res);
    if (!list.some((c) => /ana/i.test(c.name))) throw new Error('Ana não encontrada');
    pass('customers: search por nome', `n=${list.length}`);
  });

  await run('customers: paginação page/perPage', async () => {
    const p1 = await api('GET', '/v1/customers?tab=all&page=1&perPage=2', undefined, 200);
    const p2 = await api('GET', '/v1/customers?tab=all&page=2&perPage=2', undefined, 200);
    if (p1.json.meta.perPage !== 2) throw new Error('perPage');
    if (data(p1).length > 2) throw new Error('page1 length');
    if (p1.json.meta.totalPages < 2 && p1.json.meta.total > 2) {
      throw new Error('totalPages');
    }
    const ids1 = data(p1).map((c) => c.id);
    const ids2 = data(p2).map((c) => c.id);
    if (ids1.some((id) => ids2.includes(id))) {
      // pode acontecer se total < 3 e page2 vazia — ok se page2 vazia
      if (ids2.length > 0) throw new Error('overlap páginas');
    }
    pass(
      'customers: paginação',
      `p1=${ids1.length} p2=${ids2.length} total=${p1.json.meta.total}`,
    );
  });

  await run('customers: soft-delete', async () => {
    const res = await api('DELETE', `/v1/customers/${ids.customers.carla}`);
    if (res.status !== 204 && res.status !== 200) {
      throw new Error(`status=${res.status}`);
    }
    const get = await api('GET', `/v1/customers/${ids.customers.carla}`, undefined, 200);
    const c = data(get);
    if (!c.deletedAt) throw new Error('deletedAt ausente');
    pass('customers: soft-delete', c.deletedAt);
  });

  await run('customers: restore', async () => {
    const res = await api(
      'POST',
      `/v1/customers/${ids.customers.carla}/restore`,
      undefined,
      200,
    );
    const c = data(res);
    if (c.deletedAt) throw new Error('ainda deleted');
    pass('customers: restore');
  });

  await run('customers: restore idempotente', async () => {
    const res = await api(
      'POST',
      `/v1/customers/${ids.customers.carla}/restore`,
      undefined,
      200,
    );
    if (data(res).deletedAt) throw new Error('deleted');
    pass('customers: restore idempotente');
  });

  await run('categories: 409 delete com clientes', async () => {
    const res = await api('DELETE', `/v1/customer-categories/${ids.categories.vip}`);
    if (res.status !== 409) {
      throw new Error(`status=${res.status} ${JSON.stringify(res.json)}`);
    }
    pass('categories: 409 delete com clientes');
  });

  await run('categories: delete vazia (Varejo)', async () => {
    const res = await api('DELETE', `/v1/customer-categories/${ids.categories.varejo}`);
    if (![200, 204].includes(res.status)) {
      throw new Error(`status=${res.status} ${JSON.stringify(res.json)}`);
    }
    const get = await api('GET', `/v1/customer-categories/${ids.categories.varejo}`);
    if (get.status !== 404) {
      throw new Error(`após hard-delete esperado 404, veio ${get.status}`);
    }
    pass('categories: hard-delete vazia');
  });

  await run('categories: customerCount refletido', async () => {
    const res = await api(
      'GET',
      `/v1/customer-categories/${ids.categories.vip}`,
      undefined,
      200,
    );
    const cat = data(res);
    const count = cat.customerCount ?? cat._count?.customers;
    if (typeof count === 'number' && count < 1) {
      throw new Error(`customerCount=${count}`);
    }
    pass('categories: customerCount', String(count));
  });

  // Resumo
  const ok = results.filter((r) => r.ok).length;
  const bad = results.filter((r) => !r.ok);
  console.log(`\n=== RESUMO: ${ok}/${results.length} ok ===`);
  if (bad.length) {
    console.log('Falhas:');
    for (const b of bad) console.log(` - ${b.name}: ${b.detail}`);
  }
  console.log(
    '\nAGENT_CUSTOMERS_REPORT ' +
      JSON.stringify({
        finishedAt: new Date().toISOString(),
        ok,
        total: results.length,
        failed: bad.map((b) => ({ name: b.name, detail: b.detail })),
        ids,
      }),
  );
  process.exit(bad.length ? 2 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
