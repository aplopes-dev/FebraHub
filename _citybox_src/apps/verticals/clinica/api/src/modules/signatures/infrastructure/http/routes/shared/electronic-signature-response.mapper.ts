import type { ElectronicSignature } from '../../../../domain/entities/electronic-signature.entity';
import { buildWhatsAppUrl } from '../../../../application/utils/signature-helpers';

export function toElectronicSignatureResponse(signature: ElectronicSignature) {
  return {
    id: signature.id,
    storeId: signature.storeId,
    patientId: signature.patientId,
    kind: signature.kind,
    targetId: signature.targetId,
    targetIds: signature.targetIds,
    status: signature.status,
    zapsignDocumentToken: signature.zapsignDocumentToken,
    hasSignedPdf: signature.signedPdfObjectKey !== null,
    signers: signature.signers.map((signer) => ({
      role: signer.role,
      name: signer.name,
      email: signer.email,
      phone: signer.phone,
      status: signer.status,
      signUrl: signer.signUrl,
      whatsappUrl: signer.phone
        ? buildWhatsAppUrl(
            signer.phone,
            `Olá${signer.name ? ` ${signer.name}` : ''}, acesse o link para assinar o documento: ${signer.signUrl}`,
          )
        : null,
      signedAt: signer.signedAt,
    })),
    requestedById: signature.requestedById,
    requestedByName: signature.requestedByName,
    requestedAt: signature.requestedAt.toISOString(),
    completedAt: signature.completedAt?.toISOString() ?? null,
    cancelledAt: signature.cancelledAt?.toISOString() ?? null,
    createdAt: signature.createdAt.toISOString(),
    updatedAt: signature.updatedAt.toISOString(),
  };
}
