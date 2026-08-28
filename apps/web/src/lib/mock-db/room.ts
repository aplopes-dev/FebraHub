import { LIVE_EDITION_ID, findEdition } from "@/lib/mock-db/editions";
import { createRandom, isoFromNow, seqId } from "@/lib/mock-db/lcg";
import { PEOPLE } from "@/lib/mock-db/people";
import type { Attendee, AttendeeStatus } from "@/lib/mock-db/types";

/**
 * A sala — participantes da edição que está acontecendo.
 *
 * É o objeto que falta em CRM genérico e que explica a receita da unidade: o
 * evento enche a sala, a sala converte em curso. Sem `esperado → presente →
 * abordado → matriculado` registrado por pessoa, a conversão do evento vira
 * autópsia no fim do mês em vez de painel durante o dia.
 *
 * Só edições **em andamento ou encerradas** têm sala; as futuras ainda não
 * abriram credenciamento.
 */

const CONSULTANTS_ON_FLOOR = [
  "usr-tati",
  "usr-marcos",
  "usr-juliana",
  "usr-rafael",
  "usr-bia",
];

function build(): Attendee[] {
  const edition = findEdition(LIVE_EDITION_ID);
  if (!edition) return [];

  const random = createRandom(31_337);
  const attendees: Attendee[] = [];

  // A lista da sala sai da carteira: quem comprou ingresso é gente que já
  // existe no cadastro (ou passa a existir no check-in).
  const pool = random.shuffle(PEOPLE).slice(
    0,
    edition.tiers.reduce((total, tier) => total + tier.sold, 0),
  );

  let cursor = 0;
  edition.tiers.forEach((tier) => {
    for (let index = 0; index < tier.sold; index += 1) {
      const person = pool[cursor];
      cursor += 1;
      if (!person) break;

      // O dia já começou: a maior parte fez check-in, uma fatia foi abordada
      // e uma fatia menor matriculou. `esperado` é quem ainda não chegou.
      const roll = random.next();
      let status: AttendeeStatus;
      if (roll < 0.14) status = "esperado";
      else if (roll < 0.2) status = "no_show";
      else if (roll < 0.55) status = "presente";
      else if (roll < 0.75) status = "abordado";
      else if (roll < 0.88) status = "pensando";
      // A fatia de matrícula é pequena de propósito: a conversão real de
      // evento→curso da unidade é de um dígito (DESCOBERTAS §2). A tela existe
      // para tornar esse número visível durante o evento, não depois dele.
      else if (roll < 0.94) status = "matriculado";
      else status = "recusou";

      const checkedIn = status !== "esperado" && status !== "no_show";
      const approached =
        status === "abordado" ||
        status === "pensando" ||
        status === "matriculado" ||
        status === "recusou";

      attendees.push({
        id: seqId("att", attendees.length + 1),
        editionId: edition.id,
        personId: person.id,
        tierId: tier.id,
        status,
        checkedInAt: checkedIn ? isoFromNow(0, -random.int(1, 6)) : undefined,
        consultantId: approached ? random.pick(CONSULTANTS_ON_FLOOR) : undefined,
        approachedAt: approached ? isoFromNow(0, -random.int(0, 4)) : undefined,
        outcomeNote:
          status === "pensando"
            ? "Quer conversar com o marido antes de decidir."
            : status === "recusou"
              ? random.pick([
                  "Achou o valor acima do que pode agora.",
                  "Já fez o treinamento em outra praça.",
                  "Vai esperar a turma do ano que vem.",
                ])
              : undefined,
      });
    }
  });

  return attendees;
}

/** Store mutável: check-in e abordagem acontecem na tela. */
export const ATTENDEES: Attendee[] = build();

export function attendeesOfEdition(editionId: string): Attendee[] {
  return ATTENDEES.filter((attendee) => attendee.editionId === editionId);
}

export function findAttendee(id: string | undefined): Attendee | undefined {
  if (!id) return undefined;
  return ATTENDEES.find((attendee) => attendee.id === id);
}

export function attendeeOfPerson(personId: string): Attendee[] {
  return ATTENDEES.filter((attendee) => attendee.personId === personId);
}

export type RoomCounters = {
  expected: number;
  checkedIn: number;
  approached: number;
  enrolled: number;
  thinking: number;
  refused: number;
  noShow: number;
  /** Matrículas ÷ presentes — a conversão que o evento existe para produzir. */
  conversionPercent: number;
  /** Presentes ÷ inscritos. */
  attendancePercent: number;
};

export function roomCounters(editionId: string): RoomCounters {
  const list = attendeesOfEdition(editionId);
  const total = list.length;
  const noShow = list.filter((item) => item.status === "no_show").length;
  const expected = list.filter((item) => item.status === "esperado").length;
  const enrolled = list.filter((item) => item.status === "matriculado").length;
  const thinking = list.filter((item) => item.status === "pensando").length;
  const refused = list.filter((item) => item.status === "recusou").length;
  const checkedIn = list.filter((item) => Boolean(item.checkedInAt)).length;
  const approached = list.filter((item) => Boolean(item.approachedAt)).length;

  return {
    expected,
    checkedIn,
    approached,
    enrolled,
    thinking,
    refused,
    noShow,
    conversionPercent: checkedIn > 0 ? Math.round((enrolled / checkedIn) * 1000) / 10 : 0,
    attendancePercent: total > 0 ? Math.round((checkedIn / total) * 1000) / 10 : 0,
  };
}
