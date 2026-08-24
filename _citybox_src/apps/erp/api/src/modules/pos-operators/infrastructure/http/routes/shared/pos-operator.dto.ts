import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { POS_OPERATOR_PIN_LENGTH } from '../../../../domain/validators/pos-operator-pin';

const PIN_REGEX = new RegExp(`^\\d{${POS_OPERATOR_PIN_LENGTH}}$`);
const PIN_MESSAGE = `O PIN deve ter exatamente ${POS_OPERATOR_PIN_LENGTH} dígitos`;

export class AuthenticatePosOperatorHttpDto {
  @ApiProperty({ description: 'Código PDV do membro na organização' })
  @IsString()
  @MinLength(1)
  @MaxLength(16)
  code!: string;

  @ApiProperty({ description: `${POS_OPERATOR_PIN_LENGTH} dígitos` })
  @Matches(PIN_REGEX, { message: PIN_MESSAGE })
  pin!: string;
}
