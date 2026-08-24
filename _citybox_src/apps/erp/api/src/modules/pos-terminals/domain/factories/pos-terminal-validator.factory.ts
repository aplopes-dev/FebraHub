import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import type { PosTerminal } from '../entities/pos-terminal.entity';
import { PosTerminalZodValidator } from '../validators/pos-terminal.zod.validator';

export class PosTerminalValidatorFactory {
  public static create(): Validator<PosTerminal> {
    return PosTerminalZodValidator.create();
  }
}
