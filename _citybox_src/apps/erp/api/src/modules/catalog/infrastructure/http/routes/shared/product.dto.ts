import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNumber,
  Min,
  ValidateNested,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PRODUCT_TYPES,
  PRODUCT_VARIATION_FORMATS,
} from '../../../../domain/entities/product.entity';

/** Payload de criação e de atualização — o form manda o mesmo shape nos dois. */
export class ProductSupplierDto {
  @ApiProperty()
  @IsUUID()
  supplierId!: string;

  @ApiPropertyOptional({
    description: 'Código do produto no catálogo do fornecedor',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  supplierCode?: string | null;

  @ApiPropertyOptional({
    default: 1,
    description: 'Quantas unidades nossas vêm em uma unidade de compra dele',
  })
  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  conversion?: number;
}

export class ProductVariationOptionOverrideDto {
  @ApiProperty()
  @IsUUID()
  optionId!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Override de preço em centavos; null = preço do catálogo',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  barcode?: string | null;
}

export class ProductAddonSettingsDto {
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minQuantity?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxQuantity?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  chargeFromSelectedQuantity?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  chargeFromQuantity?: number;
}

export class ProductAddonLineDto {
  @ApiProperty()
  @IsUUID()
  addonId!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxQuantity?: number;

  @ApiProperty({ description: 'Preço da linha em centavos' })
  @IsInt()
  @Min(0)
  priceCents!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class ProductSuggestionDto {
  @ApiProperty()
  @IsUUID()
  suggestedProductId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class ProductVariationLinkDto {
  @ApiProperty()
  @IsUUID()
  variationId!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  optionIds!: string[];

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minChoices?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxChoices?: number;

  @ApiPropertyOptional({ type: [ProductVariationOptionOverrideDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariationOptionOverrideDto)
  optionOverrides?: ProductVariationOptionOverrideDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class SaveProductDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(60)
  sku!: string;

  @ApiProperty()
  @IsUUID()
  categoryId!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  unitOfMeasureId?: string | null;

  @ApiProperty({ enum: PRODUCT_TYPES })
  @IsIn(PRODUCT_TYPES)
  type!: (typeof PRODUCT_TYPES)[number];

  @ApiProperty({ description: 'Preço base em centavos' })
  @IsInt()
  @Min(0)
  basePriceCents!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  perishable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  trackStock?: boolean;

  @ApiPropertyOptional({
    description: 'Disponível no ERP (backoffice / pickers). Default true.',
  })
  @IsOptional()
  @IsBoolean()
  availableOnErp?: boolean;

  @ApiPropertyOptional({
    description: 'Disponível no PDV. Default true.',
  })
  @IsOptional()
  @IsBoolean()
  availableOnPdv?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  barcodes?: string[];

  @ApiPropertyOptional({
    type: [String],
    description:
      'Unidades onde o produto opera. Omitido ou vazio = o produto fica no cadastro da empresa, sem aparecer em nenhuma filial.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  branchIds?: string[];

  @ApiPropertyOptional({
    type: [ProductSupplierDto],
    description:
      'Fornecedores do item, com o código deles e o fator de conversão.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ProductSupplierDto)
  suppliers?: ProductSupplierDto[];

  @ApiPropertyOptional({
    enum: PRODUCT_VARIATION_FORMATS,
    nullable: true,
    description: 'Formato de variação: grade ou valor composto',
  })
  @IsOptional()
  @IsIn([...PRODUCT_VARIATION_FORMATS])
  variationFormat?: (typeof PRODUCT_VARIATION_FORMATS)[number] | null;

  @ApiPropertyOptional({
    type: [ProductVariationLinkDto],
    description: 'Variações do catálogo vinculadas ao produto',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ProductVariationLinkDto)
  variations?: ProductVariationLinkDto[];

  @ApiPropertyOptional({
    type: ProductAddonSettingsDto,
    description: 'Configuração de adicionais (quantidade min/max e cobrança)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductAddonSettingsDto)
  addonSettings?: ProductAddonSettingsDto;

  @ApiPropertyOptional({
    type: [ProductAddonLineDto],
    description: 'Linhas de adicional vinculadas ao produto',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => ProductAddonLineDto)
  addonLines?: ProductAddonLineDto[];

  @ApiPropertyOptional({
    type: [ProductSuggestionDto],
    description: 'Produtos sugeridos (cross-sell) vinculados ao produto',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => ProductSuggestionDto)
  suggestions?: ProductSuggestionDto[];
}

export class BulkDeleteProductsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  ids!: string[];
}
