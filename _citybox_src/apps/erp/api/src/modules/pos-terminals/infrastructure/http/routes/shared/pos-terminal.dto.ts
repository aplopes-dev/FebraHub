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
import { MAX_PER_PAGE } from '../../../../../tenancy/application/pagination';
import { POS_TERMINAL_STATUSES } from '../../../../domain/entities/pos-terminal.entity';

export class CreatePosTerminalHttpDto {
  @ApiProperty()
  @IsUUID()
  branchId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ enum: POS_TERMINAL_STATUSES, default: 'active' })
  @IsOptional()
  @IsEnum(POS_TERMINAL_STATUSES)
  status?: (typeof POS_TERMINAL_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  printer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  scale?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  nfceContingency?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  offlineServerId?: string;
}

/**
 * PATCH: todo campo é opcional; ausente não muda (ver `toUpdatePosTerminalInput`).
 * `printer`/`scale`/`offlineServerId` aceitam `null` explícito para limpar —
 * `class-validator` não distingue `undefined` de `null` sozinho, então o campo
 * fica sem `@IsString()` estrito e a normalização é feita no mapeamento.
 */
export class UpdatePosTerminalHttpDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ enum: POS_TERMINAL_STATUSES })
  @IsOptional()
  @IsEnum(POS_TERMINAL_STATUSES)
  status?: (typeof POS_TERMINAL_STATUSES)[number];

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  printer?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  scale?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  nfceContingency?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  offlineServerId?: string | null;
}

export class RedeemPairingCodeHttpDto {
  @ApiProperty({ description: 'Código de 8 caracteres gerado no ERP' })
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  code!: string;

  @ApiPropertyOptional({
    description: 'Como o dispositivo se apresenta na listagem de terminais',
    example: 'Windows · Caixa da frente',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceLabel?: string;
}

export class ListPosTerminalsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: POS_TERMINAL_STATUSES })
  @IsOptional()
  @IsEnum(POS_TERMINAL_STATUSES)
  status?: (typeof POS_TERMINAL_STATUSES)[number];

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

export function toCreatePosTerminalInput(dto: CreatePosTerminalHttpDto) {
  return {
    branchId: dto.branchId,
    name: dto.name,
    status: dto.status,
    printer: dto.printer ?? null,
    scale: dto.scale ?? null,
    nfceContingency: dto.nfceContingency,
    offlineServerId: dto.offlineServerId ?? null,
  };
}

/**
 * PATCH: só entram no objeto os campos presentes no corpo — `undefined` vira
 * "omitido" (chave ausente), que o use case/entidade tratam como "não mudar".
 * `null` explícito (limpar) é preservado.
 */
export function toUpdatePosTerminalInput(dto: UpdatePosTerminalHttpDto) {
  const input: {
    branchId?: string;
    name?: string;
    status?: (typeof POS_TERMINAL_STATUSES)[number];
    printer?: string | null;
    scale?: string | null;
    nfceContingency?: boolean;
    offlineServerId?: string | null;
  } = {};

  if (dto.branchId !== undefined) input.branchId = dto.branchId;
  if (dto.name !== undefined) input.name = dto.name;
  if (dto.status !== undefined) input.status = dto.status;
  if (dto.printer !== undefined) input.printer = dto.printer;
  if (dto.scale !== undefined) input.scale = dto.scale;
  if (dto.nfceContingency !== undefined) {
    input.nfceContingency = dto.nfceContingency;
  }
  if (dto.offlineServerId !== undefined) {
    input.offlineServerId = dto.offlineServerId;
  }

  return input;
}
