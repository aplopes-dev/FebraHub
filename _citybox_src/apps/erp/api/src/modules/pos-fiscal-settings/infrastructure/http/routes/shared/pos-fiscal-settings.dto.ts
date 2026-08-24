import { ApiProperty } from '@nestjs/swagger';
import { IsIn, ValidateIf } from 'class-validator';
import {
  POS_DOCUMENT_MODELS,
  type PosDocumentModel,
} from '../../../../domain/entities/pos-fiscal-settings.entity';

export class UpsertPosFiscalSettingsHttpDto {
  @ApiProperty({
    enum: POS_DOCUMENT_MODELS,
    nullable: true,
    description:
      'Modelo emitido pelo PDV: MODEL_55 (NF-e), MODEL_65 (NFC-e) ou null (não configurado).',
  })
  // Aceita null explicitamente (limpar a configuração); se presente, deve ser um modelo válido.
  @ValidateIf(
    (o: UpsertPosFiscalSettingsHttpDto) => o.posDocumentModel !== null,
  )
  @IsIn(POS_DOCUMENT_MODELS)
  posDocumentModel!: PosDocumentModel | null;
}

export function toUpsertPosFiscalSettingsInput(
  dto: UpsertPosFiscalSettingsHttpDto,
): { posDocumentModel: PosDocumentModel | null } {
  return { posDocumentModel: dto.posDocumentModel ?? null };
}
