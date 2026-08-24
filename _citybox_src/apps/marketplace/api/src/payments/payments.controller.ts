import { Body, Controller, Headers, Param, Post } from '@nestjs/common';
import { InjectService } from '../common/inject.js';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiHeader, ApiTags } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service.js';
import { CreateCheckoutDto } from './dto/create-checkout.dto.js';

const checkoutRequestSchema = {
  type: 'object',
  required: ['customer', 'paymentMethods'],
  properties: {
    customer: {
      type: 'object',
      required: ['name', 'cpfCnpj'],
      properties: {
        name: { type: 'string', example: 'Maria Silva' },
        cpfCnpj: { type: 'string', example: '12345678901' },
        email: { type: 'string' },
        phone: { type: 'string' },
      },
    },
    paymentMethods: { type: 'array', items: { type: 'string' }, example: ['PIX'] },
    description: { type: 'string' },
    storeSharePercent: { type: 'number', example: 95 },
    provider: { type: 'string' },
    routingStrategy: { type: 'string' },
  },
} ;

const checkoutResponseSchema = {
  type: 'object',
  properties: {
    orderId: { type: 'string' },
    charges: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          subOrderId: { type: 'string' },
          storeId: { type: 'string' },
          externalReference: { type: 'string' },
          charge: { type: 'object', additionalProperties: true },
        },
      },
    },
  },
} ;

@ApiTags('orders')
@ApiBearerAuth()
@Controller('v1/orders')
export class PaymentsController {
  constructor(@InjectService(CheckoutService) private readonly checkout: CheckoutService) {}

  @Post(':orderId/checkout')
  @ApiHeader({ name: 'X-Correlation-Id', required: false })
  @ApiBody({ schema: checkoutRequestSchema })
  @ApiCreatedResponse({ schema: checkoutResponseSchema })
  checkoutOrder(
    @Param('orderId') orderId: string,
    @Body() dto: CreateCheckoutDto,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return this.checkout.createCheckout(orderId, dto, correlationId);
  }
}
