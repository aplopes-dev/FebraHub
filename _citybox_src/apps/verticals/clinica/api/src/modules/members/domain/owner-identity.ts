/**
 * Derivação da identidade do **responsável pela organização** a partir do que o evento
 * `citybox.store.created.v1` carrega (`owner.responsibleName` e `owner.billingEmail`).
 *
 * Funções puras de propósito: o provisionamento fala com Keycloak e Postgres, mas a
 * regra de "como vira nome e username" é decidível sem I/O e, portanto, testável direto.
 */

/** `Member.username` é `@unique` global e o Keycloak também limita o tamanho. */
const USERNAME_MAX_LENGTH = 60;
/** Espaço reservado para o sufixo numérico de desempate (`.99`). */
const USERNAME_BASE_MAX_LENGTH = 50;
/** Mesmo mínimo do `CreateMemberBodyDto` — abaixo disso o username fica ilegível. */
const USERNAME_MIN_LENGTH = 3;
/**
 * Teto de tentativas de desempate. Não é performance: é evitar laço infinito se o probe
 * de disponibilidade estiver quebrado (ex.: Keycloak devolvendo "existe" para tudo).
 */
const MAX_USERNAME_ATTEMPTS = 50;

export type OwnerName = {
  firstName: string;
  /**
   * Vazio quando o responsável informou um nome só. **Não** inventamos sobrenome: um
   * sobrenome falso vira dado errado no cadastro e no Keycloak para sempre.
   */
  lastName: string;
};

/**
 * Divide `responsibleName` em primeiro/último nome.
 *
 * Retorna `null` quando não sobra nada utilizável — o chamador trata isso como
 * "organização sem responsável" e segue, em vez de derrubar o provisionamento.
 */
export function splitResponsibleName(
  raw: string | null | undefined,
): OwnerName | null {
  const parts = (raw ?? '')
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);

  if (parts.length === 0) return null;
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };

  return {
    firstName: parts[0],
    // Tudo depois do primeiro nome vira sobrenome — "Ana Maria da Silva" preserva
    // "Maria da Silva" em vez de descartar os nomes do meio.
    lastName: parts.slice(1).join(' '),
  };
}

/** Minúsculas, sem acento, só `[a-z0-9._-]`, sem separador duplicado nem nas pontas. */
export function normalizeUsername(raw: string): string {
  return (
    raw
      .normalize('NFD')
      // Remove os diacríticos que o NFD separou (bloco Combining Diacritical Marks).
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '.')
      .replace(/[._-]{2,}/g, '.')
      .replace(/^[._-]+|[._-]+$/g, '')
      .slice(0, USERNAME_BASE_MAX_LENGTH)
      .replace(/[._-]+$/, '')
  );
}

export type OwnerUsernameSeed = {
  email: string | null;
  name: OwnerName;
  /** Só usado no último fallback, para o username continuar determinístico. */
  storeId: string;
};

/**
 * Base do username: parte antes do `@` do e-mail de cobrança, senão o nome.
 *
 * O e-mail vem primeiro porque é o que o responsável já usa e reconhece; o nome só entra
 * quando o e-mail é ausente ou não sobrevive à normalização (ex.: e-mail só com acentos).
 */
export function buildOwnerUsernameBase(seed: OwnerUsernameSeed): string {
  const emailLocalPart = (seed.email ?? '').split('@')[0] ?? '';
  const fromEmail = normalizeUsername(emailLocalPart);
  if (fromEmail.length >= USERNAME_MIN_LENGTH) return fromEmail;

  const fromName = normalizeUsername(
    [seed.name.firstName, seed.name.lastName].filter(Boolean).join('.'),
  );
  if (fromName.length >= USERNAME_MIN_LENGTH) return fromName;

  // Nem e-mail nem nome sobreviveram (ex.: nome inteiro em alfabeto não-latino).
  // Determinístico pelo storeId para o retry gerar o mesmo username, e não um novo.
  return `responsavel.${seed.storeId.slice(0, 8)}`;
}

/**
 * Resolve o primeiro username livre a partir da base, com sufixo numérico determinístico
 * (`maria.silva`, `maria.silva2`, `maria.silva3`, …).
 *
 * O sufixo é sequencial, e não aleatório, para que reprocessar o mesmo evento chegue no
 * mesmo nome — e para o operador conseguir prever o que vai aparecer na tela.
 *
 * `isTaken` deve cobrir **os dois** lados da unicidade: `Member.username` é `@unique`
 * global no schema `clinica` e o username do Keycloak é único no realm. Checar só um
 * deles faria a criação estourar no outro.
 */
export async function resolveAvailableUsername(
  base: string,
  isTaken: (candidate: string) => Promise<boolean>,
): Promise<string> {
  for (let attempt = 1; attempt <= MAX_USERNAME_ATTEMPTS; attempt += 1) {
    const candidate = (attempt === 1 ? base : `${base}${attempt}`).slice(
      0,
      USERNAME_MAX_LENGTH,
    );
    if (!(await isTaken(candidate))) return candidate;
  }

  throw new Error(
    `Não foi possível derivar um username livre a partir de "${base}" após ${MAX_USERNAME_ATTEMPTS} tentativas`,
  );
}

/**
 * E-mail **só no Keycloak** quando o `billingEmail` já está ligado a outro `Member`
 * (`keycloak_sub` é `@unique` global em `clinica.members`).
 *
 * O cadastro local continua com o e-mail real de cobrança; aqui usamos `+clinic{store}`
 * (plus-addressing) para o Keycloak criar um usuário novo sem colidir no realm.
 */
export function buildDedicatedOwnerKeycloakEmail(
  billingEmail: string | null | undefined,
  storeId: string,
): string {
  const suffix = storeId.replace(/-/g, '').slice(0, 8).toLowerCase();
  const trimmed = billingEmail?.trim();
  if (trimmed?.includes('@')) {
    const at = trimmed.indexOf('@');
    const local = trimmed.slice(0, at);
    const domain = trimmed.slice(at + 1);
    return `${local}+clinic${suffix}@${domain}`.toLowerCase();
  }
  return `owner.${suffix}@clinic.citybox.local`;
}
