/**
 * Solicitação de pacote de assinatura como a clinica-api a descreve
 * (`SignaturePackageRequestResponse` no presenter da vertical).
 */
export type SignaturePackageRequestDto = {
  id: string;
  storeId: string;
  packageId: string;
  quantity: number;
  priceCents: number;
  status: 'pending' | 'liberado' | 'cancelado';
  createdAt: string;
  liberatedAt: string | null;
};

/**
 * Port M2M `admin-api → clinica-api` para solicitações de pacote de assinatura.
 *
 * Só a vertical Clínica expõe esses endpoints. O platform não persiste cópia —
 * lista, libera e cancela de forma síncrona para o operador ver o status real na tela.
 */
export abstract class SignaturePackageProvisioning {
  abstract listRequests(storeId: string): Promise<SignaturePackageRequestDto[]>;

  abstract liberate(
    storeId: string,
    requestId: string,
  ): Promise<SignaturePackageRequestDto>;

  abstract cancel(
    storeId: string,
    requestId: string,
  ): Promise<SignaturePackageRequestDto>;
}
