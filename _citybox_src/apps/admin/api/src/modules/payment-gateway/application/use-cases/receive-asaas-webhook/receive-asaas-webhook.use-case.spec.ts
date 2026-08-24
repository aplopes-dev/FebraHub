import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReceiveAsaasWebhookUseCase } from './receive-asaas-webhook.use-case';
import { InMemoryPaymentGatewayWebhookEventRepository } from '../../../tests/in-memory-payment-gateway-webhook-event.repository';
import { PaymentGateway } from '../../../domain/providers/payment-gateway.interface';
import { InvalidWebhookSignatureError } from '../../../domain/errors/invalid-webhook-signature.error';

describe('ReceiveAsaasWebhookUseCase', () => {
  let useCase: ReceiveAsaasWebhookUseCase;
  let webhookEventRepository: InMemoryPaymentGatewayWebhookEventRepository;
  let paymentGateway: jest.Mocked<PaymentGateway>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    webhookEventRepository = new InMemoryPaymentGatewayWebhookEventRepository();
    paymentGateway = {
      receiveWebhook: jest.fn(),
    } as any;
    eventEmitter = {
      emit: jest.fn(),
    } as any;

    useCase = new ReceiveAsaasWebhookUseCase(
      paymentGateway,
      webhookEventRepository,
      eventEmitter,
    );
  });

  it('should successfully receive, register and emit webhook event', async () => {
    const body = {
      id: 'evt_123',
      event: 'PAYMENT_RECEIVED',
      payment: { id: 'pay_123' },
    };
    const signature = 'valid-token';

    paymentGateway.receiveWebhook.mockResolvedValue({} as any);

    const result = await useCase.execute({ body, signatureHeader: signature });

    expect(result).toEqual({ success: true, duplicate: false });
    expect(paymentGateway.receiveWebhook).toHaveBeenCalledWith(body, signature);

    const stored = await webhookEventRepository.findByGatewayEventId('evt_123');
    expect(stored).toBeDefined();
    expect(stored?.eventType).toBe('PAYMENT_RECEIVED');
    expect(stored?.status).toBe('PENDING');

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'payment-gateway.webhook.received',
      expect.objectContaining({ webhookEventId: stored?.id }),
    );
  });

  it('should return duplicate true and skip registering if event already exists', async () => {
    const body = { id: 'evt_123', event: 'PAYMENT_RECEIVED' };
    paymentGateway.receiveWebhook.mockResolvedValue({} as any);

    // Run first time to register
    await useCase.execute({ body, signatureHeader: 'valid' });

    // Reset mocks to inspect second run
    eventEmitter.emit.mockClear();

    const result = await useCase.execute({ body, signatureHeader: 'valid' });

    expect(result).toEqual({ success: true, duplicate: true });
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('should throw InvalidWebhookSignatureError if gateway token verification fails', async () => {
    const body = { id: 'evt_123', event: 'PAYMENT_RECEIVED' };
    paymentGateway.receiveWebhook.mockRejectedValue(
      new InvalidWebhookSignatureError('AsaasGateway'),
    );

    await expect(
      useCase.execute({ body, signatureHeader: 'invalid' }),
    ).rejects.toBeInstanceOf(InvalidWebhookSignatureError);

    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });
});
