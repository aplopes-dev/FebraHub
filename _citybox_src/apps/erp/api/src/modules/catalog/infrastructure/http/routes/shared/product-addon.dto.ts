import { IsInt, IsString, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveProductAddonDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ description: 'Preço padrão em centavos' })
  @IsInt()
  @Min(0)
  defaultPriceCents!: number;
}
