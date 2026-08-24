import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePatientReferralOriginBodyDto {
  @ApiProperty({ example: 'Outdoor na orla' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}
