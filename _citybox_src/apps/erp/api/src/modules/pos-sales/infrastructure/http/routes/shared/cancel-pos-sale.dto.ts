import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CancelPosSaleHttpDto {
  @ApiProperty({
    description: 'userId do operador (Membership) que cancela',
    example: '019a0000-0000-7000-8000-000000000001',
  })
  @IsUUID()
  operatorId!: string;

  @ApiPropertyOptional({
    description:
      'userId do supervisor quando a alçada exige autorização para cancelar',
  })
  @IsOptional()
  @IsUUID()
  authorizedByUserId?: string;

  @ApiPropertyOptional({ description: 'Motivo do cancelamento (opcional)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason?: string;
}
