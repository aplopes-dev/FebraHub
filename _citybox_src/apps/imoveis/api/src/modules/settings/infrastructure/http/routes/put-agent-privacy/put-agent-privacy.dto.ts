import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PutAgentPrivacyDto {
  @ApiProperty()
  @IsBoolean()
  twoFactorEnabled!: boolean;
}
