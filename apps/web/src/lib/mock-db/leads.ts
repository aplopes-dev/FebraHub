import { createRandom, isoFromNow, seqId } from "@/lib/mock-db/lcg";
import { PEOPLE } from "@/lib/mock-db/people";
import { OPPORTUNITIES } from "@/lib/mock-db/pipeline";
import type { Lead, LeadStatus } from "@/lib/mock-db/types";

/**
 * Captação — o lead antes de virar oportunidade.
 *
 * O que importa medir aqui não é volume, é **tempo até o primeiro contato** e
 * **lead sem dono**: lead comprado que dorme dois dias na fila é dinheiro de
 * mídia jogado fora, e é invisível em qualquer relatório que só conte total
 * por canal.
 */

const OWNERS = ["usr-tati", "usr-marcos", "usr-juliana", "usr-rafael"];

const INTEREST_POOL = [
  "prd-if",
  "prd-cis",
  "prd-cis",
  "prd-vsri",
  "prd-tav",
  "prd-fcis",
  "prd-coaching",
];

function build(): Lead[] {
  const random = createRandom(4_242_424);
  const leads: Lead[] = [];

  // Quem já tem oportunidade não aparece como lead novo — só como convertido.
  const withOpportunity = new Set(OPPORTUNITIES.map((item) => item.personId));

  PEOPLE.forEach((person, index) => {
    const converted = withOpportunity.has(person.id);

    // Nem toda pessoa da base entrou como lead rastreado; e dos convertidos,
    // só uma amostra tem o registro de captação preservado.
    if (converted && !random.chance(0.35)) return;
    if (!converted && !person.roles.includes("lead") && !random.chance(0.4)) return;

    const receivedAt = isoFromNow(-random.int(0, 26), -random.int(0, 20));
    const opportunity = converted
      ? OPPORTUNITIES.find((item) => item.personId === person.id)
      : undefined;

    let status: LeadStatus;
    if (converted) status = "convertido";
    else {
      const roll = random.next();
      status = roll < 0.42 ? "novo" : roll < 0.85 ? "em_contato" : "descartado";
    }

    // Lead sem dono e sem primeiro contato: o buraco que a tela precisa acusar.
    const orphan = status === "novo" && random.chance(0.42);
    const contacted = status !== "novo" || (!orphan && random.chance(0.5));

    leads.push({
      id: seqId("led", index + 1),
      personId: person.id,
      origin: person.origin,
      receivedAt,
      firstContactAt: contacted
        ? new Date(
            new Date(receivedAt).getTime() + random.int(10, 3_600) * 60_000,
          ).toISOString()
        : undefined,
      ownerId: orphan ? undefined : (person.ownerId ?? random.pick(OWNERS)),
      status,
      opportunityId: opportunity?.id,
      discardReason:
        status === "descartado"
          ? random.pick([
              "Telefone inexistente",
              "Fora da praça de Salvador",
              "Já é aluno do produto",
              "Registro duplicado",
            ])
          : undefined,
      interestProductId: random.pick(INTEREST_POOL),
    });
  });

  return leads.sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}

/** Store mutável: a tela atribui dono e converte lead em oportunidade. */
export const LEADS: Lead[] = build();

export function findLead(id: string | undefined): Lead | undefined {
  if (!id) return undefined;
  return LEADS.find((lead) => lead.id === id);
}

/**
 * Minutos entre a chegada do lead e o primeiro contato. `undefined` quando
 * ninguém falou com ele ainda — e é esse `undefined` que interessa.
 */
export function firstContactMinutes(lead: Lead): number | undefined {
  if (!lead.firstContactAt) return undefined;
  return Math.round(
    (new Date(lead.firstContactAt).getTime() - new Date(lead.receivedAt).getTime()) /
      60_000,
  );
}
