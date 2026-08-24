import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { FiscalEventRepository } from '../../domain/repositories/fiscal-event.repository.interface';
import {
  FiscalEvent,
  type FiscalEventProps,
  type FiscalEventType,
} from '../../domain/entities/fiscal-event.entity';

type FiscalEventRow = {
  id: string;
  fiscalDocumentId: string | null;
  eventType: string;
  sequence: number | null;
  status: string;
  justification: string | null;
  correctionText: string | null;
  protocol: string | null;
  requestXmlObjectKey: string | null;
  nationalEventCode: string | null;
  generatorEnvironment: number | null;
  replacedByDocumentId: string | null;
  responseXmlObjectKey: string | null;
  createdAt: Date;
  companyId: string | null;
  series: string | null;
  numberRangeStart: bigint | null;
  numberRangeEnd: bigint | null;
};

@Injectable()
export class PrismaFiscalEventRepository extends FiscalEventRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByFiscalDocumentId(
    fiscalDocumentId: string,
  ): Promise<FiscalEvent[]> {
    const rows = await this.prisma.fiscalEvent.findMany({
      where: { fiscalDocumentId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async save(event: FiscalEvent): Promise<FiscalEvent> {
    const row = await this.prisma.fiscalEvent.upsert({
      where: { id: event.id },
      create: {
        id: event.id,
        fiscalDocumentId: event.fiscalDocumentId,
        eventType: event.eventType,
        sequence: event.sequence,
        status: event.status,
        justification: event.justification,
        correctionText: event.correctionText,
        protocol: event.protocol,
        // Descartadas ate 2026-08-07: `toEntity` lia estes campos e o `create`
        // nunca os escrevia, entao a trilha de FR-011 ia para o banco nula
        // mesmo com o caso de uso preenchendo tudo. Testes de caso de uso nao
        // pegavam — usam o repositorio em memoria, que guarda a entidade
        // inteira. So teste contra Postgres real expoe esta familia de bug.
        requestXmlObjectKey: event.requestXmlObjectKey,
        responseXmlObjectKey: event.responseXmlObjectKey,
        nationalEventCode: event.nationalEventCode,
        generatorEnvironment: event.generatorEnvironment,
        replacedByDocumentId: event.replacedByDocumentId,
        createdAt: event.createdAt,
        companyId: event.companyId,
        series: event.series,
        numberRangeStart: event.numberRangeStart,
        numberRangeEnd: event.numberRangeEnd,
      },
      update: {
        status: event.status,
        protocol: event.protocol,
      },
    });
    return this.toEntity(row);
  }

  private toEntity(row: FiscalEventRow): FiscalEvent {
    const props: FiscalEventProps = {
      fiscalDocumentId: row.fiscalDocumentId,
      eventType: row.eventType as FiscalEventType,
      sequence: row.sequence,
      status: row.status,
      justification: row.justification,
      correctionText: row.correctionText,
      protocol: row.protocol,
      requestXmlObjectKey: row.requestXmlObjectKey,
      nationalEventCode: row.nationalEventCode,
      generatorEnvironment: row.generatorEnvironment,
      replacedByDocumentId: row.replacedByDocumentId,
      responseXmlObjectKey: row.responseXmlObjectKey,
      createdAt: row.createdAt,
      companyId: row.companyId,
      series: row.series,
      numberRangeStart: row.numberRangeStart,
      numberRangeEnd: row.numberRangeEnd,
    };
    return FiscalEvent.with(props, row.id);
  }
}
