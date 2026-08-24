import { z } from 'zod';
import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import {
  POS_TERMINAL_STATUSES,
  type PosTerminal,
} from '../entities/pos-terminal.entity';

export class PosTerminalZodValidator implements Validator<PosTerminal> {
  private constructor() {}

  public static create(): PosTerminalZodValidator {
    return new PosTerminalZodValidator();
  }

  public validate(input: PosTerminal): void {
    try {
      this.getSchema().parse(input.props);
    } catch (error) {
      if (error instanceof ValidatorDomainError) throw error;
      if (error instanceof z.ZodError) {
        const message = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating PosTerminal ${input.props.name}: ${message}`,
          externalMessage: message,
          context: PosTerminalZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating PosTerminal: ${err.message}`,
        externalMessage: 'Houve um erro ao validar os dados do terminal de PDV',
        context: PosTerminalZodValidator.name,
      });
    }
  }

  private getSchema() {
    return z.object({
      organizationId: z.string().uuid(),
      branchId: z.string().uuid(),
      name: z.string().trim().min(2).max(100),
      status: z.enum(POS_TERMINAL_STATUSES),
      printer: z.string().trim().max(100).nullable(),
      scale: z.string().trim().max(100).nullable(),
      nfceContingency: z.boolean(),
      offlineServerId: z.string().trim().max(100).nullable(),
      pairingCode: z.string().trim().max(20).nullable(),
      pairingCodeExpiresAt: z.date().nullable(),
      deviceTokenHash: z.string().length(64).nullable(),
      pairedAt: z.date().nullable(),
      pairedDeviceLabel: z.string().trim().max(120).nullable(),
      lastSeenAt: z.date().nullable(),
      deletedAt: z.date().nullable(),
      createdAt: z.date(),
      updatedAt: z.date(),
    });
  }
}
