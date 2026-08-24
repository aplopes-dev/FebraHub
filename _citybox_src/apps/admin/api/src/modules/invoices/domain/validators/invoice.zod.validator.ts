import { z } from 'zod';
import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import type { Invoice } from '../entities/invoice.entity';

export class InvoiceZodValidator implements Validator<Invoice> {
  private constructor() {}

  public static create(): InvoiceZodValidator {
    return new InvoiceZodValidator();
  }

  public validate(input: Invoice): void {
    try {
      this.getSchema().parse({
        id: input.id,
        subscriptionId: input.props.subscriptionId,
        storeId: input.props.storeId,
        amountCents: input.props.amountCents,
        currency: input.props.currency,
        status: input.props.status,
        dueDate: input.props.dueDate,
        paidAt: input.props.paidAt,
        method: input.props.method,
        gatewayPaymentId: input.props.gatewayPaymentId,
        invoiceUrl: input.props.invoiceUrl ?? null,
        notes: input.props.notes,
        periodStart: input.props.periodStart,
        periodEnd: input.props.periodEnd,
        createdAt: input.props.createdAt,
        updatedAt: input.props.updatedAt,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating Invoice ${input.id}: ${msg}`,
          externalMessage: msg,
          context: InvoiceZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating Invoice: ${err.message}`,
        externalMessage: 'Houve um erro ao validar os dados da fatura',
        context: InvoiceZodValidator.name,
      });
    }
  }

  private getSchema() {
    return z.object({
      id: z.string().uuid(),
      subscriptionId: z.string().uuid(),
      storeId: z.string().uuid(),
      amountCents: z.number().int().min(0),
      currency: z.string().min(1),
      status: z.enum(['DRAFT', 'OPEN', 'PAID', 'PAST_DUE', 'VOID']),
      dueDate: z.date(),
      paidAt: z.date().nullable(),
      method: z.string().nullable(),
      gatewayPaymentId: z.string().nullable(),
      invoiceUrl: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
      periodStart: z.date(),
      periodEnd: z.date(),
      createdAt: z.date(),
      updatedAt: z.date(),
    });
  }
}
