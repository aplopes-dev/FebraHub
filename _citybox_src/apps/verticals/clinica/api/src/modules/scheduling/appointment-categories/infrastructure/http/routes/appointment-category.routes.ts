import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListAppointmentCategoriesUseCase } from '../../../application/use-cases/list-appointment-categories/list-appointment-categories.use-case';
import { CreateAppointmentCategoryUseCase } from '../../../application/use-cases/create-appointment-category/create-appointment-category.use-case';
import { UpdateAppointmentCategoryUseCase } from '../../../application/use-cases/update-appointment-category/update-appointment-category.use-case';
import { DeleteAppointmentCategoryUseCase } from '../../../application/use-cases/delete-appointment-category/delete-appointment-category.use-case';
import {
  AppointmentCategoryBodyDto,
  ListAppointmentCategoriesQueryDto,
} from './shared/appointment-category.http-dto';
import { toAppointmentCategoryResponse } from './shared/appointment-category-response.mapper';

@ApiTags('appointment-categories')
@Controller('v1/appointment-categories')
@RequirePermission('read', 'Category')
export class ListAppointmentCategoriesRoute {
  constructor(
    private readonly listCategories: ListAppointmentCategoriesUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorias de agendamento' })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListAppointmentCategoriesQueryDto,
  ) {
    const result = await this.listCategories.execute({ storeId, ...query });
    return {
      data: result.items.map(toAppointmentCategoryResponse),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}

@ApiTags('appointment-categories')
@Controller('v1/appointment-categories')
@RequirePermission('create', 'Category')
export class CreateAppointmentCategoryRoute {
  constructor(
    private readonly createCategory: CreateAppointmentCategoryUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar categoria de agendamento' })
  async handle(
    @StoreId() storeId: string,
    @Body() dto: AppointmentCategoryBodyDto,
  ) {
    const created = await this.createCategory.execute({ storeId, ...dto });
    return { data: toAppointmentCategoryResponse(created) };
  }
}

@ApiTags('appointment-categories')
@Controller('v1/appointment-categories')
@RequirePermission('update', 'Category')
export class UpdateAppointmentCategoryRoute {
  constructor(
    private readonly updateCategory: UpdateAppointmentCategoryUseCase,
  ) {}

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar categoria de agendamento' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() dto: AppointmentCategoryBodyDto,
  ) {
    const updated = await this.updateCategory.execute({ storeId, id, ...dto });
    return { data: toAppointmentCategoryResponse(updated) };
  }
}

@ApiTags('appointment-categories')
@Controller('v1/appointment-categories')
@RequirePermission('update', 'Category')
export class DeleteAppointmentCategoryRoute {
  constructor(
    private readonly deleteCategory: DeleteAppointmentCategoryUseCase,
  ) {}

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir categoria de agendamento' })
  async handle(@StoreId() storeId: string, @Param('id') id: string) {
    await this.deleteCategory.execute({ storeId, id });
    return;
  }
}
