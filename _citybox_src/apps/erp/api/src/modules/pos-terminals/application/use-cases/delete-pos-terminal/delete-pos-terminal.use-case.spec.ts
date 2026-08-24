import { DeletePosTerminalUseCase } from './delete-pos-terminal.use-case';
import { PosTerminalNotFoundError } from '../../../domain/errors/pos-terminal-not-found.error';
import {
  ORGANIZATION_ID,
  POS_TERMINAL_ID,
  makePosTerminal,
  makePosTerminalRepositories,
} from '../../../tests/pos-terminals-test-factory';

describe('DeletePosTerminalUseCase', () => {
  function setup() {
    const repos = makePosTerminalRepositories();
    const useCase = new DeletePosTerminalUseCase(repos.posTerminalRepository);
    return { ...repos, useCase };
  }

  it('marca o terminal como excluído (soft-delete)', async () => {
    const { useCase, posTerminalRepository } = setup();
    await posTerminalRepository.save(makePosTerminal());

    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: POS_TERMINAL_ID,
    });

    const found = await posTerminalRepository.findById(
      ORGANIZATION_ID,
      POS_TERMINAL_ID,
    );
    expect(found?.deletedAt).not.toBeNull();
  });

  it('rejeita terminal inexistente', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ organizationId: ORGANIZATION_ID, id: POS_TERMINAL_ID }),
    ).rejects.toBeInstanceOf(PosTerminalNotFoundError);
  });

  it('rejeita terminal já excluído', async () => {
    const { useCase, posTerminalRepository } = setup();
    await posTerminalRepository.save(
      makePosTerminal({ deletedAt: new Date() }),
    );

    await expect(
      useCase.execute({ organizationId: ORGANIZATION_ID, id: POS_TERMINAL_ID }),
    ).rejects.toBeInstanceOf(PosTerminalNotFoundError);
  });
});
