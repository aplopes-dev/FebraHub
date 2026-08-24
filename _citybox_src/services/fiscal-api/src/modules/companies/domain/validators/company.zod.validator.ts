import { z } from 'zod';
import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import {
  JUSTIFICATION_MAX_LENGTH,
  JUSTIFICATION_MIN_LENGTH,
} from '../../../../shared/domain/fiscal-justification.constants';
import {
  TAX_REGIMES,
  ENVIRONMENTS,
  type Company,
} from '../entities/company.entity';

/// `null` OU 15–255 caracteres — nunca uma string vazia/curta demais pra
/// valer como justificativa perante a SEFAZ, mas também nunca obrigatória
/// (o Emitente pode não ter preenchido ainda).
const justificationSchema = z
  .string()
  .min(
    JUSTIFICATION_MIN_LENGTH,
    `deve ter no mínimo ${JUSTIFICATION_MIN_LENGTH} caracteres (exigência SEFAZ)`,
  )
  .max(
    JUSTIFICATION_MAX_LENGTH,
    `deve ter no máximo ${JUSTIFICATION_MAX_LENGTH} caracteres (exigência SEFAZ)`,
  )
  .nullable();

/// Dígito verificador de CNPJ (14 dígitos) — evita cadastrar CNPJ obviamente
/// inválido antes de qualquer emissão fiscal em nome do Emitente.
function isValidCnpj(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false;

  const calcCheckDigit = (base: string, weights: number[]): number => {
    const sum = base
      .split('')
      .reduce((acc, digit, i) => acc + Number(digit) * weights[i], 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calcCheckDigit(digits.slice(0, 12), weights1);
  const d2 = calcCheckDigit(digits.slice(0, 12) + d1, weights2);

  return digits === digits.slice(0, 12) + String(d1) + String(d2);
}

export class CompanyZodValidator implements Validator<Company> {
  private constructor() {}

  public static create(): CompanyZodValidator {
    return new CompanyZodValidator();
  }

  public validate(input: Company): void {
    try {
      this.getSchema().parse({
        storeId: input.props.storeId,
        cnpj: input.props.cnpj,
        legalName: input.props.legalName,
        tradeName: input.props.tradeName,
        stateRegistration: input.props.stateRegistration,
        municipalRegistration: input.props.municipalRegistration,
        taxRegime: input.props.taxRegime,
        cityCodeIbge: input.props.cityCodeIbge,
        uf: input.props.uf,
        address: input.props.address,
        defaultEnvironment: input.props.defaultEnvironment,
        active: input.props.active,
        createdAt: input.props.createdAt,
        updatedAt: input.props.updatedAt,
        inutilizationJustification: input.props.inutilizationJustification,
        cancellationJustification: input.props.cancellationJustification,
      });
      if (!isValidCnpj(input.props.cnpj)) {
        throw new ValidatorDomainError({
          internalMessage: `Invalid CNPJ check digit: ${input.props.cnpj}`,
          externalMessage: 'CNPJ inválido (dígito verificador não confere)',
          context: CompanyZodValidator.name,
        });
      }
    } catch (error) {
      if (error instanceof ValidatorDomainError) {
        throw error;
      }
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating Company ${input.id}: ${msg}`,
          externalMessage: msg,
          context: CompanyZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating Company: ${err.message}`,
        externalMessage: 'Houve um erro ao validar os dados do emitente',
        context: CompanyZodValidator.name,
      });
    }
  }

  private getSchema() {
    return z.object({
      storeId: z.string().uuid(),
      cnpj: z.string().min(14).max(18),
      legalName: z.string().min(1).max(255),
      tradeName: z.string().max(255).nullable(),
      stateRegistration: z.string().max(30).nullable(),
      municipalRegistration: z.string().max(30).nullable(),
      taxRegime: z.enum(TAX_REGIMES),
      cityCodeIbge: z
        .string()
        .regex(/^\d{7}$/, 'código IBGE deve ter 7 dígitos'),
      uf: z.string().length(2),
      address: z.object({
        street: z.string().min(1),
        number: z.string().min(1),
        complement: z.string().nullable(),
        district: z.string().min(1),
        city: z.string().min(1),
        zipCode: z.string().min(8).max(9),
      }),
      defaultEnvironment: z.enum(ENVIRONMENTS),
      active: z.boolean(),
      createdAt: z.date(),
      updatedAt: z.date(),
      inutilizationJustification: justificationSchema,
      cancellationJustification: justificationSchema,
    });
  }
}
