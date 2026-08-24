import { IssueNfeUseCase } from './issue-nfe.use-case';
import { ResolveSaleOrderItemsService } from '../../services/resolve-sale-order-items';
import { ResolveItemIcmsUseCase } from '../../../../fiscal-defaults/application/use-cases/resolve-item-icms/resolve-item-icms.use-case';
import { ResolveItemPisCofinsUseCase } from '../../../../fiscal-defaults/application/use-cases/resolve-item-pis-cofins/resolve-item-pis-cofins.use-case';
import { ResolveItemIpiUseCase } from '../../../../fiscal-defaults/application/use-cases/resolve-item-ipi/resolve-item-ipi.use-case';
import { InMemoryFiscalGroupRepository } from '../../../../fiscal-defaults/tests/in-memory-fiscal-group.repository';
import { InMemoryFiscalDefaultTaxesRepository } from '../../../../fiscal-defaults/tests/in-memory-fiscal-default-taxes.repository';
import { FiscalGroup } from '../../../../fiscal-defaults/domain/entities/fiscal-group.entity';
import { InMemoryProductFiscalRepository } from '../../../../catalog/tests/in-memory-product-fiscal.repository';
import { ProductFiscal } from '../../../../catalog/domain/entities/product-fiscal.entity';
import { InMemorySaleOrderRepository } from '../../../../sales/tests/in-memory-sale-order.repository';
import { SaleOrder } from '../../../../sales/domain/entities/sale-order.entity';
import { OrganizationRepository } from '../../../../tenancy/domain/repositories/organization.repository.interface';
import type { Organization } from '../../../../tenancy/domain/entities/organization.entity';
import {
  makeOrganization,
  ORGANIZATION_DOCUMENT,
  ORGANIZATION_ID,
} from '../../../../tenancy/tests/tenancy-test-factory';
import { InMemoryNfeIssuanceRepository } from '../../../tests/in-memory-nfe-issuance.repository';
import { FakeFiscalApiClient } from '../../../tests/fake-fiscal-api-client';
import { FiscalApiEmissionError } from '../../../domain/errors/fiscal-api-emission.error';
import type { IssueNfeInput } from '../../dtos/issue-nfe.dto';
import { InMemoryPaymentMethodRepository } from '../../../../finance/payment-methods/tests/in-memory-payment-method.repository';
import { PaymentMethod } from '../../../../finance/payment-methods/domain/entities/payment-method.entity';

const ORG = ORGANIZATION_ID;
const COMPANY_ID = 'company-1';
const SALE_ORDER_ID = 'sale-order-1';
const PRODUCT_ID = 'product-1';
const PAYMENT_METHOD_DINHEIRO = 'payment-method-dinheiro';
const PAYMENT_METHOD_CARTAO = 'payment-method-cartao';
const PAYMENT_METHOD_SEM_CODIGO = 'payment-method-sem-codigo';

/** Stub mínimo: só `findById` importa para o caso de uso (molde `nfse-issuance`). */
class StubOrganizationRepository extends OrganizationRepository {
  constructor(private readonly org: Organization | null) {
    super();
  }
  findById(): Promise<Organization | null> {
    return Promise.resolve(this.org);
  }
  findByDocument(): Promise<Organization | null> {
    return Promise.resolve(this.org);
  }
  findByPlatformStoreId(): Promise<Organization | null> {
    throw new Error('not used');
  }
  createWithOwner(): Promise<never> {
    throw new Error('not used');
  }
  save(): Promise<Organization> {
    throw new Error('not used');
  }
  findAllByUser(): Promise<never> {
    throw new Error('not used');
  }
}

function baseInput(overrides: Partial<IssueNfeInput> = {}): IssueNfeInput {
  return {
    organizationId: ORG,
    saleOrderId: SALE_ORDER_ID,
    customer: {
      documentType: 'CPF',
      document: '12345678900',
      name: 'Cliente Teste',
      address: {
        street: 'Rua A',
        number: '1',
        district: 'Centro',
        city: 'Ilhéus',
        uf: 'BA',
      },
    },
    ...overrides,
  };
}

describe('IssueNfeUseCase (spec erp/026)', () => {
  let groupRepo: InMemoryFiscalGroupRepository;
  let defaultsRepo: InMemoryFiscalDefaultTaxesRepository;
  let productFiscalRepo: InMemoryProductFiscalRepository;
  let saleOrderRepo: InMemorySaleOrderRepository;
  let issuanceRepo: InMemoryNfeIssuanceRepository;
  let paymentMethodRepo: InMemoryPaymentMethodRepository;
  let client: FakeFiscalApiClient;
  let useCase: IssueNfeUseCase;

  beforeEach(async () => {
    groupRepo = new InMemoryFiscalGroupRepository();
    defaultsRepo = new InMemoryFiscalDefaultTaxesRepository();
    productFiscalRepo = new InMemoryProductFiscalRepository();
    saleOrderRepo = new InMemorySaleOrderRepository();
    issuanceRepo = new InMemoryNfeIssuanceRepository();
    paymentMethodRepo = new InMemoryPaymentMethodRepository();
    await paymentMethodRepo.save(
      PaymentMethod.create(
        { organizationId: ORG, name: 'Dinheiro', fiscalCode: '01' },
        PAYMENT_METHOD_DINHEIRO,
      ),
    );
    await paymentMethodRepo.save(
      PaymentMethod.create(
        { organizationId: ORG, name: 'Cartão de crédito', fiscalCode: '03' },
        PAYMENT_METHOD_CARTAO,
      ),
    );
    await paymentMethodRepo.save(
      PaymentMethod.create(
        { organizationId: ORG, name: 'Vale-compra', fiscalCode: null },
        PAYMENT_METHOD_SEM_CODIGO,
      ),
    );
    client = new FakeFiscalApiClient();
    client.companyIdByCnpj.set(
      ORGANIZATION_DOCUMENT.replace(/\D/g, ''),
      COMPANY_ID,
    );
    const orgRepo = new StubOrganizationRepository(
      makeOrganization({ id: ORG }),
    );

    const resolveItems = new ResolveSaleOrderItemsService(
      saleOrderRepo,
      productFiscalRepo,
      new ResolveItemIcmsUseCase(groupRepo, defaultsRepo),
      new ResolveItemPisCofinsUseCase(groupRepo, defaultsRepo),
      new ResolveItemIpiUseCase(groupRepo),
    );

    useCase = new IssueNfeUseCase(
      issuanceRepo,
      orgRepo,
      client,
      resolveItems,
      paymentMethodRepo,
    );

    // Pedido de venda com 1 linha do PRODUCT_ID e 1 pagamento em Dinheiro.
    const saleOrder = SaleOrder.create(
      {
        organizationId: ORG,
        number: 1,
        customerName: 'Cliente Teste',
        createdByName: 'Operador',
        lines: [{ productId: PRODUCT_ID, quantity: '2', unitPriceCents: 5000 }],
        payments: [
          {
            methodId: PAYMENT_METHOD_DINHEIRO,
            amountCents: 10000,
            bankAccountId: null,
          },
        ],
      },
      SALE_ORDER_ID,
    );
    await saleOrderRepo.saveWithOptionalMovement(saleOrder, null);
    saleOrderRepo.setProductMeta(PRODUCT_ID, {
      name: 'Produto Teste',
      sku: 'SKU-1',
    });
  });

  function seedFullyConfiguredProduct() {
    const icmsGroup = FiscalGroup.createIcms(
      ORG,
      {
        name: 'ICMS Padrão',
        icmsCst: '00',
        icmsCsosn: null,
        ufRates: [{ uf: 'BA', rateType: 'INTERNA', aliquota: 18 }],
      },
      'icms-group-1',
    );
    const pisCofinsGroup = FiscalGroup.create(
      {
        organizationId: ORG,
        taxType: 'PIS_COFINS',
        name: 'PIS/COFINS Padrão',
        pisCst: '01',
        pisAliquota: 1.65,
        cofinsCst: '01',
        cofinsAliquota: 7.6,
      },
      'pis-cofins-group-1',
    );
    const ipiGroup = FiscalGroup.createIpi(
      ORG,
      {
        name: 'IPI Padrão',
        ipiCst: '50',
        ipiEnquadramento: '999',
        ipiRate: 10,
      },
      'ipi-group-1',
    );
    groupRepo.seed(icmsGroup);
    groupRepo.seed(pisCofinsGroup);
    groupRepo.seed(ipiGroup);

    // `upsert` grava síncrono no Map antes de devolver a Promise (fake em
    // memória) — `void` porque este helper não é async (chamado sem await
    // pelos testes), e o `Promise` resolvido não carrega efeito pendente real.
    void productFiscalRepo.upsert(
      ProductFiscal.create({
        organizationId: ORG,
        productId: PRODUCT_ID,
        ncm: '61091000',
        origin: '0',
        netWeightKg: 0,
        grossWeightKg: 0,
        cest: '',
        fcpPercent: 0,
        fcpStPercent: 0,
        fcpStRetainedPercent: 0,
        cstIbsCbs: '',
        taxClassification: '',
        cfop: { value: '5102', applyToAll: true },
        icms: { value: '', applyToAll: true },
        pisCofins: { value: '', applyToAll: true },
        ipi: { value: '', applyToAll: true },
        icmsGroupId: 'icms-group-1',
        pisCofinsGroupId: 'pis-cofins-group-1',
        ipiGroupId: 'ipi-group-1',
      }),
    );
  }

  it('emite a NF-e com ICMS/PIS-COFINS/IPI resolvidos do cadastro real do produto (Acceptance Scenario 1, SC-001)', async () => {
    seedFullyConfiguredProduct();

    const issuance = await useCase.execute(baseInput());

    expect(issuance.status).toBe('AUTHORIZED');
    expect(issuance.companyId).toBe(COMPANY_ID);
    expect(issuance.fiscalDocumentId).toBe('fiscal-document-1');
    expect(client.requests).toHaveLength(1);
    const [item] = client.requests[0].items;
    expect(item.cst).toBe('00');
    expect(item.pis).toEqual({ cst: '01', aliquota: 1.65 });
    expect(item.cofins).toEqual({ cst: '01', aliquota: 7.6 });
    expect(item.ipi).toEqual({ cst: '50', cEnq: '999', aliquota: 10 });
  });

  it('resolve o tPag real do pagamento do pedido, não mais um 99 fixo (B1/FR-001, spec erp/029)', async () => {
    seedFullyConfiguredProduct();

    await useCase.execute(baseInput());

    expect(client.requests[0].payments).toEqual([
      { method: '01', amount: 100, description: undefined },
    ]);
    expect(client.requests[0].paymentMethodCode).toBe('01');
  });

  it('envia um detPag por pagamento quando o pedido tem mais de um (FR-002, spec erp/029)', async () => {
    seedFullyConfiguredProduct();
    const saleOrder = SaleOrder.create(
      {
        organizationId: ORG,
        number: 2,
        customerName: 'Cliente Teste',
        createdByName: 'Operador',
        lines: [{ productId: PRODUCT_ID, quantity: '2', unitPriceCents: 5000 }],
        payments: [
          {
            methodId: PAYMENT_METHOD_DINHEIRO,
            amountCents: 6000,
            bankAccountId: null,
          },
          {
            methodId: PAYMENT_METHOD_CARTAO,
            amountCents: 4000,
            bankAccountId: null,
          },
        ],
      },
      'sale-order-2',
    );
    await saleOrderRepo.saveWithOptionalMovement(saleOrder, null);

    await useCase.execute(baseInput({ saleOrderId: 'sale-order-2' }));

    expect(client.requests[0].payments).toEqual([
      { method: '01', amount: 60, description: undefined },
      { method: '03', amount: 40, description: undefined },
    ]);
  });

  it('bloqueia a emissão (antes de chamar a fiscal-api) quando a forma usada não tem fiscalCode configurado (FR-003, spec erp/029)', async () => {
    seedFullyConfiguredProduct();
    const saleOrder = SaleOrder.create(
      {
        organizationId: ORG,
        number: 3,
        customerName: 'Cliente Teste',
        createdByName: 'Operador',
        lines: [{ productId: PRODUCT_ID, quantity: '2', unitPriceCents: 5000 }],
        payments: [
          {
            methodId: PAYMENT_METHOD_SEM_CODIGO,
            amountCents: 10000,
            bankAccountId: null,
          },
        ],
      },
      'sale-order-3',
    );
    await saleOrderRepo.saveWithOptionalMovement(saleOrder, null);

    await expect(
      useCase.execute(baseInput({ saleOrderId: 'sale-order-3' })),
    ).rejects.toThrow(/Vale-compra.*código fiscal/i);
    expect(client.requests).toHaveLength(0);
  });

  it('bloqueia com mensagem distinta quando o methodId é órfão — forma não cadastrada, não "sem código fiscal" (FR-009, spec erp/030)', async () => {
    seedFullyConfiguredProduct();
    const saleOrder = SaleOrder.create(
      {
        organizationId: ORG,
        number: 35,
        customerName: 'Cliente Teste',
        createdByName: 'Operador',
        lines: [{ productId: PRODUCT_ID, quantity: '2', unitPriceCents: 5000 }],
        payments: [
          {
            methodId: 'pm-transferencia',
            amountCents: 10000,
            bankAccountId: null,
          },
        ],
      },
      'sale-order-3b',
    );
    await saleOrderRepo.saveWithOptionalMovement(saleOrder, null);

    await expect(
      useCase.execute(baseInput({ saleOrderId: 'sale-order-3b' })),
    ).rejects.toThrow(/não está mais cadastrada.*edite o pedido/i);
    expect(client.requests).toHaveLength(0);
  });

  it('preenche xPag com o nome da forma quando o código resolvido é 99 (Outros configurado de propósito, spec erp/029)', async () => {
    seedFullyConfiguredProduct();
    await paymentMethodRepo.save(
      PaymentMethod.create(
        { organizationId: ORG, name: 'Vale-presente', fiscalCode: '99' },
        'payment-method-outros',
      ),
    );
    const saleOrder = SaleOrder.create(
      {
        organizationId: ORG,
        number: 4,
        customerName: 'Cliente Teste',
        createdByName: 'Operador',
        lines: [{ productId: PRODUCT_ID, quantity: '2', unitPriceCents: 5000 }],
        payments: [
          {
            methodId: 'payment-method-outros',
            amountCents: 10000,
            bankAccountId: null,
          },
        ],
      },
      'sale-order-4',
    );
    await saleOrderRepo.saveWithOptionalMovement(saleOrder, null);

    await useCase.execute(baseInput({ saleOrderId: 'sale-order-4' }));

    expect(client.requests[0].payments).toEqual([
      { method: '99', amount: 100, description: 'Vale-presente' },
    ]);
  });

  it('propaga errorCode/errorMessage do órgão até a entidade salva quando REJECTED (spec erp/028)', async () => {
    seedFullyConfiguredProduct();
    client.result = {
      status: 'REJECTED',
      accessKey: null,
      protocol: null,
      errorCode: '719',
      errorMessage: 'Rejeicao: NF-e sem a identificacao do destinatario.',
      documentId: 'fiscal-document-1',
    };

    const issuance = await useCase.execute(baseInput());

    expect(issuance.status).toBe('REJECTED');
    expect(issuance.errorCode).toBe('719');
    expect(issuance.errorMessage).toBe(
      'Rejeicao: NF-e sem a identificacao do destinatario.',
    );
  });

  it('recusa reemissão para um pedido que já tem NF-e emitida (FR-006/SC-004)', async () => {
    seedFullyConfiguredProduct();

    const first = await useCase.execute(baseInput());
    const second = await useCase.execute(baseInput());

    expect(second.id).toBe(first.id);
    expect(client.requests).toHaveLength(1);
  });

  it('emite com fallback quando o produto não tem grupo fiscal configurado, sem bloquear (FR-005, Acceptance Scenario 4)', async () => {
    // Produto sem nenhum grupo fiscal cadastrado — nenhum seed além do pedido.
    const issuance = await useCase.execute(baseInput());

    expect(issuance.status).toBe('AUTHORIZED');
    const [item] = client.requests[0].items;
    expect(item.cst).toBeNull();
    expect(item.csosn).toBeNull();
    expect(item.pis).toBeNull();
    expect(item.cofins).toBeNull();
    expect(item.ipi).toBeNull();
  });

  it('recusa emitir quando o Emitente está em PRODUCTION — plataforma só sustenta homologação hoje', async () => {
    client.defaultEnvironmentByCnpj.set(
      ORGANIZATION_DOCUMENT.replace(/\D/g, ''),
      'PRODUCTION',
    );

    await expect(useCase.execute(baseInput())).rejects.toThrow(
      /produção|homologação/i,
    );
  });

  it('a recusa por PRODUCTION acontece ANTES de resolver itens, chamar a fiscal-api ou gravar NfeIssuance', async () => {
    client.defaultEnvironmentByCnpj.set(
      ORGANIZATION_DOCUMENT.replace(/\D/g, ''),
      'PRODUCTION',
    );

    await expect(useCase.execute(baseInput())).rejects.toThrow();

    expect(client.requests).toHaveLength(0);
    expect(await issuanceRepo.listByOrganization(ORG)).toHaveLength(0);
  });

  it('recusa quando não há Emitente para o CNPJ da organização', async () => {
    client.companyIdByCnpj.clear();
    await expect(useCase.execute(baseInput())).rejects.toBeInstanceOf(
      FiscalApiEmissionError,
    );
    expect(client.requests).toHaveLength(0);
  });

  it('recusa quando o pedido de venda não existe', async () => {
    await expect(
      useCase.execute(baseInput({ saleOrderId: 'inexistente' })),
    ).rejects.toBeInstanceOf(FiscalApiEmissionError);
    expect(client.requests).toHaveLength(0);
  });
});
