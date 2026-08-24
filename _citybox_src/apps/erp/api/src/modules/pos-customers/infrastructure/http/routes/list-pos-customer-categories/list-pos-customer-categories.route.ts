import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ListCustomerCategoriesUseCase } from '../../../../../customers/customer-categories/application/use-cases/list-customer-categories/list-customer-categories.use-case';
import { CustomerCategoryPresenter } from '../../../../../customers/customer-categories/infrastructure/http/routes/shared/customer-category.presenter';
import { MAX_PER_PAGE } from '../../../../../tenancy/application/pagination';
import { CurrentTerminal } from '../../../../../../shared/infra/http/decorators/current-terminal.decorator';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { DeviceAuthGuard } from '../../../../../../shared/infra/http/guards/device-auth.guard';
import type { PosTerminal } from '../../../../../pos-terminals/domain/entities/pos-terminal.entity';

class ListPosCustomerCategoriesQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PER_PAGE)
  perPage?: number;
}

@ApiTags('pos-device')
@Controller('v1/pos')
export class ListPosCustomerCategoriesRoute {
  constructor(private readonly listCategories: ListCustomerCategoriesUseCase) {}

  @Get('customer-categories')
  @Public()
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({
    summary: 'Categorias de cliente deste terminal',
    description: 'Para o dropdown do cadastro rápido no PDV.',
  })
  async handle(
    @CurrentTerminal() terminal: PosTerminal,
    @Query() query: ListPosCustomerCategoriesQueryDto,
  ) {
    const result = await this.listCategories.execute({
      organizationId: terminal.organizationId,
      search: query.search?.trim() || undefined,
      page: query.page ?? 1,
      perPage: query.perPage ?? 100,
    });
    return CustomerCategoryPresenter.toHttpList(result);
  }
}
