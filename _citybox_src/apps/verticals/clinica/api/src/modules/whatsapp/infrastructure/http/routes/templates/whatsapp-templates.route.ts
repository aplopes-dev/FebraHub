import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListWhatsappTemplatesUseCase } from '../../../../application/use-cases/list-templates/list-whatsapp-templates.use-case';
import { UpdateWhatsappTemplatesUseCase } from '../../../../application/use-cases/update-templates/update-whatsapp-templates.use-case';
import {
  WHATSAPP_TEMPLATE_KEYS,
  type WhatsappTemplateKey,
} from '../../../../domain/whatsapp.types';

class WhatsappTemplateItemDto {
  @IsIn([...WHATSAPP_TEMPLATE_KEYS])
  key!: WhatsappTemplateKey;

  @IsString()
  @MinLength(1)
  body!: string;
}

class UpdateWhatsappTemplatesBodyDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WhatsappTemplateItemDto)
  items!: WhatsappTemplateItemDto[];
}

@ApiTags('whatsapp')
@Controller('v1/whatsapp/templates')
@RequirePermission('manage', 'Settings')
export class WhatsappTemplatesRoute {
  constructor(
    private readonly listTemplates: ListWhatsappTemplatesUseCase,
    private readonly updateTemplates: UpdateWhatsappTemplatesUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar templates WhatsApp (ensure defaults)' })
  async list(@StoreId() storeId: string) {
    const data = await this.listTemplates.execute({ storeId });
    return { data };
  }

  @Put()
  @ApiOperation({ summary: 'Atualizar bodies dos templates WhatsApp' })
  async update(
    @StoreId() storeId: string,
    @Body() body: UpdateWhatsappTemplatesBodyDto,
  ) {
    await this.updateTemplates.execute({ storeId, items: body.items });
    const data = await this.listTemplates.execute({ storeId });
    return { data };
  }
}
