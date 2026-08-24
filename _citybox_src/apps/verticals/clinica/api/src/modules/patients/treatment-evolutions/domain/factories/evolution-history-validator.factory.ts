import type { Validator } from '../../../../../shared/domain/validators/validator.interface';
import type { EvolutionHistory } from '../entities/evolution-history.entity';
import { EvolutionHistoryZodValidator } from '../validators/evolution-history.zod.validator';

export class EvolutionHistoryValidatorFactory {
  public static create(): Validator<EvolutionHistory> {
    return EvolutionHistoryZodValidator.create();
  }
}
