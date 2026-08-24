import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { CATEGORY_HEX_REGEX } from '../../../../../../shared/core/utils/category-hex';

export class UpdateAppointmentCategoryHTTPDTO {
  @ApiPropertyOptional({ example: 'Coloração' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: '#3b82f6', description: 'Hex #rrggbb' })
  @IsOptional()
  @IsString()
  @Matches(CATEGORY_HEX_REGEX, { message: 'color deve ser hex #rrggbb' })
  color?: string;
}
