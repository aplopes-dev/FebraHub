/** Rotas dos lembretes do painel (dashboard / leads / agenda). */

export type ReminderKind =
  | 'follow-up'
  | 'visit'
  | 'signing'
  | 'other'
  | 'expiring'
  | 'new-lead'
  | 'document';

export type ReminderItem = {
  kind: ReminderKind;
  title: string;
  description: string;
  progress: number;
  people?: readonly { id: string; name: string; initials: string }[];
  totalPeople?: number;
  isHighlighted?: boolean;
  /** Sobrescreve o destino padrão de `kind` (ex.: follow-up de compromisso → agenda). */
  href?: string;
};

/** Destino ao clicar no lembrete ou no item do modal. */
export function hrefForReminderKind(kind: ReminderKind): string {
  switch (kind) {
    case 'follow-up':
    case 'new-lead':
      return '/leads';
    case 'visit':
    case 'signing':
    case 'other':
      return '/calendar';
    case 'expiring':
      return '/properties';
    case 'document':
      return '/leads';
    default:
      return '/';
  }
}

export function hrefForReminder(item: Pick<ReminderItem, 'kind' | 'href'>): string {
  return item.href ?? hrefForReminderKind(item.kind);
}

export function reminderKindLabel(kind: ReminderKind): string {
  switch (kind) {
    case 'follow-up':
      return 'Abrir leads para follow-up';
    case 'new-lead':
      return 'Abrir lead novo';
    case 'visit':
      return 'Abrir agenda de visitas';
    case 'signing':
      return 'Abrir agenda de assinaturas';
    case 'other':
      return 'Abrir agenda';
    case 'expiring':
      return 'Abrir imóveis com anúncios';
    case 'document':
      return 'Abrir documentos da negociação';
    default:
      return 'Abrir';
  }
}
