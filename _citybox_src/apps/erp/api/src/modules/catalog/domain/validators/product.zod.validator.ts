import { z } from 'zod';
import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import {
  PRODUCT_TYPES,
  PRODUCT_VARIATION_FORMATS,
  type Product,
} from '../entities/product.entity';

export class ProductZodValidator implements Validator<Product> {
  private constructor() {}

  public static create(): ProductZodValidator {
    return new ProductZodValidator();
  }

  public validate(input: Product): void {
    try {
      this.getSchema().parse({
        organizationId: input.props.organizationId,
        name: input.props.name,
        sku: input.props.sku,
        categoryId: input.props.categoryId,
        unitOfMeasureId: input.props.unitOfMeasureId,
        type: input.props.type,
        basePriceCents: input.props.basePriceCents,
        perishable: input.props.perishable,
        description: input.props.description,
        imageUrl: input.props.imageUrl,
        trackStock: input.props.trackStock,
        barcodes: input.props.barcodes,
        availableOnErp: input.props.availableOnErp,
        availableOnPdv: input.props.availableOnPdv,
        branchIds: input.props.branchIds,
        suppliers: input.props.suppliers,
        variationFormat: input.props.variationFormat,
        variations: input.props.variations,
        hasVariants: input.props.hasVariants,
        variantsCount: input.props.variantsCount,
        addonSettings: input.props.addonSettings,
        addonLines: input.props.addonLines,
        suggestions: input.props.suggestions,
        deletedAt: input.props.deletedAt,
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
          internalMessage: `Error validating Product ${input.props.sku}: ${msg}`,
          externalMessage: msg,
          context: ProductZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating Product: ${err.message}`,
        externalMessage: 'Houve um erro ao validar os dados do produto',
        context: ProductZodValidator.name,
      });
    }
  }

  private getSchema() {
    return z.object({
      organizationId: z.string().min(1),
      name: z.string().trim().min(1).max(200),
      sku: z.string().trim().min(1).max(60),
      categoryId: z.string().uuid(),
      unitOfMeasureId: z.string().uuid().nullable(),
      type: z.enum(PRODUCT_TYPES),
      basePriceCents: z.number().int().min(0),
      perishable: z.boolean(),
      description: z.string().max(2000),
      imageUrl: z.string().max(2048).nullable(),
      trackStock: z.boolean(),
      barcodes: z.array(z.string().trim().min(1).max(60)).max(20),
      availableOnErp: z.boolean(),
      availableOnPdv: z.boolean(),
      branchIds: z.array(z.string().uuid()).max(200),
      suppliers: z
        .array(
          z.object({
            supplierId: z.string().uuid(),
            supplierCode: z.string().trim().max(60).nullable(),
            conversion: z.number().positive().max(1_000_000),
          }),
        )
        .max(50),
      variationFormat: z.enum(PRODUCT_VARIATION_FORMATS).nullable(),
      variations: z
        .array(
          z.object({
            variationId: z.string().uuid(),
            optionIds: z.array(z.string().uuid()).max(100),
            minChoices: z.number().int().min(0),
            maxChoices: z.number().int().min(0),
            optionOverrides: z
              .array(
                z.object({
                  optionId: z.string().uuid(),
                  priceCents: z.number().int().min(0).nullable(),
                  barcode: z.string().max(60).nullable(),
                }),
              )
              .max(100),
            sortOrder: z.number().int().min(0),
          }),
        )
        .max(50),
      hasVariants: z.boolean(),
      variantsCount: z.number().int().min(0),
      addonSettings: z
        .object({
          minQuantity: z.number().int().min(0),
          maxQuantity: z.number().int().min(0),
          chargeFromSelectedQuantity: z.boolean(),
          chargeFromQuantity: z.number().int().min(1),
        })
        // FR-007: quantidade mínima não pode ser maior que a máxima.
        .refine((data) => data.minQuantity <= data.maxQuantity, {
          path: ['maxQuantity'],
          message:
            'A quantidade máxima de adicionais deve ser maior ou igual à mínima',
        })
        // FR-006: cobrar a partir de quantidade selecionada exige um valor >= 1.
        .refine(
          (data) =>
            !data.chargeFromSelectedQuantity || data.chargeFromQuantity >= 1,
          {
            path: ['chargeFromQuantity'],
            message:
              'Informe a partir de qual quantidade o valor passa a ser cobrado',
          },
        ),
      addonLines: z
        .array(
          z.object({
            addonId: z.string().uuid(),
            maxQuantity: z.number().int().min(1),
            priceCents: z.number().int().min(0),
            sortOrder: z.number().int().min(0),
          }),
        )
        .max(200),
      suggestions: z
        .array(
          z.object({
            suggestedProductId: z.string().uuid(),
            sortOrder: z.number().int().min(0),
          }),
        )
        .max(200),
      deletedAt: z.date().nullable(),
      createdAt: z.date(),
      updatedAt: z.date(),
    });
  }
}
