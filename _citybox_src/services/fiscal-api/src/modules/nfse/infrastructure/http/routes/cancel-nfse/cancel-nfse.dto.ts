import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CancelNfseHttpDto {
  @ApiProperty({
    description: 'Justificativa do cancelamento (mín. 15 caracteres)',
    minLength: 15,
  })
  @IsString()
  @MinLength(15, {
    message: 'justification deve ter no mínimo 15 caracteres',
  })
  justification!: string;
}
