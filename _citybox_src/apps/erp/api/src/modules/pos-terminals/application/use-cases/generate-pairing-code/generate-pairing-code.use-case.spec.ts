import { GeneratePairingCodeUseCase } from './generate-pairing-code.use-case';
import { PosTerminalNotFoundError } from '../../../domain/errors/pos-terminal-not-found.error';
import {
  ORGANIZATION_ID,
  POS_TERMINAL_ID,
  makePosTerminal,
  makePosTerminalRepositories,
} from '../../../tests/pos-terminals-test-factory';

describe('GeneratePairingCodeUseCase', () => {
  function setup() {
    const repos = makePosTerminalRepositories();
    const useCase = new GeneratePairingCodeUseCase(repos.posTerminalRepository);
    return { ...repos, useCase };
  }

  it('gera um código opaco de 8 caracteres com validade de 15 minutos', async () => {
    const { useCase, posTerminalRepository } = setup();
    await posTerminalRepository.save(makePosTerminal());

    const before = Date.now();
    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: POS_TERMINAL_ID,
    });

    expect(result.code).toHaveLength(8);
    expect(result.code).toMatch(/^[A-Z0-9]+$/);
    const ttlMs = result.expiresAt.getTime() - before;
    expect(ttlMs).toBeGreaterThan(14 * 60_000);
    expect(ttlMs).toBeLessThanOrEqual(15 * 60_000 + 1000);

    const saved = await posTerminalRepository.findById(
      ORGANIZATION_ID,
      POS_TERMINAL_ID,
    );
    expect(saved?.pairingCode).toBe(result.code);
  });

  it('regenerar sobrescreve o código anterior', async () => {
    const { useCase, posTerminalRepository } = setup();
    await posTerminalRepository.save(makePosTerminal());

    const first = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: POS_TERMINAL_ID,
    });
    const second = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: POS_TERMINAL_ID,
    });

    const saved = await posTerminalRepository.findById(
      ORGANIZATION_ID,
      POS_TERMINAL_ID,
    );
    // O repositório guarda só o código mais recente — não é cumulativo.
    expect(saved?.pairingCode).toBe(second.code);
    expect(first.code).not.toBe('');
  });

  it('rejeita terminal inexistente ou excluído', async () => {
    const { useCase, posTerminalRepository } = setup();
    await posTerminalRepository.save(
      makePosTerminal({ deletedAt: new Date() }),
    );

    await expect(
      useCase.execute({ organizationId: ORGANIZATION_ID, id: POS_TERMINAL_ID }),
    ).rejects.toBeInstanceOf(PosTerminalNotFoundError);
  });
});
