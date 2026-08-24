import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../shared/infra/http/decorators/tenant.decorators';
import type {
  AdditionalInfoTarget,
  FiscalDocumentType,
} from '../../../domain/entities/fiscal-additional-info.entity';
import { ListFiscalAdditionalInfosUseCase } from '../../../application/use-cases/list-fiscal-additional-infos/list-fiscal-additional-infos.use-case';
import { CountFiscalAdditionalInfosUseCase } from '../../../application/use-cases/count-fiscal-additional-infos/count-fiscal-additional-infos.use-case';
import { GetFiscalAdditionalInfoUseCase } from '../../../application/use-cases/get-fiscal-additional-info/get-fiscal-additional-info.use-case';
import { CreateFiscalAdditionalInfoUseCase } from '../../../application/use-cases/create-fiscal-additional-info/create-fiscal-additional-info.use-case';
import { UpdateFiscalAdditionalInfoUseCase } from '../../../application/use-cases/update-fiscal-additional-info/update-fiscal-additional-info.use-case';
import { DeleteFiscalAdditionalInfoUseCase } from '../../../application/use-cases/delete-fiscal-additional-info/delete-fiscal-additional-info.use-case';
import {
  CreateFiscalAdditionalInfoHttpDto,
  ListFiscalAdditionalInfosQueryDto,
  UpdateFiscalAdditionalInfoHttpDto,
} from './shared/fiscal-additional-info.dto';
import { FiscalAdditionalInfoPresenter } from './shared/fiscal-additional-info.presenter';

@ApiTags('fiscal-additional-infos')
@Controller('v1/fiscal-additional-infos')
export class FiscalAdditionalInfoRoute {
  constructor(
    private readonly listInfos: ListFiscalAdditionalInfosUseCase,
    private readonly countInfos: CountFiscalAdditionalInfosUseCase,
    private readonly getInfo: GetFiscalAdditionalInfoUseCase,
    private readonly createInfo: CreateFiscalAdditionalInfoUseCase,
    private readonly updateInfo: UpdateFiscalAdditionalInfoUseCase,
    private readonly deleteInfo: DeleteFiscalAdditionalInfoUseCase,
  ) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Listar informações adicionais da organização' })
  async list(
    @OrganizationId() organizationId: string,
    @Query() query: ListFiscalAdditionalInfosQueryDto,
  ) {
    const infos = await this.listInfos.execute({
      organizationId,
      // Estreitado por `@IsIn(FISCAL_DOCUMENT_TYPES)` no DTO + ValidationPipe.
      documentType: query.documentType as FiscalDocumentType | undefined,
    });
    return FiscalAdditionalInfoPresenter.toHttpList(infos);
  }

  // `count` precisa vir ANTES de `:id` — rota estática tem que ser
  // declarada antes da paramétrica, senão o Nest tenta casar "count" como
  // valor de `:id` (spec erp/023, N7).
  @Get('count')
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Contagem de informações adicionais por tipo de documento',
    description:
      'Usada pelo card "Informações adicionais" em Padrões fiscais — evita 3 chamadas (uma por tipo de documento) só para mostrar um número.',
  })
  async count(@OrganizationId() organizationId: string) {
    const counts = await this.countInfos.execute({ organizationId });
    return { data: counts };
  }

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Buscar informação adicional' })
  async get(@OrganizationId() organizationId: string, @Param('id') id: string) {
    const info = await this.getInfo.execute({ organizationId, id });
    return FiscalAdditionalInfoPresenter.toHttpSingle(info);
  }

  @Post()
  @RequirePermission('store.catalog.manage')
  @ApiOperation({ summary: 'Criar informação adicional' })
  async create(
    @OrganizationId() organizationId: string,
    @Body() dto: CreateFiscalAdditionalInfoHttpDto,
  ) {
    const info = await this.createInfo.execute({
      organizationId,
      name: dto.name,
      text: dto.text,
      documentType: dto.documentType as FiscalDocumentType,
      target: dto.target as AdditionalInfoTarget,
    });
    return FiscalAdditionalInfoPresenter.toHttpSingle(info);
  }

  @Put(':id')
  @RequirePermission('store.catalog.manage')
  @ApiOperation({ summary: 'Editar informação adicional' })
  async update(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
    @Body() dto: UpdateFiscalAdditionalInfoHttpDto,
  ) {
    const info = await this.updateInfo.execute({
      organizationId,
      id,
      name: dto.name,
      text: dto.text,
      target: dto.target as AdditionalInfoTarget,
    });
    return FiscalAdditionalInfoPresenter.toHttpSingle(info);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('store.catalog.manage')
  @ApiOperation({ summary: 'Excluir informação adicional' })
  async remove(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
  ) {
    await this.deleteInfo.execute({ organizationId, id });
  }
}
