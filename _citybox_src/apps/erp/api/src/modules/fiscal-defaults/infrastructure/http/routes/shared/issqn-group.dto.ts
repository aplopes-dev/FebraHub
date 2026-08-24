import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNumber,
  IsOptional,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ISSQN_TRIB_TYPE_SUPPORTED } from '../../../../domain/entities/fiscal-group.entity';

export class UpsertIssqnGroupHttpDto {
  @ApiProperty({ maxLength: 120 })
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    example: '17.02',
    description: 'Código municipal LC 116 (NN.NN).',
  })
  @Matches(/^\d{2}\.\d{2}$/, {
    message: 'O código municipal do serviço deve estar no formato NN.NN.',
  })
  issqnServiceCode!: string;

  @ApiProperty({ example: '170200', description: 'cTribNac (6 dígitos).' })
  @Matches(/^\d{6}$/, {
    message: 'O código de tributação nacional (cTribNac) deve ter 6 dígitos.',
  })
  issqnNationalCode!: string;

  @ApiProperty({
    nullable: true,
    description: 'Alíquota do ISS (%). Só transmitida com retenção.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  issqnRate?: number | null;

  @ApiProperty({
    enum: ISSQN_TRIB_TYPE_SUPPORTED,
    description:
      'Exigibilidade (tribISSQN): 1 tributável, 2 imunidade, 4 não incidência.',
  })
  @IsIn(ISSQN_TRIB_TYPE_SUPPORTED)
  issqnTribType!: string;
}

export function toIssqnGroupInput(dto: UpsertIssqnGroupHttpDto): {
  name: string;
  issqnServiceCode: string;
  issqnNationalCode: string;
  issqnRate: number | null;
  issqnTribType: string;
} {
  return {
    name: dto.name,
    issqnServiceCode: dto.issqnServiceCode,
    issqnNationalCode: dto.issqnNationalCode,
    issqnRate: dto.issqnRate ?? null,
    issqnTribType: dto.issqnTribType,
  };
}
