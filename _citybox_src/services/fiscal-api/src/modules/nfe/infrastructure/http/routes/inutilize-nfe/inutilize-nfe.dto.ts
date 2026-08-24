import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class InutilizeNfeHttpDto {
  @ApiProperty() @IsUUID() companyId!: string;
  @ApiProperty() @IsString() series!: string;

  @ApiProperty() @IsInt() @Min(1) numberStart!: number;
  @ApiProperty() @IsInt() @Min(1) numberEnd!: number;

  /// `xJust` no schema oficial (evCancNFe/inutNFe) exige 15–255 caracteres —
  /// mesma regra aplicada aqui, mesmo padrão de `CancelNfeHttpDto`.
  @ApiProperty({ minLength: 15, maxLength: 255 })
  @IsString()
  @MinLength(15, {
    message: 'justification deve ter no mínimo 15 caracteres (exigência SEFAZ)',
  })
  @MaxLength(255, {
    message:
      'justification deve ter no máximo 255 caracteres (exigência SEFAZ)',
  })
  justification!: string;
}
