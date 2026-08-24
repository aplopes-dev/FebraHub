import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TRANSACTION_PAYMENT_METHODS } from '../../../../application/policies/transaction-payment-method.policy';

const TRANSACTION_TYPES = ['SALE', 'RENTAL'] as const;
const INITIAL_STATUSES = ['PROPOSAL', 'CONTRACT_SIGNED'] as const;
const PAYMENT_METHODS = TRANSACTION_PAYMENT_METHODS as readonly string[];
const ORGANIZATION_TYPES = ['AGENCY', 'SINGLE_AGENT'] as const;
const ACTOR_ROLES = ['ADMIN', 'MANAGER', 'AGENT', 'AUTONOMOUS'] as const;

/** Rascunho de criação de negócio, vindo do dialog "Nova transação". */
export class CreateTransactionDto {
  @ApiProperty({ enum: TRANSACTION_TYPES })
  @IsIn(TRANSACTION_TYPES)
  type!: (typeof TRANSACTION_TYPES)[number];

  @ApiProperty()
  @IsString()
  @MinLength(1)
  propertyId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  leadId!: string;

  @ApiPropertyOptional({
    description: 'Negócio CRM vinculado (inferido pelo lead se omitido)',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  dealId?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  grossValueCents!: number;

  @ApiProperty({ enum: PAYMENT_METHODS })
  @IsIn(PAYMENT_METHODS)
  paymentMethod!: (typeof TRANSACTION_PAYMENT_METHODS)[number];

  @ApiProperty()
  @IsString()
  sellerId!: string;

  @ApiProperty({ enum: INITIAL_STATUSES })
  @IsIn(INITIAL_STATUSES)
  initialStatus!: (typeof INITIAL_STATUSES)[number];

  @ApiProperty()
  @IsString()
  @MinLength(1)
  actorAgentId!: string;

  @ApiProperty({ enum: ORGANIZATION_TYPES })
  @IsIn(ORGANIZATION_TYPES)
  organizationType!: (typeof ORGANIZATION_TYPES)[number];

  @ApiProperty({ enum: ACTOR_ROLES })
  @IsIn(ACTOR_ROLES)
  actorRole!: (typeof ACTOR_ROLES)[number];

  @ApiProperty()
  @IsString()
  @MinLength(1)
  actorName!: string;
}
