import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

/** Campo ausente não muda — mesma semântica do PATCH dos demais módulos. */
export class UpsertPosPolicyHttpDto {
  @ApiPropertyOptional({
    minimum: 0,
    maximum: 100,
    description: 'Desconto acima disto exige supervisor. 100 = nunca exige.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discountSupervisorAbovePercent?: number;

  @ApiPropertyOptional({
    minimum: 0,
    description: 'Sangria acima disto exige supervisor. 0 = sempre exige.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  withdrawalSupervisorAboveCents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  cancellationRequiresSupervisor?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  refundRequiresSupervisor?: boolean;
}

export function toUpsertPosPolicyInput(dto: UpsertPosPolicyHttpDto) {
  const input: {
    discountSupervisorAbovePercent?: number;
    withdrawalSupervisorAboveCents?: number;
    cancellationRequiresSupervisor?: boolean;
    refundRequiresSupervisor?: boolean;
  } = {};

  if (dto.discountSupervisorAbovePercent !== undefined) {
    input.discountSupervisorAbovePercent = dto.discountSupervisorAbovePercent;
  }
  if (dto.withdrawalSupervisorAboveCents !== undefined) {
    input.withdrawalSupervisorAboveCents = dto.withdrawalSupervisorAboveCents;
  }
  if (dto.cancellationRequiresSupervisor !== undefined) {
    input.cancellationRequiresSupervisor = dto.cancellationRequiresSupervisor;
  }
  if (dto.refundRequiresSupervisor !== undefined) {
    input.refundRequiresSupervisor = dto.refundRequiresSupervisor;
  }

  return input;
}
