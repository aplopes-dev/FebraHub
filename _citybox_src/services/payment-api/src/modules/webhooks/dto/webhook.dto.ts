import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';
import { IsSafeWebhookUrl } from '../../../common/security/webhook-url.validator.js';

export class RegisterWebhookDto {
  @IsSafeWebhookUrl()
  url!: string;

  @IsString()
  @MinLength(32)
  secret!: string;

  @IsOptional()
  @IsString()
  sourceSystem?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  eventTypes?: string[];
}

export class UpdateWebhookDto {
  @IsOptional()
  @IsSafeWebhookUrl()
  url?: string;

  @IsOptional()
  @IsString()
  @MinLength(32)
  secret?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  eventTypes?: string[];

  @IsOptional()
  @IsString()
  status?: 'ACTIVE' | 'INACTIVE';
}
