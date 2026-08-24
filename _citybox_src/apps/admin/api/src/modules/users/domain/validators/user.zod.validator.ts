import { z } from 'zod';
import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import type { User } from '../entities/user.entity';

export class UserZodValidator implements Validator<User> {
  private constructor() {}

  public static create(): UserZodValidator {
    return new UserZodValidator();
  }

  public validate(input: User): void {
    try {
      this.getSchema().parse({
        id: input.id,
        keycloakSub: input.props.keycloakSub,
        email: input.props.email,
        displayName: input.props.displayName,
        createdAt: input.props.createdAt,
        updatedAt: input.props.updatedAt,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating User ${input.id}: ${msg}`,
          externalMessage: msg,
          context: UserZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating User: ${err.message}`,
        externalMessage: 'Houve um erro ao validar os dados do usuário',
        context: UserZodValidator.name,
      });
    }
  }

  private getSchema() {
    return z.object({
      id: z.string().uuid(),
      keycloakSub: z.string().min(1, 'keycloakSub é obrigatório'),
      email: z.string().email('E-mail inválido').nullable(),
      displayName: z
        .string()
        .max(200, 'Nome deve ter no máximo 200 caracteres')
        .nullable(),
      createdAt: z.date(),
      updatedAt: z.date(),
    });
  }
}
