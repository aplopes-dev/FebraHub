import { UpdatePosTerminalUseCase } from './update-pos-terminal.use-case';
import { BranchNotFoundError } from '../../../../tenancy/domain/errors/branch-not-found.error';
import {
  BRANCH_ID,
  makeBranch,
} from '../../../../tenancy/tests/tenancy-test-factory';
import { PosTerminalNotFoundError } from '../../../domain/errors/pos-terminal-not-found.error';
import {
  ORGANIZATION_ID,
  OTHER_BRANCH_ID,
  POS_TERMINAL_ID,
  makePosTerminal,
  makePosTerminalRepositories,
} from '../../../tests/pos-terminals-test-factory';

describe('UpdatePosTerminalUseCase', () => {
  function setup() {
    const repos = makePosTerminalRepositories();
    const useCase = new UpdatePosTerminalUseCase(
      repos.posTerminalRepository,
      repos.branchRepository,
    );
    return { ...repos, useCase };
  }

  it('muda só o campo enviado (semântica PATCH)', async () => {
    const { useCase, posTerminalRepository } = setup();
    await posTerminalRepository.save(
      makePosTerminal({ name: 'Caixa 1', printer: 'EPSON TM-T20' }),
    );

    const updated = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: POS_TERMINAL_ID,
      status: 'inactive',
    });

    expect(updated.status).toBe('inactive');
    // Não enviado: continua igual, não foi limpo (diferente de PUT).
    expect(updated.name).toBe('Caixa 1');
    expect(updated.printer).toBe('EPSON TM-T20');
  });

  it('limpa um campo nullable quando enviado explicitamente como null', async () => {
    const { useCase, posTerminalRepository } = setup();
    await posTerminalRepository.save(
      makePosTerminal({ printer: 'EPSON TM-T20' }),
    );

    const updated = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: POS_TERMINAL_ID,
      printer: null,
    });

    expect(updated.printer).toBeNull();
  });

  it('troca de unidade validando que ela pertence à organização', async () => {
    const { useCase, posTerminalRepository, branchRepository } = setup();
    await posTerminalRepository.save(makePosTerminal({ branchId: BRANCH_ID }));
    await branchRepository.save(
      makeBranch({ id: OTHER_BRANCH_ID, code: '002' }),
    );

    const updated = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: POS_TERMINAL_ID,
      branchId: OTHER_BRANCH_ID,
    });

    expect(updated.branchId).toBe(OTHER_BRANCH_ID);
  });

  it('rejeita unidade inexistente', async () => {
    const { useCase, posTerminalRepository } = setup();
    await posTerminalRepository.save(makePosTerminal());

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: POS_TERMINAL_ID,
        branchId: OTHER_BRANCH_ID,
      }),
    ).rejects.toBeInstanceOf(BranchNotFoundError);
  });

  it('rejeita terminal inexistente ou excluído', async () => {
    const { useCase, posTerminalRepository } = setup();
    await posTerminalRepository.save(
      makePosTerminal({ deletedAt: new Date() }),
    );

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: POS_TERMINAL_ID,
        name: 'Novo nome',
      }),
    ).rejects.toBeInstanceOf(PosTerminalNotFoundError);
  });
});
