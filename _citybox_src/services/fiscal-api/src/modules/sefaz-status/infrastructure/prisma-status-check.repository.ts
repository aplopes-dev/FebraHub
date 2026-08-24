import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infra/prisma/prisma.service';
import {
  StatusCheckRepository,
  type LockedStatusWindow,
  type SaveStatusCheckInput,
} from '../domain/status-check.repository';
import type {
  StatusCheck,
  StatusWindowKey,
} from '../domain/status-check.entity';
import { statusWindowKeyString } from '../domain/status-check.entity';
import type {
  ServiceStatus,
  StatusModel,
  Authority,
} from '../domain/service-status';

type Row = {
  companyId: string;
  model: string;
  environment: string;
  status: string;
  authority: string;
  authorityMessage: string | null;
  expectedReturnAt: Date | null;
  checkedAt: Date;
};

function toStatusCheck(row: Row): StatusCheck {
  return {
    companyId: row.companyId,
    model: row.model as StatusModel,
    environment: row.environment as 'HOMOLOGATION' | 'PRODUCTION',
    status: row.status as ServiceStatus,
    authority: row.authority as Authority,
    authorityMessage: row.authorityMessage,
    expectedReturnAt: row.expectedReturnAt,
    checkedAt: row.checkedAt,
  };
}

/// Cliente Prisma ou o cliente transacional entregue por `$transaction`.
type PrismaLike = Pick<PrismaService, 'sefazStatusCheck'>;

async function latestFor(
  client: PrismaLike,
  key: StatusWindowKey,
): Promise<StatusCheck | null> {
  const row = await client.sefazStatusCheck.findFirst({
    where: {
      companyId: key.companyId,
      model: key.model,
      environment: key.environment,
    },
    orderBy: { checkedAt: 'desc' },
  });
  return row ? toStatusCheck(row) : null;
}

async function persist(
  client: PrismaLike,
  input: SaveStatusCheckInput,
): Promise<StatusCheck> {
  const row = await client.sefazStatusCheck.create({
    data: {
      companyId: input.companyId,
      model: input.model,
      environment: input.environment,
      status: input.status,
      authority: input.authority,
      authorityMessage: input.authorityMessage,
      expectedReturnAt: input.expectedReturnAt,
      checkedAt: input.checkedAt,
    },
  });
  return toStatusCheck(row);
}

@Injectable()
export class PrismaStatusCheckRepository extends StatusCheckRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  findLatest(key: StatusWindowKey): Promise<StatusCheck | null> {
    return latestFor(this.prisma, key);
  }

  /// ⚠️ **Serializado por lock consultivo, por chave de janela.**
  ///
  /// `pg_advisory_xact_lock(hashtext(chave))` serializa a seção crítica por
  /// `(empresa, modelo, ambiente)` — outras chaves seguem em paralelo. O lock é
  /// liberado no fim da transação (variante `_xact_`, não vaza se `fn` estourar).
  ///
  /// `fn` recebe uma `LockedStatusWindow` ligada a esta transação: seu
  /// `findLatest`/`save` rodam aqui dentro. Como o `save` commita junto com
  /// esta transação — no mesmo instante em que o lock é liberado —, o próximo a
  /// entrar re-checa numa transação nova e **vê** o dado fresco. É isso que
  /// transforma N consultas simultâneas em 1 contato ao órgão (FR-007b).
  ///
  /// ⚠️ A transação fica aberta durante o contato ao órgão (dentro de `fn`).
  /// É aceitável: o escopo é por chave e o volume é ínfimo (no máximo 1 contato
  /// a cada 3 min por chave). Um dublê em memória seria sequencial por natureza
  /// e não pegaria uma regressão aqui — só o teste de integração pega.
  withWindowLock<T>(
    key: StatusWindowKey,
    fn: (locked: LockedStatusWindow) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const lockKey = statusWindowKeyString(key);
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

      const locked: LockedStatusWindow = {
        findLatest: () => latestFor(tx, key),
        save: (input) => persist(tx, input),
      };
      return fn(locked);
    });
  }
}
