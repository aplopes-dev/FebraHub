import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export class CreatePatientCategoryDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: '#3b82f6', description: 'Hex #rrggbb' })
  @IsString()
  @Matches(HEX_COLOR, { message: 'colorId deve ser hex #rrggbb' })
  colorId!: string;
}

export class UpdatePatientCategoryDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: '#3b82f6', description: 'Hex #rrggbb' })
  @IsString()
  @Matches(HEX_COLOR, { message: 'colorId deve ser hex #rrggbb' })
  colorId!: string;
}
