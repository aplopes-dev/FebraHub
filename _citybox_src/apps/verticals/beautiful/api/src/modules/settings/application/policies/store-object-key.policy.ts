const DEFAULT_STORE_SLUG = 'estabelecimento';

export class StoreObjectKeyPolicy {
  static slugify(value: string): string {
    const slug = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return slug || DEFAULT_STORE_SLUG;
  }

  static logoKey(storeId: string, storeName: string, mimeType: string): string {
    const ext =
      mimeType === 'image/png'
        ? 'png'
        : mimeType === 'image/webp'
          ? 'webp'
          : 'jpg';
    return `${storeId}/${this.slugify(storeName)}/logo/logo.${ext}`;
  }
}
