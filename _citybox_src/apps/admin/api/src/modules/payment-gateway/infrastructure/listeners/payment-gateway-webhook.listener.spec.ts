import { PaymentGatewayWebhookListener } from './payment-gateway-webhook.listener';
import { InMemoryPaymentGatewayWebhookEventRepository } from '../../tests/in-memory-payment-gateway-webhook-event.repository';
import { PaymentGatewayWebhookEvent } from '../../domain/entities/payment-gateway-webhook-event.entity';

describe('PaymentGatewayWebhookListener', () => {
  let listener: PaymentGatewayWebhookListener;
  let webhookEventRepository: InMemoryPaymentGatewayWebhookEventRepository;
  let processPaymentCreated: any;
  let processPaymentUpdated: any;
  let processPaymentPaid: any;
  let processPaymentOverdue: any;

  beforeEach(() => {
    webhookEventRepository = new InMemoryPaymentGatewayWebhookEventRepository();
    processPaymentCreated = { execute: jest.fn() };
    processPaymentUpdated = { execute: jest.fn() };
    processPaymentPaid = { execute: jest.fn() };
    processPaymentOverdue = { execute: jest.fn() };

    listener = new PaymentGatewayWebhookListener(
      webhookEventRepository,
      processPaymentCreated,
      processPaymentUpdated,
      processPaymentPaid,
      processPaymentOverdue,
    );
  });

  it('should process PAYMENT_CREATED webhook event and delegate to processPaymentCreated', async () => {
    const paymentPayload = { id: 'pay_123', value: 100 };
    const event = PaymentGatewayWebhookEvent.create({
      gatewayEventId: 'evt_123',
      provider: 'asaas',
      eventType: 'PAYMENT_CREATED',
      payload: { id: 'evt_123', payment: paymentPayload },
    });
    await webhookEventRepository.save(event);

    await listener.handleWebhookReceived({ webhookEventId: event.id });

    expect(processPaymentCreated.execute).toHaveBeenCalledWith({
      payment: paymentPayload,
    });
    const updated = await webhookEventRepository.findById(event.id);
    expect(updated?.status).toBe('PROCESSED');
  });

  it('should process PAYMENT_UPDATED webhook event and delegate to processPaymentUpdated', async () => {
    const paymentPayload = { id: 'pay_123', value: 120 };
    const event = PaymentGatewayWebhookEvent.create({
      gatewayEventId: 'evt_123',
      provider: 'asaas',
      eventType: 'PAYMENT_UPDATED',
      payload: { id: 'evt_123', payment: paymentPayload },
    });
    await webhookEventRepository.save(event);

    await listener.handleWebhookReceived({ webhookEventId: event.id });

    expect(processPaymentUpdated.execute).toHaveBeenCalledWith({
      payment: paymentPayload,
    });
    const updated = await webhookEventRepository.findById(event.id);
    expect(updated?.status).toBe('PROCESSED');
  });

  it('should process PAYMENT_RECEIVED webhook event and delegate to processPaymentPaid', async () => {
    const paymentPayload = { id: 'pay_123', billingType: 'PIX' };
    const event = PaymentGatewayWebhookEvent.create({
      gatewayEventId: 'evt_123',
      provider: 'asaas',
      eventType: 'PAYMENT_RECEIVED',
      payload: { id: 'evt_123', payment: paymentPayload },
    });
    await webhookEventRepository.save(event);

    await listener.handleWebhookReceived({ webhookEventId: event.id });

    expect(processPaymentPaid.execute).toHaveBeenCalledWith({
      payment: paymentPayload,
    });
    const updated = await webhookEventRepository.findById(event.id);
    expect(updated?.status).toBe('PROCESSED');
  });

  it('should process PAYMENT_OVERDUE webhook event and delegate to processPaymentOverdue', async () => {
    const paymentPayload = { id: 'pay_123' };
    const event = PaymentGatewayWebhookEvent.create({
      gatewayEventId: 'evt_123',
      provider: 'asaas',
      eventType: 'PAYMENT_OVERDUE',
      payload: { id: 'evt_123', payment: paymentPayload },
    });
    await webhookEventRepository.save(event);

    await listener.handleWebhookReceived({ webhookEventId: event.id });

    expect(processPaymentOverdue.execute).toHaveBeenCalledWith({
      payment: paymentPayload,
    });
    const updated = await webhookEventRepository.findById(event.id);
    expect(updated?.status).toBe('PROCESSED');
  });

  it('should mark event as FAILED if delegate use case execution throws an error', async () => {
    const paymentPayload = { id: 'pay_123' };
    const event = PaymentGatewayWebhookEvent.create({
      gatewayEventId: 'evt_123',
      provider: 'asaas',
      eventType: 'PAYMENT_OVERDUE',
      payload: { id: 'evt_123', payment: paymentPayload },
    });
    await webhookEventRepository.save(event);

    processPaymentOverdue.execute.mockRejectedValue(
      new Error('Delegate failed'),
    );

    await listener.handleWebhookReceived({ webhookEventId: event.id });

    const updated = await webhookEventRepository.findById(event.id);
    expect(updated?.status).toBe('FAILED');
    expect(updated?.errorMessage).toBe('Delegate failed');
  });
});
