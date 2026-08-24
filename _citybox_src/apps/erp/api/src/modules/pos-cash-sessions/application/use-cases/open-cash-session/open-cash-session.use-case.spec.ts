import { PinHasher } from '../../../../../shared/infra/crypto/pin-hasher';
import { PDV_CAIXA_WITHDRAWAL_PERMISSION } from '../../../../../shared/infra/http/permissions/permission-catalog';
import { GetPosPolicyUseCase } from '../../../../pos-policies/application/use-cases/get-pos-policy/get-pos-policy.use-case';
import { InMemoryPosPolicyRepository } from '../../../../pos-policies/tests/in-memory-pos-policy.repository';
import {
  BRANCH_ID,
  ORGANIZATION_ID,
  MEMBERSHIP_ID,
  USER_ID,
  makeMembership,
  makeRepositories as makeTenancyRepositories,
  makeUser,
} from '../../../../tenancy/tests/tenancy-test-factory';
import { PosCashSession } from '../../../domain/entities/pos-cash-session.entity';
import { PosCashSessionOpenTakenError } from '../../../domain/errors/pos-cash-session-open-taken.error';
import { PosCashSessionNotOpenError } from '../../../domain/errors/pos-cash-session-not-open.error';
import { PosCashSupervisorRequiredError } from '../../../domain/errors/pos-cash-supervisor-required.error';
import { PosCashWithdrawalForbiddenError } from '../../../domain/errors/pos-cash-withdrawal-forbidden.error';
import { InMemoryPosCashSessionRepository } from '../../../tests/in-memory-pos-cash-session.repository';
import { OpenCashSessionUseCase } from '../open-cash-session/open-cash-session.use-case';
import { AddCashMovementUseCase } from '../add-cash-movement/add-cash-movement.use-case';
import { CloseCashSessionUseCase } from '../close-cash-session/close-cash-session.use-case';
import { ListCashSessionsUseCase } from '../list-cash-sessions/list-cash-sessions.use-case';

const TERMINAL_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SESSION_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const CAIXA_PROFILE = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const GERENTE_PROFILE = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const GERENTE_USER = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const GERENTE_MEMBERSHIP = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

describe('PosCashSessions use cases', () => {
  async function setup(options?: { withdrawalOnCaixa?: boolean }) {
    const cashSessions = new InMemoryPosCashSessionRepository();
    cashSessions.registerTerminal({ id: TERMINAL_ID, name: 'PDV 1' });
    const policies = new InMemoryPosPolicyRepository();
    const tenancy = makeTenancyRepositories();
    await tenancy.seedOwner();

    const caixaPerms = [
      'pdv.operacao.venda.create',
      'pdv.operacao.caixa.open',
      'pdv.operacao.caixa.close',
      'pdv.operacao.caixa.reinforcement',
      ...(options?.withdrawalOnCaixa ? [PDV_CAIXA_WITHDRAWAL_PERMISSION] : []),
    ];
    tenancy.membershipRepository.registerPermissionProfile({
      id: CAIXA_PROFILE,
      name: 'Caixa',
      systemKey: 'caixa',
      permissionIds: caixaPerms,
    });
    tenancy.membershipRepository.registerPermissionProfile({
      id: GERENTE_PROFILE,
      name: 'Gerente',
      systemKey: 'gerente',
      permissionIds: [
        'pdv.operacao.venda.create',
        PDV_CAIXA_WITHDRAWAL_PERMISSION,
      ],
    });

    await tenancy.userRepository.save(
      makeUser({ id: USER_ID, name: 'Maria Caixa' }),
    );
    await tenancy.membershipRepository.save(
      makeMembership({
        id: MEMBERSHIP_ID,
        userId: USER_ID,
        permissionProfileId: CAIXA_PROFILE,
        pdvCode: '01',
        pdvPinHash: await PinHasher.hash('1234'),
      }),
    );
    await tenancy.membershipRepository.replaceBranchAccess(
      ORGANIZATION_ID,
      MEMBERSHIP_ID,
      [BRANCH_ID],
    );

    await tenancy.userRepository.save(
      makeUser({ id: GERENTE_USER, name: 'João Gerente' }),
    );
    await tenancy.membershipRepository.save(
      makeMembership({
        id: GERENTE_MEMBERSHIP,
        userId: GERENTE_USER,
        permissionProfileId: GERENTE_PROFILE,
        pdvCode: '99',
        pdvPinHash: await PinHasher.hash('9999'),
      }),
    );
    await tenancy.membershipRepository.replaceBranchAccess(
      ORGANIZATION_ID,
      GERENTE_MEMBERSHIP,
      [BRANCH_ID],
    );

    const getPosPolicy = new GetPosPolicyUseCase(policies);
    const open = new OpenCashSessionUseCase(
      cashSessions,
      tenancy.membershipRepository,
    );
    const addMovement = new AddCashMovementUseCase(
      cashSessions,
      tenancy.membershipRepository,
      getPosPolicy,
    );
    const close = new CloseCashSessionUseCase(cashSessions);
    const list = new ListCashSessionsUseCase(cashSessions);

    return { cashSessions, open, addMovement, close, list };
  }

  describe('OpenCashSessionUseCase', () => {
    it('abre o turno com fundo de caixa', async () => {
      const { open } = await setup();
      const session = await open.execute({
        organizationId: ORGANIZATION_ID,
        branchId: BRANCH_ID,
        posTerminalId: TERMINAL_ID,
        operatorUserId: USER_ID,
        openingFloatCents: 15_000,
      });
      expect(session.status).toBe('open');
      expect(session.openingFloatCents).toBe(15_000);
      expect(session.openedByName).toBe('Maria Caixa');
    });

    it('recusa segundo open no mesmo terminal (409 Taken)', async () => {
      const { open } = await setup();
      await open.execute({
        organizationId: ORGANIZATION_ID,
        branchId: BRANCH_ID,
        posTerminalId: TERMINAL_ID,
        operatorUserId: USER_ID,
        openingFloatCents: 0,
      });
      await expect(
        open.execute({
          organizationId: ORGANIZATION_ID,
          branchId: BRANCH_ID,
          posTerminalId: TERMINAL_ID,
          operatorUserId: USER_ID,
          openingFloatCents: 0,
        }),
      ).rejects.toBeInstanceOf(PosCashSessionOpenTakenError);
    });
  });

  describe('AddCashMovementUseCase', () => {
    it('aceita reforço do operador', async () => {
      const { open, addMovement } = await setup();
      const session = await open.execute({
        organizationId: ORGANIZATION_ID,
        branchId: BRANCH_ID,
        posTerminalId: TERMINAL_ID,
        operatorUserId: USER_ID,
        openingFloatCents: 10_000,
      });
      const movement = await addMovement.execute({
        organizationId: ORGANIZATION_ID,
        sessionId: session.id,
        type: 'reinforcement',
        amountCents: 5_000,
        operatorUserId: USER_ID,
      });
      expect(movement.type).toBe('reinforcement');
      expect(movement.amountCents).toBe(5_000);
    });

    it('recusa sangria sem permissão e sem autorizador', async () => {
      const { open, addMovement } = await setup();
      const session = await open.execute({
        organizationId: ORGANIZATION_ID,
        branchId: BRANCH_ID,
        posTerminalId: TERMINAL_ID,
        operatorUserId: USER_ID,
        openingFloatCents: 10_000,
      });
      await expect(
        addMovement.execute({
          organizationId: ORGANIZATION_ID,
          sessionId: session.id,
          type: 'withdrawal',
          amountCents: 1_000,
          operatorUserId: USER_ID,
        }),
      ).rejects.toBeInstanceOf(PosCashWithdrawalForbiddenError);
    });

    it('exige supervisor acima da alçada mesmo com permissão de sangria', async () => {
      const { open, addMovement } = await setup({ withdrawalOnCaixa: true });
      const session = await open.execute({
        organizationId: ORGANIZATION_ID,
        branchId: BRANCH_ID,
        posTerminalId: TERMINAL_ID,
        operatorUserId: USER_ID,
        openingFloatCents: 10_000,
      });
      await expect(
        addMovement.execute({
          organizationId: ORGANIZATION_ID,
          sessionId: session.id,
          type: 'withdrawal',
          amountCents: 60_000,
          operatorUserId: USER_ID,
        }),
      ).rejects.toBeInstanceOf(PosCashSupervisorRequiredError);
    });

    it('aceita sangria autorizada pelo gerente', async () => {
      const { open, addMovement } = await setup();
      const session = await open.execute({
        organizationId: ORGANIZATION_ID,
        branchId: BRANCH_ID,
        posTerminalId: TERMINAL_ID,
        operatorUserId: USER_ID,
        openingFloatCents: 10_000,
      });
      const movement = await addMovement.execute({
        organizationId: ORGANIZATION_ID,
        sessionId: session.id,
        type: 'withdrawal',
        amountCents: 2_000,
        operatorUserId: USER_ID,
        authorizedByUserId: GERENTE_USER,
      });
      expect(movement.authorizedByName).toBe('João Gerente');
    });
  });

  describe('CloseCashSessionUseCase', () => {
    it('fecha e calcula expectedCash = float + reforço − sangria + vendas cash', async () => {
      const { cashSessions, open, addMovement, close } = await setup({
        withdrawalOnCaixa: true,
      });
      const session = await open.execute({
        organizationId: ORGANIZATION_ID,
        branchId: BRANCH_ID,
        posTerminalId: TERMINAL_ID,
        operatorUserId: USER_ID,
        openingFloatCents: 10_000,
      });
      await addMovement.execute({
        organizationId: ORGANIZATION_ID,
        sessionId: session.id,
        type: 'reinforcement',
        amountCents: 5_000,
        operatorUserId: USER_ID,
      });
      await addMovement.execute({
        organizationId: ORGANIZATION_ID,
        sessionId: session.id,
        type: 'withdrawal',
        amountCents: 2_000,
        operatorUserId: USER_ID,
      });
      cashSessions.registerSale({
        id: 'sale-1',
        sessionId: session.id,
        number: 1,
        customerName: 'Cliente',
        sellerName: '',
        operatorName: 'Maria',
        status: 'closed',
        totalCents: 3_000,
        createdAt: new Date(),
        updatedAt: new Date(),
        lines: [],
        payments: [
          {
            id: 'pay-1',
            methodId: 'm1',
            methodName: 'Dinheiro',
            methodSystemKey: 'pm-dinheiro',
            amountCents: 3_000,
            paidAt: new Date(),
          },
        ],
      });

      const closed = await close.execute({
        organizationId: ORGANIZATION_ID,
        sessionId: session.id,
        countedCashCents: 16_000,
        countedCreditCents: 0,
        countedDebitCents: 0,
        countedVoucherCents: 0,
        countedOtherCents: 0,
      });

      // 10000 + 5000 - 2000 + 3000 = 16000
      expect(closed.status).toBe('closed');
      expect(closed.expectedCashCents).toBe(16_000);
      expect(closed.differenceCashCents).toBe(0);
      expect(closed.declaredReceiptsCents).toBe(16_000);
    });

    it('recusa fechar sessão já fechada', async () => {
      const { cashSessions, close } = await setup();
      await cashSessions.save(
        PosCashSession.create(
          {
            organizationId: ORGANIZATION_ID,
            branchId: BRANCH_ID,
            posTerminalId: TERMINAL_ID,
            openedByUserId: USER_ID,
            openedByName: 'Maria',
            openingFloatCents: 0,
            status: 'closed',
            closedAt: new Date(),
          },
          SESSION_ID,
        ),
      );
      await expect(
        close.execute({
          organizationId: ORGANIZATION_ID,
          sessionId: SESSION_ID,
          countedCashCents: 0,
          countedCreditCents: 0,
          countedDebitCents: 0,
          countedVoucherCents: 0,
          countedOtherCents: 0,
        }),
      ).rejects.toBeInstanceOf(PosCashSessionNotOpenError);
    });
  });

  describe('ListCashSessionsUseCase', () => {
    it('pagina e filtra por terminal', async () => {
      const { cashSessions, list } = await setup();
      await cashSessions.save(
        PosCashSession.create(
          {
            organizationId: ORGANIZATION_ID,
            branchId: BRANCH_ID,
            posTerminalId: TERMINAL_ID,
            openedByUserId: USER_ID,
            openedByName: 'Maria Caixa',
            openingFloatCents: 0,
          },
          SESSION_ID,
        ),
      );
      await cashSessions.save(
        PosCashSession.create({
          organizationId: ORGANIZATION_ID,
          branchId: BRANCH_ID,
          posTerminalId: '99999999-9999-4999-8999-999999999999',
          openedByUserId: USER_ID,
          openedByName: 'Outro',
          openingFloatCents: 0,
        }),
      );

      const result = await list.execute({
        organizationId: ORGANIZATION_ID,
        posTerminalId: TERMINAL_ID,
        page: 1,
        perPage: 10,
      });
      expect(result.total).toBe(1);
      expect(result.items[0]?.session.id).toBe(SESSION_ID);
      expect(result.items[0]?.posTerminalName).toBe('PDV 1');
    });
  });
});
