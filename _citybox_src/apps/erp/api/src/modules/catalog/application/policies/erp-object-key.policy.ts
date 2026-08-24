export type ImageExtension = 'jpg' | 'png' | 'webp';

/**
 * Convenção de keys no bucket `erp`:
 * `{organizationId}/catalogo/products/{productId}.{ext}`
 */
export class ErpObjectKeyPolicy {
  static productImageKey(
    organizationId: string,
    productId: string,
    mimeType: string,
  ): string {
    const ext = ErpObjectKeyPolicy.extensionFromMime(mimeType);
    return `${organizationId}/catalogo/products/${productId}.${ext}`;
  }

  static variationOptionImageKey(
    organizationId: string,
    variationId: string,
    optionId: string,
    mimeType: string,
  ): string {
    const ext = ErpObjectKeyPolicy.extensionFromMime(mimeType);
    return `${organizationId}/catalogo/variations/${variationId}/options/${optionId}.${ext}`;
  }

  static extensionFromMime(mimeType: string): ImageExtension {
    switch (mimeType) {
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      case 'image/jpeg':
      case 'image/jpg':
        return 'jpg';
      default:
        throw new Error(`Unsupported mime type for object key: ${mimeType}`);
    }
  }
}
