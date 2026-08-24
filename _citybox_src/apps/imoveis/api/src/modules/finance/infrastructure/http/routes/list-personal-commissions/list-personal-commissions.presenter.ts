import type { PersonalCommissionEntry } from '../../../../application/use-cases/list-personal-commissions/list-personal-commissions.use-case';

export class ListPersonalCommissionsPresenter {
  static toHttp(entries: PersonalCommissionEntry[]) {
    return { data: entries };
  }
}
