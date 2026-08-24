import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateInvoicesJobBodyDto {
  @ApiPropertyOptional({
    description: 'Data de referência para a janela de faturamento (AAAA-MM-DD)',
  })
  @IsOptional()
  @IsString()
  referenceDate?: string;
}
