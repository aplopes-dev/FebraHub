import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateCustomerCategoryUseCase } from '../../../../application/use-cases/create-customer-category/create-customer-category.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { CreateCustomerCategoryHttpDto } from '../shared/customer-category.dto';
import { CustomerCategoryPresenter } from '../shared/customer-category.presenter';

@ApiTags('customer-categories')
@Controller('v1/customer-categories')
export class CreateCustomerCategoryRoute {
  constructor(private readonly createCategory: CreateCustomerCategoryUseCase) {}

  @Post()
  @RequirePermission('org.customers.manage')
  @ApiOperation({ summary: 'Criar categoria de cliente' })
  @ApiResponse({ status: 201, description: 'Categoria criada' })
  @ApiResponse({ status: 409, description: 'Nome já cadastrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: CreateCustomerCategoryHttpDto,
  ) {
    const category = await this.createCategory.execute({
      organizationId,
      name: dto.name,
      discountPercentage: dto.discountPercentage,
    });
    return {
      data: CustomerCategoryPresenter.toHttpFromCategory(category, 0),
    };
  }
}
