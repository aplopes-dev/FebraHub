import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderPropertyPhotosDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  photoIds!: string[];
}
