import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateSupplierUseCase } from '../../../../application/use-cases/create-supplier/create-supplier.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import {
  CreateSupplierHttpDto,
  toSupplierWritableInput,
} from '../shared/supplier.dto';
import { SupplierPresenter } from '../shared/supplier.presenter';

@ApiTags('suppliers')
@Controller('v1/suppliers')
export class CreateSupplierRoute {
  constructor(private readonly createSupplier: CreateSupplierUseCase) {}

  @Post()
  @RequirePermission('org.suppliers.manage')
  @ApiOperation({
    summary: 'Cadastrar fornecedor',
    description:
      'Cria um fornecedor na organização ativa. O documento é único na organização e as unidades informadas precisam pertencer a ela.',
  })
  @ApiResponse({ status: 201, description: 'Fornecedor criado' })
  @ApiResponse({ status: 404, description: 'Unidade informada não existe' })
  @ApiResponse({ status: 409, description: 'Documento já cadastrado' })
  @ApiResponse({ status: 422, description: 'CNPJ/CPF inválido' })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: CreateSupplierHttpDto,
  ) {
    const supplier = await this.createSupplier.execute({
      organizationId,
      ...toSupplierWritableInput(dto),
    });

    return SupplierPresenter.toHttpSingle(supplier);
  }
}
