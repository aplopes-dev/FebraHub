import { z } from 'zod';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

export function parseMemberId(memberId: string): string {
  const result = z.string().uuid().safeParse(memberId);
  if (!result.success) {
    throw new ValidatorDomainError({
      internalMessage: `Invalid memberId: ${memberId}`,
      externalMessage: 'Identificador do membro inválido',
      context: 'parseMemberId',
    });
  }
  return result.data;
}
