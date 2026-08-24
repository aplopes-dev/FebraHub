import { InvoiceZodValidator } from '../validators/invoice.zod.validator';

export class InvoiceValidatorFactory {
  static create() {
    return InvoiceZodValidator.create();
  }
}
