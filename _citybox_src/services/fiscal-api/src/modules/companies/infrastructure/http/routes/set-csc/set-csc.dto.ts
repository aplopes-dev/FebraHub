import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class SetCscDto {
  /// Aceita a forma que o portal da SEFAZ exibe (`000001`). O XSD proíbe zeros
  /// à esquerda no `cIdToken` do QR Code, mas a normalização é feita na
  /// montagem (`buildNfceQrCode`) e não aqui: recusar o valor tal como o
  /// contribuinte o lê na tela seria hostil e sem ganho.
  @ApiProperty({
    description:
      'Identificador do CSC (cIdToken) fornecido pela SEFAZ, 1 a 6 dígitos. Não é segredo: vai em claro no QR Code impresso.',
    example: '000001',
  })
  @IsString()
  @Length(1, 6)
  @Matches(/^\d+$/, { message: 'cscId deve conter apenas dígitos' })
  cscId!: string;

  /// ⚠️ Sem `@ApiProperty({ example })` com valor plausível de propósito: um
  /// exemplo em formato de CSC real acaba copiado para ambiente de verdade.
  @ApiProperty({
    description:
      'Código de Segurança do Contribuinte (CSC/Token). SEGREDO — é armazenado cifrado e nunca é devolvido por nenhum endpoint.',
    writeOnly: true,
  })
  @IsString()
  @Length(1, 128)
  cscToken!: string;
}
