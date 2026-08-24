export class PatientFileObjectKeyPolicy {
  static fileKey(
    storeId: string,
    patientId: string,
    fileId: string,
    mimeType: string,
  ): string {
    const ext = PatientFileObjectKeyPolicy.extensionFromMime(mimeType);
    return `${storeId}/patients/${patientId}/files/${fileId}.${ext}`;
  }

  static extensionFromMime(mimeType: string): string {
    switch (mimeType) {
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      case 'image/gif':
        return 'gif';
      case 'image/jpeg':
      case 'image/jpg':
        return 'jpg';
      case 'application/pdf':
        return 'pdf';
      case 'application/msword':
        return 'doc';
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'docx';
      case 'application/vnd.ms-excel':
        return 'xls';
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return 'xlsx';
      case 'text/plain':
        return 'txt';
      default:
        return 'bin';
    }
  }
}
