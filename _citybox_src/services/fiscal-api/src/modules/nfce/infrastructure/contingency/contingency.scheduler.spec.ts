import { randomUUID } from 'crypto';
import { Logger } from '@nestjs/common';
import { ContingencyScheduler } from './contingency.scheduler';
import { InMemoryContingencyQueueRepository } from '../../tests/in-memory-contingency-queue.repository';
import type { TransmitPendingNfceUseCase } from '../../application/use-cases/transmit-pending-nfce/transmit-pending-nfce.use-case';
import type { AlertOverdueContingencyUseCase } from '../../application/use-cases/alert-overdue-contingency/alert-overdue-contingency.use-case';

/// Dublês mínimos: esta suíte é sobre **orquestração** (quem roda, em que
/// ordem, o que acontece quando falha), não sobre o que cada caso de uso faz —
/// isso tem suíte própria.
function fakeTransmit() {
  const calls: string[] = [];
  return {
    calls,
    useCase: {
      execute: (dto: { companyId: string }) => {
        calls.push(dto.companyId);
        return Promise.resolve({
          transmitted: 0,
          rejected: 0,
          remaining: 0,
          rejectedDocumentIds: [],
        });
      },
    } as unknown as TransmitPendingNfceUseCase,
  };
}

function fakeAlert() {
  const state = { calls: 0, throws: false };
  return {
    state,
    useCase: {
      execute: () => {
        state.calls += 1;
        if (state.throws) return Promise.reject(new Error('alarme falhou'));
        return Promise.resolve({ overdue: [] });
      },
    } as unknown as AlertOverdueContingencyUseCase,
  };
}

describe('ContingencyScheduler (T053)', () => {
  let queue: InMemoryContingencyQueueRepository;

  beforeEach(() => {
    delete process.env.NFCE_CONTINGENCY_DRAIN;
    queue = new InMemoryContingencyQueueRepository();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.NFCE_CONTINGENCY_DRAIN;
  });

  function build() {
    const transmit = fakeTransmit();
    const alert = fakeAlert();
    return {
      transmit,
      alert,
      scheduler: new ContingencyScheduler(
        transmit.useCase,
        alert.useCase,
        queue,
      ),
    };
  }

  describe('⚠️ nasce desligado', () => {
    it('nao agenda nada sem NFCE_CONTINGENCY_DRAIN=on', () => {
      const { scheduler, transmit } = build();

      scheduler.onModuleInit();
      scheduler.onModuleDestroy();

      // Enquanto a emissão em contingência não estiver validada contra a
      // SEFAZ, um dreno automático transmitiria cupons montados por código
      // nunca exercitado contra o órgão. Ligar depois é uma variável; desfazer
      // transmissão indevida não é.
      expect(transmit.calls).toHaveLength(0);
    });

    it('avisa COMO ligar, em vez de ficar em silencio', () => {
      const log = jest.spyOn(Logger.prototype, 'log');
      const { scheduler } = build();

      scheduler.onModuleInit();
      scheduler.onModuleDestroy();

      expect(log).toHaveBeenCalledWith(
        expect.stringContaining('NFCE_CONTINGENCY_DRAIN=on'),
      );
    });

    it('quando ligado, ALERTA sobre a limitacao de uma instancia', () => {
      // O aviso é parte da entrega: quem liga precisa saber que réplicas
      // concorrentes podem transmitir o mesmo cupom duas vezes.
      process.env.NFCE_CONTINGENCY_DRAIN = 'on';
      const warn = jest.spyOn(Logger.prototype, 'warn');
      const { scheduler } = build();

      scheduler.onModuleInit();
      scheduler.onModuleDestroy();

      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('uma instância'),
      );
    });
  });

  describe('ciclo', () => {
    it('⚠️ alarma ANTES de drenar', async () => {
      // Se o alarme rodasse depois, um dreno que falhasse adiaria a
      // visibilidade do problema fiscal para o próximo ciclo — e é justamente
      // quando a SEFAZ está instável que o alarme mais importa.
      const ordem: string[] = [];
      const transmit = fakeTransmit();
      const alert = fakeAlert();

      const scheduler = new ContingencyScheduler(
        {
          execute: () => {
            ordem.push('drenou');
            return Promise.resolve({
              transmitted: 0,
              rejected: 0,
              remaining: 0,
              rejectedDocumentIds: [],
            });
          },
        } as unknown as TransmitPendingNfceUseCase,
        {
          execute: () => {
            ordem.push('alarmou');
            return Promise.resolve({ overdue: [] });
          },
        } as unknown as AlertOverdueContingencyUseCase,
        queue,
      );

      await queue.enqueue({
        fiscalDocumentId: randomUUID(),
        companyId: randomUUID(),
        emittedAt: new Date(),
      });

      await scheduler.tick();

      void transmit;
      void alert;
      expect(ordem).toEqual(['alarmou', 'drenou']);
    });

    it('drena UMA vez por Emitente, mesmo com varios cupons', async () => {
      const empresaA = randomUUID();
      const empresaB = randomUUID();
      for (const companyId of [empresaA, empresaA, empresaB]) {
        await queue.enqueue({
          fiscalDocumentId: randomUUID(),
          companyId,
          emittedAt: new Date(),
        });
      }

      const { scheduler, transmit } = build();
      await scheduler.tick();

      expect([...transmit.calls].sort()).toEqual([empresaA, empresaB].sort());
    });

    it('nao toca em nada quando a fila esta vazia', async () => {
      const { scheduler, transmit } = build();

      await scheduler.tick();

      expect(transmit.calls).toHaveLength(0);
    });

    it('⚠️ um ciclo que estoura NAO derruba o agendador', async () => {
      // Sem o catch, a exceção sobe para o `setInterval` e o dreno morre em
      // silêncio — a fila para e ninguém percebe.
      const { scheduler, alert } = build();
      alert.state.throws = true;

      await expect(scheduler.tick()).resolves.toBeUndefined();

      alert.state.throws = false;
      await scheduler.tick();

      // O ciclo seguinte roda normalmente.
      expect(alert.state.calls).toBe(2);
    });

    it('nao sobrepoe ciclos no mesmo processo', async () => {
      const alert = fakeAlert();
      let liberar: (() => void) | undefined;
      const lento = new Promise<void>((resolve) => (liberar = resolve));

      const scheduler = new ContingencyScheduler(
        {
          execute: () =>
            lento.then(() => ({
              transmitted: 0,
              rejected: 0,
              remaining: 0,
              rejectedDocumentIds: [],
            })),
        } as unknown as TransmitPendingNfceUseCase,
        alert.useCase,
        queue,
      );

      await queue.enqueue({
        fiscalDocumentId: randomUUID(),
        companyId: randomUUID(),
        emittedAt: new Date(),
      });

      const primeiro = scheduler.tick();
      // Segundo tick enquanto o primeiro ainda roda: precisa ser ignorado, não
      // enfileirado por cima.
      await scheduler.tick();

      liberar?.();
      await primeiro;

      expect(alert.state.calls).toBe(1);
    });
  });
});
