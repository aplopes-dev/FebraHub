import {
  POS_CORE_MODULE_IDS,
  POS_OPTIONAL_MODULE_IDS,
  POS_TEMPORARILY_DISABLED_MODULE_IDS,
} from '../catalog/pos-module.catalog';
import {
  attemptsToDisableCore,
  resolveTerminalModules,
  sanitizeModuleStates,
  type PosModuleStateMap,
} from './resolve-terminal-modules';

describe('resolveTerminalModules', () => {
  const lojaDefaults: PosModuleStateMap = {
    tables: 'disabled',
    tabs: 'disabled',
    service: 'disabled',
    delivery: 'disabled',
    delivery_orders: 'disabled',
    price_check: 'available',
  };

  it('terminal sem sobrescrita herda o padrão da loja', () => {
    const resolved = resolveTerminalModules(lojaDefaults, null);

    expect(resolved.tables).toBe('disabled');
    expect(resolved.price_check).toBe('available');
  });

  it('sobrescrita parcial só muda o que declara (exceto force temporário)', () => {
    const resolved = resolveTerminalModules(lojaDefaults, {
      delivery_orders: 'available',
      price_check: 'disabled',
    });

    expect(resolved.delivery_orders).toBe('available');
    expect(resolved.delivery).toBe('available');
    expect(resolved.price_check).toBe('disabled');
    // tables/tabs continuam forçados disabled mesmo se o override pedir available
    expect(resolved.tables).toBe('disabled');
    expect(resolved.tabs).toBe('disabled');
  });

  it('mapa vazio de sobrescrita **não** é o mesmo que herdar', () => {
    const herdando = resolveTerminalModules(lojaDefaults, null);
    const semNada = resolveTerminalModules(lojaDefaults, {});

    // Hoje os dois coincidem porque `{}` não declara nada — mas a distinção
    // existe na persistência: `null` acompanha o padrão quando ele mudar.
    expect(semNada).toEqual(herdando);
  });

  it('núcleo sai available mesmo quando o banco diz o contrário', () => {
    const resolved = resolveTerminalModules(
      { ...lojaDefaults, cash_hub: 'disabled' },
      { counter: 'disabled', history: 'blocked' },
    );

    // A trava de SEC-3. Um valor gravado à mão não pode virar um caixa que não
    // fecha nem um Balcão que não vende. `credit`/`refund` são exceção temporária
    // (só locais no PDV) — ver teste abaixo.
    for (const moduleId of POS_CORE_MODULE_IDS) {
      if (moduleId === 'credit' || moduleId === 'refund') continue;
      expect(resolved[moduleId]).toBe('available');
    }
  });

  it('credit e refund ficam disabled até existirem APIs POS', () => {
    const resolved = resolveTerminalModules(lojaDefaults, {
      credit: 'available',
      refund: 'available',
    });

    expect(resolved.credit).toBe('disabled');
    expect(resolved.refund).toBe('disabled');
  });

  it('tables e tabs ficam disabled até o salão existir no ERP', () => {
    const resolved = resolveTerminalModules(
      { ...lojaDefaults, tables: 'available', tabs: 'available' },
      { tables: 'available', tabs: 'available' },
    );

    expect(resolved.tables).toBe('disabled');
    expect(resolved.tabs).toBe('disabled');
    expect([...POS_TEMPORARILY_DISABLED_MODULE_IDS]).toEqual([
      'tables',
      'tabs',
    ]);
  });

  it('id desconhecido é descartado', () => {
    const resolved = resolveTerminalModules(
      {
        ...lojaDefaults,
        modulo_que_nao_existe: 'disabled',
      },
      { outro_inventado: 'available' },
    );

    expect(resolved.modulo_que_nao_existe).toBeUndefined();
    expect(resolved.outro_inventado).toBeUndefined();
  });

  it('a saída tem exatamente o catálogo, nem mais nem menos', () => {
    const resolved = resolveTerminalModules({}, null);

    expect(Object.keys(resolved).sort()).toEqual(
      [...POS_CORE_MODULE_IDS, ...POS_OPTIONAL_MODULE_IDS].sort(),
    );
  });

  it('ausente nos dois lados: opcionais available, exceto force temporário', () => {
    const resolved = resolveTerminalModules({}, null);

    for (const moduleId of POS_OPTIONAL_MODULE_IDS) {
      if (
        (POS_TEMPORARILY_DISABLED_MODULE_IDS as readonly string[]).includes(
          moduleId,
        )
      ) {
        expect(resolved[moduleId]).toBe('disabled');
      } else {
        expect(resolved[moduleId]).toBe('available');
      }
    }
  });
  it('delivery espelha delivery_orders (um módulo no produto)', () => {
    const resolved = resolveTerminalModules(
      {
        ...lojaDefaults,
        delivery: 'disabled',
        delivery_orders: 'available',
      },
      null,
    );

    expect(resolved.delivery_orders).toBe('available');
    expect(resolved.delivery).toBe('available');
  });

  it('sobrescrita de delivery_orders propaga para delivery', () => {
    const resolved = resolveTerminalModules(lojaDefaults, {
      delivery_orders: 'available',
    });

    expect(resolved.delivery_orders).toBe('available');
    expect(resolved.delivery).toBe('available');
  });
});

describe('sanitizeModuleStates', () => {
  it('mantém só os opcionais conhecidos', () => {
    const clean = sanitizeModuleStates({
      tables: 'disabled',
      inventado: 'disabled',
      price_check: 'available',
    });

    expect(clean).toEqual({ tables: 'disabled', price_check: 'available' });
  });

  it('ao gravar delivery_orders também grava o alias delivery', () => {
    const clean = sanitizeModuleStates({
      delivery_orders: 'disabled',
    });

    expect(clean).toEqual({
      delivery_orders: 'disabled',
      delivery: 'disabled',
    });
  });

  it('remove o núcleo em vez de guardá-lo', () => {
    const clean = sanitizeModuleStates({
      cash_hub: 'disabled',
      tables: 'disabled',
    });

    // Guardar `cash_hub: disabled` persistiria uma intenção que a resolução
    // ignora — e quem lesse a linha do banco acreditaria nela.
    expect(clean.cash_hub).toBeUndefined();
    expect(clean.tables).toBe('disabled');
  });

  it('descarta valor fora do enum', () => {
    const clean = sanitizeModuleStates({ tables: 'ligado', tabs: 42 });

    expect(clean).toEqual({});
  });

  it('nulo e indefinido viram mapa vazio', () => {
    expect(sanitizeModuleStates(null)).toEqual({});
    expect(sanitizeModuleStates(undefined)).toEqual({});
  });
});

describe('attemptsToDisableCore', () => {
  it('detecta tentativa de desligar núcleo', () => {
    expect(attemptsToDisableCore({ cash_hub: 'disabled' })).toBe(true);
    expect(attemptsToDisableCore({ counter: 'blocked' })).toBe(true);
  });

  it('núcleo em available não é tentativa', () => {
    expect(attemptsToDisableCore({ cash_hub: 'available' })).toBe(false);
  });

  it('opcional desligado não é tentativa', () => {
    expect(attemptsToDisableCore({ tables: 'disabled' })).toBe(false);
  });
});
