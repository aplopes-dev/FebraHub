export type ImageExtension = 'jpg' | 'png' | 'webp';
export type DocumentExtension = 'pdf' | 'doc' | 'docx';

export class ImoveisObjectKeyPolicy {
  static propertyPhotoKey(
    storeId: string,
    propertyId: string,
    photoId: string,
    mimeType: string,
  ): string {
    const ext = ImoveisObjectKeyPolicy.extensionFromMime(mimeType);
    return `${storeId}/properties/${propertyId}/photos/${photoId}.${ext}`;
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

  static propertyDocumentKey(
    storeId: string,
    propertyId: string,
    documentId: string,
    mimeType: string,
  ): string {
    const ext = ImoveisObjectKeyPolicy.documentExtensionFromMime(mimeType);
    return `${storeId}/properties/${propertyId}/documents/${documentId}.${ext}`;
  }

  static agentProfilePhotoKey(
    storeId: string,
    agentId: string,
    mimeType: string,
  ): string {
    const ext = ImoveisObjectKeyPolicy.extensionFromMime(mimeType);
    return `${storeId}/settings/profiles/${agentId}/photo.${ext}`;
  }

  static agentLegalDocumentKey(
    storeId: string,
    agentId: string,
    kind: string,
    documentId: string,
    mimeType: string,
  ): string {
    const ext = ImoveisObjectKeyPolicy.documentExtensionFromMime(mimeType);
    return `${storeId}/settings/profiles/${agentId}/legal/${kind}/${documentId}.${ext}`;
  }

  static leadDocumentKey(
    storeId: string,
    leadId: string,
    documentId: string,
    mimeType: string,
  ): string {
    const ext = ImoveisObjectKeyPolicy.documentExtensionFromMime(mimeType);
    return `${storeId}/leads/${leadId}/documents/${documentId}.${ext}`;
  }

  static generatedDocumentKey(
    storeId: string,
    generatedId: string,
    mimeType: string,
  ): string {
    const ext = ImoveisObjectKeyPolicy.documentExtensionFromMime(mimeType);
    return `${storeId}/documents/${generatedId}.${ext}`;
  }

  static agentFolderDocumentKey(
    storeId: string,
    agentId: string,
    documentId: string,
    mimeType: string,
  ): string {
    const ext = ImoveisObjectKeyPolicy.documentExtensionFromMime(mimeType);
    return `${storeId}/settings/profiles/${agentId}/documents/${documentId}.${ext}`;
  }

  static documentExtensionFromMime(mimeType: string): DocumentExtension {
    switch (mimeType) {
      case 'application/pdf':
        return 'pdf';
      case 'application/msword':
        return 'doc';
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'docx';
      default:
        throw new Error(`Unsupported mime type for object key: ${mimeType}`);
    }
  }
}
