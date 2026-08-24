import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { INTEGRATION_KEYS } from '../../../../domain/entities/store-settings.entity';
import { IsValidAccentColor } from '../shared/is-valid-accent-color.validator';

export class StoreSystemSettingsDto {
  @ApiProperty()
  @IsString()
  @MaxLength(180)
  companyName!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(64)
  timezone!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(8)
  currency!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(16)
  language!: string;

  @ApiProperty()
  @IsBoolean()
  autoAssignLeads!: boolean;

  @ApiProperty()
  @IsBoolean()
  requireTwoFactorForNewUsers!: boolean;

  @ApiProperty({
    description:
      'Exibe botão de WhatsApp na página pública do imóvel (detalhe do anúncio e link curto /p/:id; home e listagem do catálogo não usam este flag)',
  })
  @IsBoolean()
  whatsappCatalogEnabled!: boolean;

  @ApiProperty({
    description:
      'Exibe formulário de captação de leads na página pública do imóvel (detalhe do anúncio e link curto /p/:id)',
  })
  @IsBoolean()
  leadFormCatalogEnabled!: boolean;

  @ApiProperty({
    description: 'Preset (orange, blue, …) ou cor customizada em hex (#RRGGBB)',
    example: 'orange',
  })
  @IsString()
  @IsValidAccentColor()
  accentColorId!: string;
}

export class StoreNotificationSettingsDto {
  @ApiProperty()
  @IsBoolean()
  emailEnabled!: boolean;

  @ApiProperty()
  @IsBoolean()
  pushEnabled!: boolean;

  @ApiProperty()
  @IsBoolean()
  leadsAlerts!: boolean;

  @ApiProperty()
  @IsBoolean()
  calendarAlerts!: boolean;

  @ApiProperty()
  @IsBoolean()
  documentsAlerts!: boolean;
}

export class PutStoreSettingsDto {
  @ApiProperty({ type: StoreSystemSettingsDto })
  @ValidateNested()
  @Type(() => StoreSystemSettingsDto)
  system!: StoreSystemSettingsDto;

  @ApiProperty({ type: StoreNotificationSettingsDto })
  @ValidateNested()
  @Type(() => StoreNotificationSettingsDto)
  notifications!: StoreNotificationSettingsDto;

  /**
   * Mapa `IntegrationKey` → `{ enabled, connected, accountLabel? }`. Chave
   * desconhecida é descartada e chave ausente cai no padrão (use case).
   */
  @ApiPropertyOptional({
    description: `Chaves suportadas: ${INTEGRATION_KEYS.join(', ')}`,
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  integrations?: Record<string, unknown>;
}
