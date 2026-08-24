import { randomUUID } from 'crypto';
import { Logger } from '@nestjs/common';
import { AlertOverdueContingencyUseCase } from './alert-overdue-contingency.use-case';
import { InMemoryContingencyQueueRepository } from '../../../tests/in-memory-contingency-queue.repository';
import { DEFAULT_CONTINGENCY_DEADLINE_HOURS } from '../../../domain/contingency/transmission-deadline';

const HOUR = 3_600_000;

describe('AlertOverdueContingencyUseCase (T055)', () => {
  const companyId = randomUUID();
  let queue: InMemoryContingencyQueueRepository;
  let useCase: AlertOverdueContingencyUseCase;

  beforeEach(() => {
    delete process.env.NFCE_CONTINGENCY_DEADLINE_HOURS;
    queue = new InMemoryContingencyQueueRepository();
    useCase = new AlertOverdueContingencyUseCase(queue);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.NFCE_CONTINGENCY_DEADLINE_HOURS;
  });

  async function enqueue(hoursAgo: number): Promise<string> {
    const fiscalDocumentId = randomUUID();
    await queue.enqueue({
      fiscalDocumentId,
      companyId,
      emittedAt: new Date(Date.now() - hoursAgo * HOUR),
    });
    return fiscalDocumentId;
  }

  it('nao alarma dentro do prazo', async () => {
    await enqueue(DEFAULT_CONTINGENCY_DEADLINE_HOURS - 1);

    expect((await useCase.execute()).overdue).toHaveLength(0);
  });

  it('alarma o que passou do prazo', async () => {
    const id = await enqueue(DEFAULT_CONTINGENCY_DEADLINE_HOURS + 2);

    const { overdue } = await useCase.execute();

    expect(overdue).toHaveLength(1);
    expect(overdue[0].fiscalDocumentId).toBe(id);
    expect(overdue[0].hoursOverdue).toBeCloseTo(2, 0);
  });

  it('⚠️ NAO tenta transmitir — so torna visivel', async () => {
    // O caso de uso não recebe provider nem repositório de documentos. É
    // estrutural: um cupom fora do prazo não se resolve com retentativa, e
    // misturar as duas coisas faria o pior caso parecer resolvido a cada
    // ciclo.
    await enqueue(DEFAULT_CONTINGENCY_DEADLINE_HOURS + 5);

    await useCase.execute();

    // A entrada continua PENDING: nada foi transmitido nem marcado.
    expect(queue.all()[0].status).toBe('PENDING');
    expect(queue.all()[0].attempts).toBe(0);
  });

  it('registra em log de ERRO, um por cupom', async () => {
    const erro = jest.spyOn(Logger.prototype, 'error');
    await enqueue(DEFAULT_CONTINGENCY_DEADLINE_HOURS + 1);
    await enqueue(DEFAULT_CONTINGENCY_DEADLINE_HOURS + 3);

    await useCase.execute();

    // Uma linha por cupom, não um agregado: quem investiga precisa saber qual
    // documento e de qual Emitente.
    expect(erro).toHaveBeenCalledTimes(2);
    expect(erro).toHaveBeenCalledWith(expect.stringContaining('FORA DO PRAZO'));
    expect(erro).toHaveBeenCalledWith(
      expect.stringContaining('retentativa não resolve'),
    );
  });

  it('o prazo e configuravel sem deploy', async () => {
    process.env.NFCE_CONTINGENCY_DEADLINE_HOURS = '2';
    await enqueue(3);

    expect((await useCase.execute()).overdue).toHaveLength(1);
  });

  it('⚠️ prazo invalido cai no padrao, em vez de silenciar o alarme', async () => {
    // `Number('abc')` viraria NaN, e toda comparação com NaN é falsa — nenhum
    // cupom apareceria como atrasado e o alarme sumiria sem aviso.
    process.env.NFCE_CONTINGENCY_DEADLINE_HOURS = 'nao-e-numero';
    await enqueue(DEFAULT_CONTINGENCY_DEADLINE_HOURS + 1);

    expect((await useCase.execute()).overdue).toHaveLength(1);
  });

  it('atrasados de QUALQUER Emitente, nao so de um', async () => {
    // O alarme é da operação inteira: filtrar por contribuinte exigiria saber
    // de antemão qual loja checar.
    await queue.enqueue({
      fiscalDocumentId: randomUUID(),
      companyId: randomUUID(),
      emittedAt: new Date(
        Date.now() - (DEFAULT_CONTINGENCY_DEADLINE_HOURS + 1) * HOUR,
      ),
    });
    await enqueue(DEFAULT_CONTINGENCY_DEADLINE_HOURS + 1);

    expect((await useCase.execute()).overdue).toHaveLength(2);
  });
});
