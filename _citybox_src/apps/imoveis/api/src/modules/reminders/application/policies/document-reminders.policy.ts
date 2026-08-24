import type { LeadEntity } from '../../../leads/domain/entities/lead.entity';
import type { DealStage } from '../../../deals/domain/entities/deal.entity';
import {
  DEAL_STAGES,
} from '../../../deals/application/policies/deal-stage.policy';
import { initialsFromName, type Reminder } from './build-reminders';

/** Contrato enviado há N dias sem o negócio chegar em contrato assinado. */
export const UNSIGNED_CONTRACT_REMINDER_DAYS = 3;

const SIGNED_RANK = DEAL_STAGES.indexOf('contract_signed');

function stageRank(stage: DealStage | undefined): number {
  if (!stage) return -1;
  return DEAL_STAGES.indexOf(stage);
}

export function buildDocumentReminders(
  leads: readonly LeadEntity[],
  stageByLeadId: ReadonlyMap<string, DealStage>,
  now: Date,
): Reminder[] {
  const reminders: Reminder[] = [];
  const cutoff = now.getTime() - UNSIGNED_CONTRACT_REMINDER_DAYS * 24 * 60 * 60 * 1000;

  const unsent: LeadEntity[] = [];
  const unsigned: LeadEntity[] = [];

  for (const lead of leads) {
    const documents = lead.documents ?? [];
    const contracts = documents.filter((d) => d.kind === 'contract');
    if (contracts.length === 0) continue;

    const sent = contracts.filter((d) => d.sentAt);
    if (sent.length === 0) {
      unsent.push(lead);
      continue;
    }

    const oldestSent = sent.reduce(
      (min, d) => Math.min(min, d.sentAt!.getTime()),
      Number.POSITIVE_INFINITY,
    );
    if (
      oldestSent <= cutoff &&
      stageRank(stageByLeadId.get(lead.id)) < SIGNED_RANK
    ) {
      unsigned.push(lead);
    }
  }

  if (unsent.length > 0) {
    const first = unsent[0]!;
    reminders.push({
      kind: 'document',
      title: 'Contrato sem envio',
      description:
        unsent.length === 1
          ? `${first.name}: contrato anexado ainda não enviado`
          : `${unsent.length} contratos anexados ainda não enviados`,
      progress: 40,
      people: unsent.slice(0, 4).map((lead) => ({
        id: lead.id,
        name: lead.name,
        initials: initialsFromName(lead.name),
      })),
      totalPeople: unsent.length,
      isHighlighted: true,
      href: unsent.length === 1 ? `/leads/${first.id}?tab=documents` : '/leads',
    });
  }

  if (unsigned.length > 0) {
    const first = unsigned[0]!;
    reminders.push({
      kind: 'document',
      title: 'Contrato sem assinatura',
      description:
        unsigned.length === 1
          ? `${first.name}: enviado há mais de ${UNSIGNED_CONTRACT_REMINDER_DAYS} dias`
          : `${unsigned.length} contratos enviados sem assinatura`,
      progress: 70,
      people: unsigned.slice(0, 4).map((lead) => ({
        id: lead.id,
        name: lead.name,
        initials: initialsFromName(lead.name),
      })),
      totalPeople: unsigned.length,
      isHighlighted: true,
      href: unsigned.length === 1 ? `/leads/${first.id}?tab=documents` : '/leads',
    });
  }

  return reminders;
}
