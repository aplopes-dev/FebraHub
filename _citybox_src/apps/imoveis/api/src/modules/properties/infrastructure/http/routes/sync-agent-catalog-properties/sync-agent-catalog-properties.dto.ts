import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SyncAgentCatalogPropertiesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  propertyIds!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fallbackAgentId?: string;
}
