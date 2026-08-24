import type { TerminalCatalogSnapshot } from '../../../../application/dtos/pos-catalog.dto';

export class PosCatalogPresenter {
  static toDeviceHttp(snapshot: TerminalCatalogSnapshot) {
    return {
      data: {
        categories: snapshot.categories,
        products: snapshot.products,
        addons: snapshot.addons,
        syncedAt: snapshot.syncedAt.toISOString(),
      },
    };
  }
}
