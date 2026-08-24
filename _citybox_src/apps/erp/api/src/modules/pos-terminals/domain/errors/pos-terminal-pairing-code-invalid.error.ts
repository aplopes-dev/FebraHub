import { DomainError } from '../../../../shared/core/errors/domain.error';

/**
 * Código de pareamento expirado, já consumido, ou divergente do terminal.
 *
 * Não é lançado por nenhum use case desta fatia — `GeneratePairingCode` sempre
 * consegue gerar/regenerar. Existe desde já para a fatia de autenticação (onde
 * o app PDV troca o código por credencial) poder falhar com um erro de domínio
 * em vez de inventar um na hora.
 */
export class PosTerminalPairingCodeInvalidError extends DomainError {
  constructor(reason: 'expired' | 'not_found' | 'mismatch') {
    super({
      internalMessage: `Pairing code rejected: ${reason}`,
      externalMessage: 'Código de pareamento inválido ou expirado',
      context: PosTerminalPairingCodeInvalidError.name,
    });
  }
}
