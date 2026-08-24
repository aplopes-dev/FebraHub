import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CorrectionLetterNfeHttpDto {
  /// `xCorrecao` no schema oficial da CC-e (evCCeNFe) exige 15–1000
  /// caracteres — mesma regra aplicada aqui (não documentada no contract.md,
  /// que só diz "string"; validação alinhada ao leiaute oficial da SEFAZ).
  @ApiProperty({
    description:
      'Texto da carta de correção (15–1000 caracteres — leiaute oficial da CC-e)',
    minLength: 15,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(15, {
    message:
      'correctionText deve ter no mínimo 15 caracteres (exigência SEFAZ)',
  })
  @MaxLength(1000, {
    message:
      'correctionText deve ter no máximo 1000 caracteres (exigência SEFAZ)',
  })
  correctionText!: string;
}
