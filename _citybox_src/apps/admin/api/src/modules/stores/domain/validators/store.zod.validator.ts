import { z } from 'zod';
import { CLINIC_STRANDS } from '@citybox/messaging';
import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import {
  isValidCnpj,
  isValidCpf,
} from '../../../../shared/core/utils/brazilian-document.utils';
import type { Store } from '../entities/store.entity';

export class StoreZodValidator implements Validator<Store> {
  private constructor() {}

  public static create(): StoreZodValidator {
    return new StoreZodValidator();
  }

  public validate(input: Store): void {
    try {
      this.getSchema().parse({
        id: input.id,
        vertical: input.props.vertical,
        clinicStrand: input.props.clinicStrand,
        tradeName: input.props.tradeName,
        slug: input.props.slug,
        status: input.props.status,
        deploymentStatus: input.props.deploymentStatus,
        document: input.props.document,
        personType: input.props.personType,
        responsibleName: input.props.responsibleName,
        billingEmail: input.props.billingEmail,
        legalName: input.props.legalName,
        stateRegistration: input.props.stateRegistration,
        zipCode: input.props.zipCode,
        street: input.props.street,
        number: input.props.streetNumber,
        complement: input.props.complement,
        neighborhood: input.props.neighborhood,
        city: input.props.city,
        state: input.props.state,
        phone: input.props.phone,
        timezone: input.props.timezone,
        createdAt: input.props.createdAt,
        updatedAt: input.props.updatedAt,
      });

      // Até a Fase 10 este bloco só rodava quando `usesClientDocument` era false (isto
      // é, quando a loja tinha documento próprio em vez de herdar o do Cliente).
      //
      // A validação é aplicada **quando há documento**, não "sempre". O motivo é
      // concreto: este validador roda também em `Store.with()`, ao hidratar do banco.
      // Exigir documento aqui faria UMA linha incompleta derrubar `GET /v1/stores`
      // inteiro — foi exatamente o que aconteceu na Fase 0. A obrigatoriedade no
      // cadastro é garantida no DTO da rota de criação, onde a falha atinge só quem
      // está cadastrando.
      if (input.props.document) {
        // Lojas do fluxo novo (FR-001) trazem personType e validam CPF/CNPJ de acordo;
        // legado (sem personType) mantém a regra antiga: sempre CNPJ + razão social.
        const isCpf = input.props.personType === 'PF';
        const documentValid = isCpf
          ? isValidCpf(input.props.document)
          : isValidCnpj(input.props.document);

        if (!documentValid) {
          throw new ValidatorDomainError({
            internalMessage: `Invalid ${isCpf ? 'CPF' : 'CNPJ'} for store ${input.id}: ${input.props.document}`,
            externalMessage: isCpf ? 'CPF inválido' : 'CNPJ inválido',
            context: StoreZodValidator.name,
          });
        }

        if (!input.props.personType && !input.props.legalName?.trim()) {
          throw new ValidatorDomainError({
            internalMessage: `Store ${input.id} requires legalName for legacy CNPJ stores`,
            externalMessage: 'Razão social é obrigatória',
            context: StoreZodValidator.name,
          });
        }
      }
    } catch (error) {
      if (error instanceof ValidatorDomainError) {
        throw error;
      }
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating Store ${input.id}: ${msg}`,
          externalMessage: msg,
          context: StoreZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating Store: ${err.message}`,
        externalMessage: 'Houve um erro ao validar os dados da loja',
        context: StoreZodValidator.name,
      });
    }
  }

  private getSchema() {
    return z.object({
      id: z.string().uuid(),
      // Espelha `StoreVertical` (store.entity.ts) — uma vertical por sistema.
      vertical: z.enum(['Comércio', 'Clínica', 'Imóveis', 'Beautiful']),
      clinicStrand: z.enum(CLINIC_STRANDS).nullable(),
      tradeName: z.string().min(1).max(200),
      slug: z
        .string()
        .min(1)
        .max(100)
        .regex(/^[a-z0-9-]+$/),
      status: z.enum([
        'IN_SETUP',
        'TRAINING',
        'PRODUCTION',
        'BLOCKED',
        'OFFLINE',
      ]),
      deploymentStatus: z.enum(['PENDING', 'PROVISIONING', 'ACTIVE', 'FAILED']),
      document: z.string().max(14).nullable(),
      personType: z.enum(['PF', 'PJ']).nullable(),
      responsibleName: z.string().max(200).nullable(),
      billingEmail: z.string().email().max(200).nullable(),
      legalName: z.string().max(200).nullable(),
      stateRegistration: z.string().max(50).nullable(),
      zipCode: z.string().max(20).nullable(),
      street: z.string().max(200).nullable(),
      number: z.string().max(20).nullable(),
      complement: z.string().max(100).nullable(),
      neighborhood: z.string().max(100).nullable(),
      city: z.string().max(100).nullable(),
      state: z.string().max(2).nullable(),
      phone: z.string().max(30).nullable(),
      timezone: z.string().min(1).max(100),
      createdAt: z.date(),
      updatedAt: z.date(),
    });
  }
}
