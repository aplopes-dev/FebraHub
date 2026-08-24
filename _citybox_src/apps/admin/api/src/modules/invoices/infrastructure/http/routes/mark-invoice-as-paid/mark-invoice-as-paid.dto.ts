import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkInvoiceAsPaidBodyDto {
  @ApiProperty({
    description:
      'Método de pagamento informado manualmente (ex: pix, boleto, manual)',
  })
  @IsNotEmpty()
  @IsString()
  method: string;
}
