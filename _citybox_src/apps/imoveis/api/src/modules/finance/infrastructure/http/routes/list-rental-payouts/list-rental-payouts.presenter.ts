import type { RentalPayoutRow } from '../../../../application/use-cases/list-rental-payouts/list-rental-payouts.use-case';

export class ListRentalPayoutsPresenter {
  static toHttp(rows: RentalPayoutRow[]) {
    return { data: rows };
  }
}
