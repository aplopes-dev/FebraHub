import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import type { Stock } from '../entities/stock.entity';
import { StockZodValidator } from '../validators/stock.zod.validator';

export class StockValidatorFactory {
  public static create(): Validator<Stock> {
    return StockZodValidator.create();
  }
}
