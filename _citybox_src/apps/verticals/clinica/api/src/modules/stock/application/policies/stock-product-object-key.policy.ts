export class StockProductObjectKeyPolicy {
  static photoKey(
    storeId: string,
    productId: string,
    mimeType: string,
  ): string {
    const ext = StockProductObjectKeyPolicy.extensionFromMime(mimeType);
    return `${storeId}/stock-products/${productId}.${ext}`;
  }

  static extensionFromMime(mimeType: string): 'jpg' | 'png' | 'webp' {
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
