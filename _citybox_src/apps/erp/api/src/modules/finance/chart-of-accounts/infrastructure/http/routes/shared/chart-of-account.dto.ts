import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { MAX_PER_PAGE } from '../../../../../../tenancy/application/pagination';
import { CHART_OF_ACCOUNT_LIST_TABS } from '../../../../domain/repositories/chart-of-account.repository.interface';

class ChartOfAccountWritableHttpDto {
  @ApiProperty({ example: 'Vendas no balcão' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ description: 'Grupo financeiro ao qual a conta pertence' })
  @IsUUID()
  financialGroupId!: string;

  @ApiPropertyOptional({
    description: 'Disponibiliza a conta no seletor do PDV',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  availableForPdv?: boolean;
}

export class CreateChartOfAccountHttpDto extends ChartOfAccountWritableHttpDto {}

export class UpdateChartOfAccountHttpDto extends ChartOfAccountWritableHttpDto {}

export class ListChartOfAccountsQueryDto {
  @ApiPropertyOptional({ description: 'Busca por nome da conta' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ enum: CHART_OF_ACCOUNT_LIST_TABS, default: 'active' })
  @IsOptional()
  @IsEnum(CHART_OF_ACCOUNT_LIST_TABS)
  tab?: (typeof CHART_OF_ACCOUNT_LIST_TABS)[number];

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: MAX_PER_PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PER_PAGE)
  perPage?: number;
}
