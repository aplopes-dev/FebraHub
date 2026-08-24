import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListCustomersUseCase } from '../../../../application/use-cases/list-customers/list-customers.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { PrismaService } from '../../../../../../shared/infra/prisma/prisma.service';
import { ListCustomersQueryDto } from '../shared/customer.dto';
import { CustomerPresenter } from '../shared/customer.presenter';

@ApiTags('customers')
@Controller('v1/customers')
export class ListCustomersRoute {
  constructor(
    private readonly listCustomers: ListCustomersUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Listar clientes',
    description:
      '`tabCounts` conta o cadastro ativo (não excluído), ignorando a busca. `salesTotal` soma pedidos fechados.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: ListCustomersQueryDto,
  ) {
    const result = await this.listCustomers.execute({
      organizationId,
      search: query.search?.trim() || undefined,
      tab: query.tab,
      page: query.page,
      perPage: query.perPage,
    });

    const customerIds = result.items.map((customer) => customer.id);
    const totals =
      customerIds.length === 0
        ? []
        : await this.prisma.scoped.saleOrder.groupBy({
            by: ['customerId'],
            where: {
              organizationId,
              customerId: { in: customerIds },
              status: 'closed',
              deletedAt: null,
            },
            _sum: { totalCents: true },
          });

    const totalByCustomer = new Map(
      totals.map((row) => [
        row.customerId ?? '',
        (row._sum.totalCents ?? 0) / 100,
      ]),
    );

    const envelope = CustomerPresenter.toHttpList(result);
    return {
      ...envelope,
      data: envelope.data.map((item) => ({
        ...item,
        salesTotal: totalByCustomer.get(item.id) ?? 0,
      })),
    };
  }
}
