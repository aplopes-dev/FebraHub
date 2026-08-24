import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CompanyAddressDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  street!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  number!: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  complement?: string | null;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  district!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  city!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  zipCode!: string;
}
