import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFinancialEntryBodyDto {
  @ApiProperty({ enum: ['income', 'expense'] })
  @IsIn(['income', 'expense'])
  type!: 'income' | 'expense';

  @ApiProperty()
  @IsString()
  @MinLength(1)
  description!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  valueCents!: number;

  @ApiProperty({ example: '2026-07-15' })
  @IsDateString()
  dueDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  incomeCategoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
  })
  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
  recurrenceType?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  recurrenceTimes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  paidValueCents?: number;

  @ApiPropertyOptional({ example: '2026-07-15' })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;
}

export class UpdateFinancialEntryBodyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  valueCents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  incomeCategoryId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  observation?: string | null;
}

export class SettleFinancialEntryBodyDto {
  @ApiProperty()
  @IsString()
  paymentMethod!: string;

  @ApiProperty()
  @IsString()
  accountId!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  paidValueCents!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  checkIssueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  checkHolderName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  checkNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  checkBank?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  checkDocument?: string;
}

export class ReceiveFinancialEntryBodyDto extends SettleFinancialEntryBodyDto {
  @ApiProperty({ example: '2026-07-15' })
  @IsDateString()
  receivedAt!: string;
}

export class PayFinancialEntryBodyDto extends SettleFinancialEntryBodyDto {
  @ApiProperty({ example: '2026-07-15' })
  @IsDateString()
  paidAt!: string;
}

export class UpdateFinancialEntryRecurrenceBodyDto {
  @ApiProperty({ enum: ['this', 'this_and_future', 'all'] })
  @IsIn(['this', 'this_and_future', 'all'])
  scope!: 'this' | 'this_and_future' | 'all';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  valueCents?: number;
}
