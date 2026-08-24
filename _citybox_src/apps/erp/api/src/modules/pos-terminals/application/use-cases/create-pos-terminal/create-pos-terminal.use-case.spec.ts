import { CreatePosTerminalUseCase } from './create-pos-terminal.use-case';
import { BranchNotFoundError } from '../../../../tenancy/domain/errors/branch-not-found.error';
import {
  BRANCH_ID,
  makeBranch,
} from '../../../../tenancy/tests/tenancy-test-factory';
import {
  ORGANIZATION_ID,
  makePosTerminalRepositories,
} from '../../../tests/pos-terminals-test-factory';

describe('CreatePosTerminalUseCase', () => {
  function setup() {
    const repos = makePosTerminalRepositories();
    const useCase = new CreatePosTerminalUseCase(
      repos.posTerminalRepository,
      repos.branchRepository,
    );
    return { ...repos, useCase };
  }

  it('cria terminal com valores default', async () => {
    const { useCase, branchRepository } = setup();
    await branchRepository.save(makeBranch());

    const terminal = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
      name: '  Caixa 1 — Balcão  ',
    });

    expect(terminal.name).toBe('Caixa 1 — Balcão');
    expect(terminal.status).toBe('active');
    expect(terminal.nfceContingency).toBe(false);
    expect(terminal.printer).toBeNull();
    expect(terminal.pairingCode).toBeNull();
    expect(terminal.deletedAt).toBeNull();
  });

  it('aceita status, impressora, balança e servidor offline', async () => {
    const { useCase, branchRepository } = setup();
    await branchRepository.save(makeBranch());

    const terminal = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
      name: 'Tablet Salão',
      status: 'inactive',
      printer: 'EPSON TM-T20',
      scale: 'Toledo Prix 3',
      nfceContingency: true,
      offlineServerId: 'server-matriz',
    });

    expect(terminal.status).toBe('inactive');
    expect(terminal.printer).toBe('EPSON TM-T20');
    expect(terminal.scale).toBe('Toledo Prix 3');
    expect(terminal.nfceContingency).toBe(true);
    expect(terminal.offlineServerId).toBe('server-matriz');
  });

  it('rejeita unidade inexistente', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        branchId: BRANCH_ID,
        name: 'Caixa 1',
      }),
    ).rejects.toBeInstanceOf(BranchNotFoundError);
  });
});
