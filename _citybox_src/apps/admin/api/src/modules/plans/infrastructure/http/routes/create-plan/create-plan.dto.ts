import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionCycle } from '../../../../../subscriptions/domain/entities/subscription.entity';

export class PlanPriceItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stripePriceId?: string | null;

  @ApiProperty({ enum: ['MONTHLY', 'YEARLY'] })
  @IsIn(['MONTHLY', 'YEARLY', 'mensal', 'anual'])
  cycle!: SubscriptionCycle;

  @ApiProperty()
  @IsInt()
  @Min(0)
  priceCents!: number;
}

export class CreatePlanBodyDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  code!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  description!: string;

  @ApiProperty({ type: [PlanPriceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanPriceItemDto)
  prices!: PlanPriceItemDto[];

  @ApiProperty({
    description: 'Vertical de negócio do catálogo (ex.: Food, Clínica)',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  vertical!: string;

  @ApiProperty({
    description: 'Tier do plano dentro da vertical (ex.: prata, ouro)',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  tier!: string;

  @ApiProperty({
    description: 'Limite de unidades operacionais (Negócio) dentro da vertical',
  })
  @IsInt()
  @Min(1)
  maxNegocios!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  maxUsers!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxProducts?: number | null;
}
