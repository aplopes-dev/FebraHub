import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, ValidateIf } from 'class-validator';
import { POS_MODULE_PROFILE_NAMES } from '../../../../domain/entities/pos-module-defaults.entity';

export class UpsertPosModuleDefaultsHttpDto {
  @ApiPropertyOptional({
    enum: POS_MODULE_PROFILE_NAMES,
    description:
      'Aplica um perfil pronto, **substituindo** o conjunto inteiro. Combinado com `modules`, o perfil vale primeiro e os ajustes depois.',
  })
  @IsOptional()
  @IsIn(POS_MODULE_PROFILE_NAMES)
  applyProfile?: string;

  @ApiPropertyOptional({
    description:
      'Estado por módulo opcional. Id desconhecido e módulo de núcleo são descartados em silêncio.',
    example: { tables: 'available', delivery: 'disabled' },
  })
  @IsOptional()
  @IsObject()
  modules?: Record<string, unknown>;
}

export class UpsertTerminalModulesHttpDto {
  @ApiProperty({
    nullable: true,
    description:
      '`null` faz o terminal **voltar a herdar** o padrão da loja. Um objeto define a sobrescrita própria.',
    example: { tables: 'disabled' },
  })
  // `ValidateIf` em vez de `IsOptional`: aqui `null` é um valor com
  // significado — "volte a herdar" —, e não a ausência do campo. `IsOptional`
  // deixaria `null` passar sem validação **e** tornaria o campo omissível, o
  // que apagaria a diferença entre "não mexi" e "quero herdar".
  @ValidateIf((_, value) => value !== null)
  @IsObject()
  modules!: Record<string, unknown> | null;
}
