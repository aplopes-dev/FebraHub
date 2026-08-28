import { EDITIONS } from "@/lib/mock-db/editions";
import { createRandom, isoFromNow, seqId } from "@/lib/mock-db/lcg";
import type { Origin, OriginChannel, Person, PersonRole } from "@/lib/mock-db/types";

/**
 * A carteira de pessoas da unidade.
 *
 * Uma pessoa só, com papéis que acumulam — é a ficha única que o menu promete
 * em Comercial → Pessoas. Quem fez a palestra ano passado e voltou para o
 * Método CIS é o **mesmo** registro, com `participante` e `aluno` ao mesmo
 * tempo; separar isso em dois cadastros é o que apaga a recompra do relatório.
 */

const FIRST_NAMES = [
  "Ana Paula", "Carlos", "Fernanda", "João Pedro", "Luciana", "Rafael",
  "Mariana", "Bruno", "Camila", "Diego", "Patrícia", "Thiago", "Juliana",
  "Marcelo", "Renata", "Vinícius", "Larissa", "Gustavo", "Tatiane", "Rodrigo",
  "Aline", "Felipe", "Débora", "Leandro", "Sabrina", "André", "Vanessa",
  "Everton", "Priscila", "Márcio", "Cristiane", "Igor", "Simone", "Wagner",
  "Elaine", "Roberto", "Nara", "Caio", "Michele", "Adriano",
];

const LAST_NAMES = [
  "Santos", "Oliveira", "Souza", "Almeida", "Ferreira", "Costa", "Rocha",
  "Nascimento", "Barbosa", "Ribeiro", "Carvalho", "Gomes", "Martins", "Araújo",
  "Cardoso", "Teixeira", "Pinheiro", "Moreira", "Freitas", "Andrade",
  "Cavalcante", "Dourado", "Bispo", "Sacramento", "Queiroz", "Bahia",
];

const CITIES: Array<{ city: string; state: string }> = [
  { city: "Salvador", state: "BA" },
  { city: "Salvador", state: "BA" },
  { city: "Salvador", state: "BA" },
  { city: "Lauro de Freitas", state: "BA" },
  { city: "Camaçari", state: "BA" },
  { city: "Feira de Santana", state: "BA" },
  { city: "Simões Filho", state: "BA" },
  { city: "Vitória da Conquista", state: "BA" },
  { city: "Ilhéus", state: "BA" },
  { city: "Itabuna", state: "BA" },
  { city: "Alagoinhas", state: "BA" },
  { city: "Recife", state: "PE" },
];

const COMPANIES = [
  "Construtora Litoral Norte",
  "Clínica Vida Plena",
  "Rede Sabor da Bahia",
  "Transportes Baía de Todos",
  "Studio Alfa Odontologia",
  "AgroVale Distribuidora",
  "Imobiliária Pituba Prime",
  "Escola Novo Tempo",
];

const CAMPAIGNS = [
  "IF-Agosto-Salvador",
  "MCIS-Turma-251",
  "VSRI-Salvador-Set",
  "Remarketing-Alunos",
  "Palestra-Gratuita-Pituba",
  "Indicacao-Aluno-2026",
];

const CHANNEL_POOL: OriginChannel[] = [
  "meta", "meta", "meta",
  "google", "google",
  "instagram",
  "whatsapp",
  "sympla", "sympla",
  "indicacao", "indicacao",
  "evento", "evento",
  "palestra",
  "manual",
];

const OWNER_POOL = ["usr-tati", "usr-marcos", "usr-juliana", "usr-rafael"];

const PERSON_COUNT = 140;

function buildOrigin(
  random: ReturnType<typeof createRandom>,
  channel: OriginChannel,
): Origin {
  const origin: Origin = { channel };

  if (channel === "meta" || channel === "google" || channel === "instagram") {
    origin.campaign = random.pick(CAMPAIGNS);
    origin.utmSource = channel === "google" ? "google" : "facebook";
    origin.utmMedium = "cpc";
    origin.utmCampaign = origin.campaign.toLowerCase();
  }

  if (channel === "sympla" || channel === "evento" || channel === "palestra") {
    origin.editionId = random.pick(EDITIONS).id;
    origin.campaign = random.pick(CAMPAIGNS);
  }

  return origin;
}

function buildRoles(index: number, random: ReturnType<typeof createRandom>): PersonRole[] {
  const roles: PersonRole[] = [];

  // A base é uma pirâmide: muita gente entra como lead, parte vira
  // participante de evento, uma fatia menor vira aluno.
  if (index % 10 < 4) {
    roles.push("lead");
  } else if (index % 10 < 7) {
    roles.push("lead", "participante");
  } else if (index % 10 < 9) {
    roles.push("participante", "aluno");
  } else {
    roles.push("participante", "ex_aluno");
  }

  if (random.chance(0.18)) roles.push("indicador");

  return roles;
}

function digits(random: ReturnType<typeof createRandom>, length: number): string {
  let value = "";
  for (let i = 0; i < length; i += 1) value += String(random.int(0, 9));
  return value;
}

function buildPeople(): Person[] {
  const random = createRandom(20260827);
  const people: Person[] = [];
  const usedNames = new Set<string>();

  for (let index = 0; index < PERSON_COUNT; index += 1) {
    let name = `${random.pick(FIRST_NAMES)} ${random.pick(LAST_NAMES)}`;
    let guard = 0;
    while (usedNames.has(name) && guard < 12) {
      name = `${random.pick(FIRST_NAMES)} ${random.pick(LAST_NAMES)} ${random.pick(LAST_NAMES)}`;
      guard += 1;
    }
    usedNames.add(name);

    const place = random.pick(CITIES);
    const channel = random.pick(CHANNEL_POOL);
    const roles = buildRoles(index, random);
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z]+/g, ".")
      .replace(/^\.|\.$/g, "");

    people.push({
      id: seqId("psn", index + 1),
      name,
      email: `${slug}@exemplo.com.br`,
      phone: `71${digits(random, 9)}`,
      document: digits(random, 11),
      city: place.city,
      state: place.state,
      roles,
      origin: buildOrigin(random, channel),
      ownerId: random.pick(OWNER_POOL),
      createdAt: isoFromNow(-random.int(3, 420), -random.int(0, 20)),
      company: random.chance(0.22) ? random.pick(COMPANIES) : undefined,
    });
  }

  // Indicações: quem tem o papel `indicador` aponta para duas pessoas mais
  // recentes. É o canal que mais fecha na unidade e precisa existir no dado.
  const advocates = people.filter((person) => person.roles.includes("indicador"));
  people.forEach((person, index) => {
    if (person.origin.channel !== "indicacao") return;
    const advocate = advocates[index % Math.max(1, advocates.length)];
    if (advocate && advocate.id !== person.id) {
      person.referredById = advocate.id;
    }
  });

  return people;
}

/** Store mutável: as telas criam pessoa ao converter lead, por exemplo. */
export const PEOPLE: Person[] = buildPeople();

export function findPerson(id: string | undefined): Person | undefined {
  if (!id) return undefined;
  return PEOPLE.find((person) => person.id === id);
}

export function personName(id: string | undefined): string {
  return findPerson(id)?.name ?? "—";
}

export function peopleByRole(role: PersonRole): Person[] {
  return PEOPLE.filter((person) => person.roles.includes(role));
}

/** Acrescenta um papel sem duplicar — papéis acumulam. */
export function addPersonRole(personId: string, role: PersonRole): void {
  const person = findPerson(personId);
  if (person && !person.roles.includes(role)) {
    person.roles = [...person.roles, role];
  }
}
