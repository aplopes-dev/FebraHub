import type {
  FiscalAdditionalInfo,
  FiscalDocumentType,
} from '../entities/fiscal-additional-info.entity';

export abstract class FiscalAdditionalInfoRepository {
  /**
   * Informações da organização, opcionalmente filtradas por tipo de documento.
   * Ordenadas por `createdAt` asc, **com desempate por `id`** — a ordem de
   * criação é a ordem de concatenação no XML (plan D1/D7), e o desempate garante
   * que empates de milissegundo saiam sempre na mesma ordem (o XML transmitido
   * não muda entre emissões).
   */
  abstract listByOrganization(
    organizationId: string,
    documentType?: FiscalDocumentType,
  ): Promise<FiscalAdditionalInfo[]>;

  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<FiscalAdditionalInfo | null>;

  abstract save(info: FiscalAdditionalInfo): Promise<FiscalAdditionalInfo>;

  abstract delete(organizationId: string, id: string): Promise<void>;

  /**
   * Contagem por tipo de documento (spec erp/023, N7) — usada pelo card
   * "Informações adicionais" em Padrões fiscais, que precisa do total sem
   * fazer uma chamada por tipo de documento.
   */
  abstract countByDocumentType(
    organizationId: string,
  ): Promise<Record<FiscalDocumentType, number>>;
}
