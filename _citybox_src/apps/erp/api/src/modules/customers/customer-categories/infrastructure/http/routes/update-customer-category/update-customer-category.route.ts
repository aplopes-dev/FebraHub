import { Body, Controller, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateCustomerCategoryUseCase } from '../../../../application/use-cases/update-customer-category/update-customer-category.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { UpdateCustomerCategoryHttpDto } from '../shared/customer-category.dto';
import { CustomerCategoryPresenter } from '../shared/customer-category.presenter';

@ApiTags('customer-categories')
@Controller('v1/customer-categories')
export class UpdateCustomerCategoryRoute {
  constructor(private readonly updateCategory: UpdateCustomerCategoryUseCase) {}

  @Put(':id')
  @RequirePermission('org.customers.manage')
  @ApiOperation({ summary: 'Atualizar categoria de cliente' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerCategoryHttpDto,
  ) {
    const category = await this.updateCategory.execute({
      organizationId,
      id,
      name: dto.name,
      discountPercentage: dto.discountPercentage,
    });
    return {
      data: CustomerCategoryPresenter.toHttpFromCategory(category),
    };
  }
}
