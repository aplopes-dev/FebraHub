import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentTerminal } from '../../../../shared/infra/http/decorators/current-terminal.decorator';
import { Public } from '../../../../shared/infra/http/decorators/public.decorator';
import { DeviceAuthGuard } from '../../../../shared/infra/http/guards/device-auth.guard';
import type { PosTerminal } from '../../../pos-terminals/domain/entities/pos-terminal.entity';
import {
  CreatePosDeliveryOrderUseCase,
  GetPosDeliveryOrderUseCase,
  ListPosCouriersUseCase,
  ListPosDeliveryOrdersUseCase,
  ReplacePosDeliveryOrderLinesUseCase,
  UpdatePosDeliveryOrderStatusUseCase,
  UpdatePosDeliveryOrderUseCase,
} from '../../application/use-cases/pos-delivery.use-cases';
import {
  CreatePosDeliveryOrderHttpDto,
  ListPosDeliveryOrdersQueryDto,
  ReplacePosDeliveryLinesHttpDto,
  UpdatePosDeliveryOrderHttpDto,
  UpdatePosDeliveryStatusHttpDto,
} from './pos-delivery.dto';
import { PosDeliveryPresenter } from './pos-delivery.presenter';

@ApiTags('pos-device')
@Public()
@UseGuards(DeviceAuthGuard)
@Controller('v1/pos')
export class PosDeliveryController {
  constructor(
    private readonly createOrder: CreatePosDeliveryOrderUseCase,
    private readonly listOrders: ListPosDeliveryOrdersUseCase,
    private readonly getOrder: GetPosDeliveryOrderUseCase,
    private readonly updateOrder: UpdatePosDeliveryOrderUseCase,
    private readonly replaceLines: ReplacePosDeliveryOrderLinesUseCase,
    private readonly updateStatus: UpdatePosDeliveryOrderStatusUseCase,
    private readonly listCouriers: ListPosCouriersUseCase,
  ) {}

  @Post('delivery-orders')
  async create(
    @CurrentTerminal() terminal: PosTerminal,
    @Body() dto: CreatePosDeliveryOrderHttpDto,
  ) {
    const order = await this.createOrder.execute({
      ...dto,
      organizationId: terminal.organizationId,
      branchId: terminal.branchId,
      posTerminalId: terminal.id,
    });
    return PosDeliveryPresenter.single(order);
  }

  @Get('delivery-orders')
  async list(
    @CurrentTerminal() terminal: PosTerminal,
    @Query() query: ListPosDeliveryOrdersQueryDto,
  ) {
    const result = await this.listOrders.execute({
      organizationId: terminal.organizationId,
      branchId: terminal.branchId,
      status: query.status,
      fulfillment: query.fulfillment,
      search: query.search?.trim() || undefined,
      page: query.page,
      perPage: query.perPage,
    });
    return PosDeliveryPresenter.list(result, query.page, query.perPage);
  }

  @Get('couriers')
  async couriers(@CurrentTerminal() terminal: PosTerminal) {
    return {
      data: await this.listCouriers.execute({
        organizationId: terminal.organizationId,
        branchId: terminal.branchId,
      }),
    };
  }

  @Get('delivery-orders/:id')
  async get(@CurrentTerminal() terminal: PosTerminal, @Param('id') id: string) {
    const order = await this.getOrder.execute({
      organizationId: terminal.organizationId,
      branchId: terminal.branchId,
      id,
    });
    return PosDeliveryPresenter.single(order);
  }

  @Patch('delivery-orders/:id')
  async update(
    @CurrentTerminal() terminal: PosTerminal,
    @Param('id') id: string,
    @Body() dto: UpdatePosDeliveryOrderHttpDto,
  ) {
    const order = await this.updateOrder.execute({
      ...dto,
      organizationId: terminal.organizationId,
      branchId: terminal.branchId,
      id,
    });
    return PosDeliveryPresenter.single(order);
  }

  @Put('delivery-orders/:id/lines')
  async lines(
    @CurrentTerminal() terminal: PosTerminal,
    @Param('id') id: string,
    @Body() dto: ReplacePosDeliveryLinesHttpDto,
  ) {
    const order = await this.replaceLines.execute({
      organizationId: terminal.organizationId,
      branchId: terminal.branchId,
      id,
      lines: dto.lines.map((line) => ({ ...line, notes: line.notes ?? '' })),
    });
    return PosDeliveryPresenter.single(order);
  }

  @Patch('delivery-orders/:id/status')
  async status(
    @CurrentTerminal() terminal: PosTerminal,
    @Param('id') id: string,
    @Body() dto: UpdatePosDeliveryStatusHttpDto,
  ) {
    const order = await this.updateStatus.execute({
      organizationId: terminal.organizationId,
      branchId: terminal.branchId,
      id,
      status: dto.status,
    });
    return PosDeliveryPresenter.single(order);
  }
}
