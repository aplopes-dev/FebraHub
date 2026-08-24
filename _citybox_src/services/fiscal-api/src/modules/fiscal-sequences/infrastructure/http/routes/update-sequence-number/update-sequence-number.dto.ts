import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

/// NF-e/NFC-e usam número de até 9 dígitos (nNF). Teto defensivo contra valor
/// digitado errado que quebraria a numeração de forma irreversível.
const MAX_FISCAL_NUMBER = 999_999_999;

export class UpdateSequenceNumberDto {
  @ApiProperty({
    description:
      'Novo número atual. Só aumento é aceito; reduzir é bloqueado (reemitiria faixa autorizada).',
  })
  @IsInt()
  @Min(0)
  @Max(MAX_FISCAL_NUMBER)
  newNumber!: number;
}
