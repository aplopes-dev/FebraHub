import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSignaturePackageRequestDto {
  @ApiProperty({ example: 'pkg-250' })
  @IsString()
  @MinLength(1)
  packageId!: string;
}
