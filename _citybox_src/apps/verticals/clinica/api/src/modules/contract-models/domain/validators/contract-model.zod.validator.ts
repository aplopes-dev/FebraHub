import { z } from 'zod';
import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import type { ContractModel } from '../entities/contract-model.entity';

export class ContractModelZodValidator implements Validator<ContractModel> {
  private constructor() {}

  public static create(): ContractModelZodValidator {
    return new ContractModelZodValidator();
  }

  public validate(input: ContractModel): void {
    try {
      this.getSchema().parse({
        id: input.id,
        storeId: input.props.storeId,
        name: input.props.name,
        content: input.props.content,
        isDefault: input.props.isDefault,
        createdAt: input.props.createdAt,
        updatedAt: input.props.updatedAt,
      });
    } catch (error) {
      if (error instanceof ValidatorDomainError) {
        throw error;
      }
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating ContractModel ${input.id}: ${msg}`,
          externalMessage: msg,
          context: ContractModelZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating ContractModel: ${err.message}`,
        externalMessage:
          'Houve um erro ao validar os dados do modelo de contrato',
        context: ContractModelZodValidator.name,
      });
    }
  }

  private getSchema() {
    return z.object({
      id: z.string().uuid(),
      storeId: z.string().uuid(),
      name: z.string().min(1).max(120),
      content: z.string(),
      isDefault: z.boolean(),
      createdAt: z.date(),
      updatedAt: z.date(),
    });
  }
}
