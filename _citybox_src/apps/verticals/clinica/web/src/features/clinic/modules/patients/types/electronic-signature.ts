export type ElectronicSignatureKind =
  | 'anamnesis'
  | 'contract'
  | 'evolution_batch';

export type ElectronicSignatureStatus =
  | 'pending'
  | 'signed'
  | 'refused'
  | 'cancelled'
  | 'expired';

export type ElectronicSignerRole = 'patient' | 'responsible';

export type ElectronicSigner = {
  role: ElectronicSignerRole;
  name: string;
  email: string;
  phone: string;
  status: string;
  signUrl: string;
  whatsappUrl: string | null;
  signedAt: string | null;
};

export type ElectronicSignature = {
  id: string;
  storeId: string;
  patientId: string;
  kind: ElectronicSignatureKind;
  targetId: string | null;
  targetIds: string[] | null;
  status: ElectronicSignatureStatus;
  zapsignDocumentToken: string;
  hasSignedPdf: boolean;
  signers: ElectronicSigner[];
  requestedById: string;
  requestedByName: string;
  requestedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};
