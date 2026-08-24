import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateClinicBodyDto {
  @ApiProperty({ example: 'Unidade Centro' })
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiPropertyOptional({ description: 'Derivado do nome quando ausente' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug aceita apenas minúsculas, números e hífen',
  })
  @MaxLength(120)
  slug?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() legalName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() document?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() stateRegistration?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() zipCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() street?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() number?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() complement?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() neighborhood?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(2, 2) state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string;
}
