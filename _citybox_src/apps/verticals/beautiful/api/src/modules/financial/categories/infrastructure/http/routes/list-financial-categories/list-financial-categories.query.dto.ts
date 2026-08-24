import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListFinancialCategoriesQueryDto {
  @ApiPropertyOptional({ enum: ['income', 'expense'] })
  @IsOptional()
  @IsIn(['income', 'expense'])
  kind?: 'income' | 'expense';
}
