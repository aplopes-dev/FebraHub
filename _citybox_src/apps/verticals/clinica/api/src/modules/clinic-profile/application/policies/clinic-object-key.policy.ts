export type ImageExtension = 'jpg' | 'png' | 'webp';

export class ClinicObjectKeyPolicy {
  static logoKey(storeId: string, mimeType: string): string {
    const ext = ClinicObjectKeyPolicy.extensionFromMime(mimeType);
    return `${storeId}/clinic-logo.${ext}`;
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
