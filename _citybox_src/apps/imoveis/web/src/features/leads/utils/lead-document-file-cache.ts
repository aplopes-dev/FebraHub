/** Cache em memória do `File` original por id de documento (sessão do formulário). */
const fileByDocumentId = new Map<string, File>();

export function cacheLeadDocumentFile(documentId: string, file: File): void {
  fileByDocumentId.set(documentId, file);
}

export function getCachedLeadDocumentFile(documentId: string): File | undefined {
  return fileByDocumentId.get(documentId);
}

export function removeCachedLeadDocumentFile(documentId: string): void {
  fileByDocumentId.delete(documentId);
}

export function clearLeadDocumentFileCache(): void {
  fileByDocumentId.clear();
}
