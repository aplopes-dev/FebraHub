import { ListPosTerminalsUseCase } from './list-pos-terminals.use-case';
import {
  BRANCH_ID,
  ORGANIZATION_ID,
  OTHER_BRANCH_ID,
  makePosTerminal,
  makePosTerminalRepositories,
} from '../../../tests/pos-terminals-test-factory';

describe('ListPosTerminalsUseCase', () => {
  function setup() {
    const repos = makePosTerminalRepositories();
    const useCase = new ListPosTerminalsUseCase(repos.posTerminalRepository);
    return { ...repos, useCase };
  }

  it('lista terminais ativos da organização, mais recente primeiro', async () => {
    const { useCase, posTerminalRepository } = setup();
    await posTerminalRepository.save(
      makePosTerminal({
        id: 'e1111111-1111-4111-8111-111111111111',
        name: 'Caixa 1',
      }),
    );
    await posTerminalRepository.save(
      makePosTerminal({
        id: 'e2222222-2222-4222-8222-222222222222',
        name: 'Caixa 2',
      }),
    );
    await posTerminalRepository.save(
      makePosTerminal({
        id: 'e3333333-3333-4333-8333-333333333333',
        name: 'Excluído',
        deletedAt: new Date(),
      }),
    );

    const result = await useCase.execute({ organizationId: ORGANIZATION_ID });

    expect(result.total).toBe(2);
    expect(result.items.map((item) => item.name)).toEqual([
      'Caixa 2',
      'Caixa 1',
    ]);
  });

  it('filtra por busca e por status', async () => {
    const { useCase, posTerminalRepository } = setup();
    await posTerminalRepository.save(
      makePosTerminal({
        id: 'e1111111-1111-4111-8111-111111111111',
        name: 'Caixa 1 — Balcão',
        status: 'active',
      }),
    );
    await posTerminalRepository.save(
      makePosTerminal({
        id: 'e2222222-2222-4222-8222-222222222222',
        name: 'Tablet Salão',
        status: 'inactive',
      }),
    );

    const bySearch = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      search: 'tablet',
    });
    expect(bySearch.items).toHaveLength(1);
    expect(bySearch.items[0]?.name).toBe('Tablet Salão');

    const byStatus = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      status: 'inactive',
    });
    expect(byStatus.items).toHaveLength(1);
    expect(byStatus.items[0]?.name).toBe('Tablet Salão');
  });

  it('recorta por unidades permitidas (MEMBER)', async () => {
    const { useCase, posTerminalRepository } = setup();
    await posTerminalRepository.save(
      makePosTerminal({
        id: 'e1111111-1111-4111-8111-111111111111',
        branchId: BRANCH_ID,
      }),
    );
    await posTerminalRepository.save(
      makePosTerminal({
        id: 'e2222222-2222-4222-8222-222222222222',
        branchId: OTHER_BRANCH_ID,
      }),
    );

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      allowedBranchIds: [BRANCH_ID],
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.branchId).toBe(BRANCH_ID);
  });
});
