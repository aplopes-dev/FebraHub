import type { PropertyEntity } from '../entities/property.entity';
import type {
  ApiListingType,
  ApiPropertyStatus,
  ApiPropertyType,
} from '../mappers/property-enum.mapper';

export type ListPropertiesFilters = {
  page: number;
  perPage: number;
  search?: string;
  status?: ApiPropertyStatus[];
  type?: ApiPropertyType[];
  listingType?: ApiListingType[];
  negotiable?: ('yes' | 'no')[];
  agentId?: string;
};

export type ListPropertiesResult = {
  items: PropertyEntity[];
  total: number;
};

export type PropertyActiveLeadInput = {
  id: string;
  name: string;
  initials: string;
};

export type PropertyWritePayload = {
  storeId: string;
  name: string;
  city?: string;
  state?: string;
  type: ApiPropertyType;
  units?: number;
  cost?: number;
  views?: number;
  status: ApiPropertyStatus;
  occupiedUnits?: number | null;
  listingType: ApiListingType;
  negotiable?: boolean;
  bedrooms?: number;
  floors?: number;
  sizeSqm?: number;
  yearBuilt?: number;
  address?: string;
  country?: string;
  zipCode?: string;
  mapCoordinate?: string;
  typeCode?: string | null;
  description?: string;
  highlights?: readonly string[];
  totalActiveLeads?: number;
  agentId?: string | null;
  activeLeads?: PropertyActiveLeadInput[];
};

export type PropertyPhotoRecord = {
  id: string;
  objectKey: string;
  mimeType: string;
  sortOrder: number;
};

export type PropertyDocumentRecord = {
  id: string;
  name: string;
  sizeLabel: string;
  objectKey: string | null;
  mimeType: string;
};

export abstract class PropertyRepository {
  abstract findMany(
    storeId: string,
    filters: ListPropertiesFilters,
  ): Promise<ListPropertiesResult>;

  abstract findById(
    storeId: string,
    id: string,
  ): Promise<PropertyEntity | null>;

  /** Link curto `/p/:id` — id do imóvel é UUID global. */
  abstract findByIdGlobal(id: string): Promise<PropertyEntity | null>;

  abstract create(payload: PropertyWritePayload): Promise<PropertyEntity>;

  abstract update(
    storeId: string,
    id: string,
    payload: Omit<PropertyWritePayload, 'storeId'>,
  ): Promise<PropertyEntity | null>;

  abstract updateAvailability(
    storeId: string,
    id: string,
    status: ApiPropertyStatus,
    options?: {
      agentIdIfUnset?: string;
      occupiedUnits?: number | null;
    },
  ): Promise<PropertyEntity | null>;

  abstract delete(storeId: string, id: string): Promise<boolean>;

  abstract syncAgentCatalog(
    storeId: string,
    agentId: string,
    propertyIds: string[],
    fallbackAgentId: string,
  ): Promise<void>;

  /**
   * Atribui imóveis com `agentId` nulo ou fora de `validAgentIds` a
   * `assignToAgentIds` (round-robin se vários; em geral só admins).
   */
  abstract reassignOrphanAgentIds(
    storeId: string,
    options: {
      validAgentIds: readonly string[];
      assignToAgentIds: readonly string[];
    },
  ): Promise<number>;

  /**
   * Move imóveis de `fromAgentIds` para `toAgentId` (cura do round-robin que
   * deu inventário legado a corretores).
   */
  abstract rehomePropertiesToAgent(
    storeId: string,
    fromAgentIds: readonly string[],
    toAgentId: string,
  ): Promise<number>;

  /**
   * Flag persistente: já devolveu inventário de corretores → admin
   * (evita roubar catálogo legítimo do corretor em visitas futuras).
   */
  abstract isCatalogOwnershipHealed(storeId: string): Promise<boolean>;

  abstract markCatalogOwnershipHealed(storeId: string): Promise<void>;

  abstract addPhoto(
    storeId: string,
    propertyId: string,
    photo: {
      id: string;
      objectKey: string;
      mimeType: string;
    },
  ): Promise<PropertyEntity | null>;

  abstract reorderPhotos(
    storeId: string,
    propertyId: string,
    photoIds: readonly string[],
  ): Promise<PropertyEntity | null>;

  abstract findPhoto(
    storeId: string,
    propertyId: string,
    photoId: string,
  ): Promise<PropertyPhotoRecord | null>;

  abstract removePhoto(
    storeId: string,
    propertyId: string,
    photoId: string,
  ): Promise<PropertyPhotoRecord | null>;

  abstract addDocument(
    storeId: string,
    propertyId: string,
    document: {
      id: string;
      name: string;
      sizeLabel: string;
      objectKey: string;
      mimeType: string;
    },
  ): Promise<PropertyEntity | null>;

  abstract findDocument(
    storeId: string,
    propertyId: string,
    documentId: string,
  ): Promise<PropertyDocumentRecord | null>;

  abstract removeDocument(
    storeId: string,
    propertyId: string,
    documentId: string,
  ): Promise<PropertyDocumentRecord | null>;
}
