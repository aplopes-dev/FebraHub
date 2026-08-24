import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SyncAgentCatalogLeadsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  leadIds!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  fallbackAgentId?: string;
}
