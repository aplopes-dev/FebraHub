import { RedeemPairingCodeUseCase } from './redeem-pairing-code.use-case';
import { GeneratePairingCodeUseCase } from '../generate-pairing-code/generate-pairing-code.use-case';
import { RevokeDeviceUseCase } from '../revoke-device/revoke-device.use-case';
import { DeviceToken } from '../../../../../shared/infra/crypto/device-token';
import { PosTerminalPairingCodeInvalidError } from '../../../domain/errors/pos-terminal-pairing-code-invalid.error';
import { PosTerminal } from '../../../domain/entities/pos-terminal.entity';
import {
  ORGANIZATION_ID,
  POS_TERMINAL_ID,
  makePosTerminal,
  makePosTerminalRepositories,
} from '../../../tests/pos-terminals-test-factory';

describe('RedeemPairingCodeUseCase', () => {
  function setup() {
    const repos = makePosTerminalRepositories();
    return {
      ...repos,
      redeem: new RedeemPairingCodeUseCase(
        repos.posTerminalRepository,
        repos.organizationRepository,
        repos.branchRepository,
      ),
      generate: new GeneratePairingCodeUseCase(repos.posTerminalRepository),
      revoke: new RevokeDeviceUseCase(repos.posTerminalRepository),
    };
  }

  async function seedWithCode() {
    const ctx = setup();
    await ctx.seedOrgAndBranch();
    await ctx.posTerminalRepository.save(makePosTerminal());
    const { code } = await ctx.generate.execute({
      organizationId: ORGANIZATION_ID,
      id: POS_TERMINAL_ID,
    });
    return { ...ctx, code };
  }

  it('troca o código por um token e devolve o terminal', async () => {
    const { redeem, code } = await seedWithCode();

    const result = await redeem.execute({
      code,
      deviceLabel: 'Windows · Caixa da frente',
    });

    expect(result.deviceToken).toHaveLength(43); // 32 bytes em base64url
    expect(result.terminal.id).toBe(POS_TERMINAL_ID);
    expect(result.terminal.pairedAt).toBeInstanceOf(Date);
    expect(result.terminal.pairedDeviceLabel).toBe('Windows · Caixa da frente');
    expect(result.organizationName).toBe('Loja Ilhéus');
    expect(result.branchName).toBe('Loja Centro');
  });

  it('grava só o hash — o token em claro não fica no repositório', async () => {
    const { redeem, posTerminalRepository, code } = await seedWithCode();

    const { deviceToken } = await redeem.execute({ code });
    const saved = await posTerminalRepository.findById(
      ORGANIZATION_ID,
      POS_TERMINAL_ID,
    );

    expect(saved?.deviceTokenHash).not.toBe(deviceToken);
    expect(DeviceToken.matches(deviceToken, saved!.deviceTokenHash!)).toBe(
      true,
    );
  });

  it('falha no branding não consome o código', async () => {
    const { redeem, posTerminalRepository, branchRepository, code } =
      await seedWithCode();
    const originalFindById = branchRepository.findById.bind(branchRepository);
    branchRepository.findById = async () => {
      throw new Error('tenant missing');
    };

    await expect(redeem.execute({ code })).rejects.toThrow('tenant missing');

    branchRepository.findById = originalFindById;
    const saved = await posTerminalRepository.findById(
      ORGANIZATION_ID,
      POS_TERMINAL_ID,
    );
    expect(saved?.pairingCode).toBe(code);
    expect(saved?.deviceTokenHash).toBeNull();
  });

  it('o código é de uso único: a segunda tentativa falha', async () => {
    const { redeem, code } = await seedWithCode();

    await redeem.execute({ code });

    // Sem consumir, o mesmo código parearia um segundo dispositivo dentro da
    // janela de 15 minutos.
    await expect(redeem.execute({ code })).rejects.toBeInstanceOf(
      PosTerminalPairingCodeInvalidError,
    );
  });

  it('código expirado não vale e não emite credencial', async () => {
    const { redeem, posTerminalRepository } = setup();
    await posTerminalRepository.save(
      makePosTerminal().setPairingCode('ABCD2345', new Date(Date.now() - 1000)),
    );

    await expect(redeem.execute({ code: 'ABCD2345' })).rejects.toBeInstanceOf(
      PosTerminalPairingCodeInvalidError,
    );

    const saved = await posTerminalRepository.findById(
      ORGANIZATION_ID,
      POS_TERMINAL_ID,
    );
    expect(saved?.deviceTokenHash).toBeNull();
  });

  it('código inexistente falha com o mesmo erro do expirado', async () => {
    const { redeem } = setup();

    // Mensagens diferentes contariam a quem adivinha quais tentativas
    // chegaram perto.
    let captured: PosTerminalPairingCodeInvalidError | null = null;
    try {
      await redeem.execute({ code: 'ZZZZ9999' });
    } catch (error) {
      captured = error as PosTerminalPairingCodeInvalidError;
    }

    expect(captured).toBeInstanceOf(PosTerminalPairingCodeInvalidError);
    expect(captured?.externalMessage).toBe(
      'Código de pareamento inválido ou expirado',
    );
  });

  it('terminal inativo não parea', async () => {
    const { redeem, posTerminalRepository, generate } = setup();
    await posTerminalRepository.save(makePosTerminal());
    const { code } = await generate.execute({
      organizationId: ORGANIZATION_ID,
      id: POS_TERMINAL_ID,
    });
    const terminal = await posTerminalRepository.findById(
      ORGANIZATION_ID,
      POS_TERMINAL_ID,
    );
    await posTerminalRepository.save(terminal!.update({ status: 'inactive' }));

    await expect(redeem.execute({ code })).rejects.toBeInstanceOf(
      PosTerminalPairingCodeInvalidError,
    );
  });

  it('parear de novo sobrescreve a credencial anterior', async () => {
    const { redeem, generate, posTerminalRepository, code } =
      await seedWithCode();

    const first = await redeem.execute({ code });
    const { code: secondCode } = await generate.execute({
      organizationId: ORGANIZATION_ID,
      id: POS_TERMINAL_ID,
    });
    const second = await redeem.execute({ code: secondCode });

    const saved = await posTerminalRepository.findById(
      ORGANIZATION_ID,
      POS_TERMINAL_ID,
    );
    // O dispositivo antigo perde o acesso na chamada seguinte — é o que faz
    // reinstalação funcionar sem deixar credencial órfã viva.
    expect(
      DeviceToken.matches(first.deviceToken, saved!.deviceTokenHash!),
    ).toBe(false);
    expect(
      DeviceToken.matches(second.deviceToken, saved!.deviceTokenHash!),
    ).toBe(true);
  });

  it('revogar derruba a credencial e é idempotente', async () => {
    const { redeem, revoke, code } = await seedWithCode();
    await redeem.execute({ code });

    const revoked = await revoke.execute({
      organizationId: ORGANIZATION_ID,
      id: POS_TERMINAL_ID,
    });
    expect(revoked.deviceTokenHash).toBeNull();
    expect(revoked.pairedAt).toBeNull();
    expect(revoked.lastSeenAt).toBeNull();

    // Clicar duas vezes em "revogar" não é erro.
    await expect(
      revoke.execute({ organizationId: ORGANIZATION_ID, id: POS_TERMINAL_ID }),
    ).resolves.toBeInstanceOf(PosTerminal);
  });
});
