import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../shared/infra/http/decorators/store-id.decorator';
import { CreateClinicUseCase } from '../../../application/use-cases/create-clinic.use-case';
import { ListClinicsUseCase } from '../../../application/use-cases/list-clinics.use-case';
import { CreateClinicBodyDto } from './clinics.dto';
import { ClinicsPresenter } from './clinics.presenter';

/**
 * Multi-clínica dentro da organização.
 *
 * O header `X-Store-Id` continua sendo o identificador de entrada (compatibilidade com
 * o proxy do ERP/web); ele resolve a `Organization` pelo `storeId`. A partir da Fase 6
 * o guard passa a validar que o usuário é membro dessa organização.
 */
@ApiTags('clinics')
@Controller('v1/clinics')
export class ClinicsRoute {
  constructor(
    private readonly listClinics: ListClinicsUseCase,
    private readonly createClinic: CreateClinicUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista as clínicas da organização com a quota do plano' })
  async list(@StoreId() storeId: string) {
    return ClinicsPresenter.list(await this.listClinics.execute(storeId));
  }

  @Post()
  @RequirePermission('manage', 'Settings')
  @ApiOperation({ summary: 'Cria uma clínica (valida quota do plano localmente)' })
  async create(@StoreId() storeId: string, @Body() body: CreateClinicBodyDto) {
    const clinic = await this.createClinic.execute({ storeId, ...body });
    return ClinicsPresenter.one(clinic);
  }
}
