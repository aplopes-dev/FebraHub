import { InMemoryPosModuleDefaultsRepository } from '../../../tests/in-memory-pos-module-defaults.repository';
import { InMemoryPosTerminalRepository } from '../../../../pos-terminals/tests/in-memory-pos-terminal.repository';
import { PosTerminal } from '../../../../pos-terminals/domain/entities/pos-terminal.entity';
import { GetPosModuleDefaultsUseCase } from '../get-pos-module-defaults/get-pos-module-defaults.use-case';
import { GetTerminalModulesUseCase } from '../get-terminal-modules/get-terminal-modules.use-case';
import { UpsertPosModuleDefaultsUseCase } from '../upsert-pos-module-defaults/upsert-pos-module-defaults.use-case';
import { UpsertTerminalModulesUseCase } from './upsert-terminal-modules.use-case';

const ORGANIZATION_ID = '11111111-1111-4111-8111-111111111111';
const BRANCH_ID = '22222222-2222-4222-8222-222222222222';

function makeSetup() {
  const defaultsRepository = new InMemoryPosModuleDefaultsRepository();
  const terminalRepository = new InMemoryPosTerminalRepository();

  const getDefaults = new GetPosModuleDefaultsUseCase(defaultsRepository);
  const upsertDefaults = new UpsertPosModuleDefaultsUseCase(
    defaultsRepository,
    getDefaults,
  );
  const getTerminalModules = new GetTerminalModulesUseCase(
    terminalRepository,
    getDefaults,
  );
  const upsertTerminalModules = new UpsertTerminalModulesUseCase(
    terminalRepository,
    getTerminalModules,
  );

  return {
    defaultsRepository,
    terminalRepository,
    getDefaults,
    upsertDefaults,
    getTerminalModules,
    upsertTerminalModules,
  };
}

async function seedTerminal(setup: ReturnType<typeof makeSetup>) {
  const terminal = PosTerminal.create({
    organizationId: ORGANIZATION_ID,
    branchId: BRANCH_ID,
    name: 'Caixa 1',
  });
  await setup.terminalRepository.save(terminal);
  return terminal;
}

describe('Módulos por terminal', () => {
  it('organização nova nasce com opcionais ligados, exceto mesas/comandas', async () => {
    const setup = makeSetup();

    const defaults = await setup.getDefaults.execute({
      organizationId: ORGANIZATION_ID,
    });

    // Mesas/comandas ainda sem implementação ponta a ponta.
    expect(defaults.modules.tables).toBe('disabled');
    expect(defaults.modules.tabs).toBe('disabled');
    expect(defaults.modules.price_check).toBe('available');
    expect(defaults.modules.delivery).toBe('available');
    expect(defaults.profileName).toBeNull();
  });

  it('perfil Loja desliga o que é de restaurante', async () => {
    const setup = makeSetup();

    const defaults = await setup.upsertDefaults.execute({
      organizationId: ORGANIZATION_ID,
      applyProfile: 'Loja',
    });

    // AC-2.
    expect(defaults.modules.tables).toBe('disabled');
    expect(defaults.modules.tabs).toBe('disabled');
    expect(defaults.modules.delivery).toBe('disabled');
    expect(defaults.modules.price_check).toBe('available');
    expect(defaults.profileName).toBe('Loja');
  });

  it('terminal novo herda o padrão', async () => {
    const setup = makeSetup();
    const terminal = await seedTerminal(setup);
    await setup.upsertDefaults.execute({
      organizationId: ORGANIZATION_ID,
      applyProfile: 'Loja',
    });

    const result = await setup.getTerminalModules.execute({
      organizationId: ORGANIZATION_ID,
      terminalId: terminal.id,
    });

    // AC-3.
    expect(result.inheritsDefaults).toBe(true);
    expect(result.resolved.tables).toBe('disabled');
    expect(result.resolved.delivery).toBe('disabled');
  });

  it('quem herda acompanha a mudança do padrão; quem sobrescreve não', async () => {
    const setup = makeSetup();
    const herdeiro = await seedTerminal(setup);
    const proprio = PosTerminal.create({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
      name: 'Caixa 2',
    });
    await setup.terminalRepository.save(proprio);

    await setup.upsertTerminalModules.execute({
      organizationId: ORGANIZATION_ID,
      terminalId: proprio.id,
      modules: { delivery: 'available' },
    });

    await setup.upsertDefaults.execute({
      organizationId: ORGANIZATION_ID,
      applyProfile: 'Loja',
    });

    // AC-4. É a razão de `null` e `{}` serem coisas diferentes.
    const a = await setup.getTerminalModules.execute({
      organizationId: ORGANIZATION_ID,
      terminalId: herdeiro.id,
    });
    const b = await setup.getTerminalModules.execute({
      organizationId: ORGANIZATION_ID,
      terminalId: proprio.id,
    });

    expect(a.resolved.delivery).toBe('disabled');
    expect(b.resolved.delivery).toBe('available');
  });

  it('sobrescrita só vale no terminal que a definiu', async () => {
    const setup = makeSetup();
    const balcao = await seedTerminal(setup);
    const salao = PosTerminal.create({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
      name: 'Caixa Salão',
    });
    await setup.terminalRepository.save(salao);
    await setup.upsertDefaults.execute({
      organizationId: ORGANIZATION_ID,
      applyProfile: 'Restaurante',
    });

    await setup.upsertTerminalModules.execute({
      organizationId: ORGANIZATION_ID,
      terminalId: balcao.id,
      modules: { delivery: 'disabled' },
    });

    // AC-5. Override por terminal (delivery no lugar de mesas — mesas forçadas off).
    const doBalcao = await setup.getTerminalModules.execute({
      organizationId: ORGANIZATION_ID,
      terminalId: balcao.id,
    });
    const doSalao = await setup.getTerminalModules.execute({
      organizationId: ORGANIZATION_ID,
      terminalId: salao.id,
    });

    expect(doBalcao.resolved.delivery).toBe('disabled');
    expect(doSalao.resolved.delivery).toBe('available');
    expect(doSalao.resolved.tables).toBe('disabled');
    expect(doSalao.resolved.tabs).toBe('disabled');
  });

  it('null volta a herdar', async () => {
    const setup = makeSetup();
    const terminal = await seedTerminal(setup);
    await setup.upsertDefaults.execute({
      organizationId: ORGANIZATION_ID,
      applyProfile: 'Restaurante',
    });
    await setup.upsertTerminalModules.execute({
      organizationId: ORGANIZATION_ID,
      terminalId: terminal.id,
      modules: { delivery: 'disabled' },
    });

    const result = await setup.upsertTerminalModules.execute({
      organizationId: ORGANIZATION_ID,
      terminalId: terminal.id,
      modules: null,
    });

    // AC-6.
    expect(result.inheritsDefaults).toBe(true);
    expect(result.resolved.delivery).toBe('available');
    expect(result.resolved.tables).toBe('disabled');
  });

  it('núcleo é aceito sem erro mas resolvido como available', async () => {
    const setup = makeSetup();
    const terminal = await seedTerminal(setup);

    const result = await setup.upsertTerminalModules.execute({
      organizationId: ORGANIZATION_ID,
      terminalId: terminal.id,
      modules: { cash_hub: 'disabled', delivery: 'disabled' },
    });

    // AC-7. Recusar com 422 obrigaria a tela a filtrar antes de enviar; aceitar
    // e ignorar mantém o servidor tolerante sem afrouxar a garantia.
    expect(result.resolved.cash_hub).toBe('available');
    expect(result.resolved.delivery).toBe('disabled');
  });

  it('ajuste manual descaracteriza o perfil e limpa o nome', async () => {
    const setup = makeSetup();
    await setup.upsertDefaults.execute({
      organizationId: ORGANIZATION_ID,
      applyProfile: 'Loja',
    });

    const defaults = await setup.upsertDefaults.execute({
      organizationId: ORGANIZATION_ID,
      modules: { delivery: 'available' },
    });

    // Guardar "Loja" num conjunto que já não é Loja seria um rótulo que mente.
    expect(defaults.profileName).toBeNull();
    expect(defaults.modules.delivery).toBe('available');
  });

  it('perfil aplicado e mantido intacto conserva o nome', async () => {
    const setup = makeSetup();
    await setup.upsertDefaults.execute({
      organizationId: ORGANIZATION_ID,
      applyProfile: 'Loja',
    });

    const defaults = await setup.upsertDefaults.execute({
      organizationId: ORGANIZATION_ID,
      modules: {
        tables: 'disabled',
        tabs: 'disabled',
        service: 'disabled',
        delivery: 'disabled',
        delivery_orders: 'disabled',
        price_check: 'available',
      },
    });

    expect(defaults.profileName).toBe('Loja');
  });
});
