import { Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LookupCepParamsDto {
  @ApiProperty({ example: '89010025', description: 'CEP com 8 dígitos' })
  @Matches(/^\d{8}$/, { message: 'CEP deve conter 8 dígitos' })
  cep!: string;
}
