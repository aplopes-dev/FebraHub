import type { Person, Property, PropertyStatus, PropertyType } from '@/features/shared/types';

export type ListingType = 'sale' | 'rent';

export type PropertyDocument = {
  id: string;
  name: string;
  sizeLabel: string;
  /** Path relativo autenticado (`/v1/properties/:id/documents/:documentId`). */
  path?: string;
  /** Object/data URL da sessão de upload — não persiste na API. */
  fileUrl?: string;
};

export type PropertyListing = Property & {
  listingType: ListingType;
  negotiable: boolean;
  bedrooms: number;
  floors: number;
  /** Área em m². */
  sizeSqm: number;
  yearBuilt: number;
  address: string;
  country: string;
  zipCode: string;
  mapCoordinate: string;
  /** Código interno exibido no card (ex.: Tipo C). */
  typeCode?: string;
  /** Texto do catálogo — seção "Sobre o imóvel". */
  description?: string;
  /** Diferenciais do catálogo público. */
  highlights?: readonly string[];
  /** Paths relativos autenticados (`/v1/properties/:id/photos/:photoId`) — 1ª é a capa. */
  photoUrls: readonly string[];
  documents: readonly PropertyDocument[];
  /** Corretor responsável — filtra Meu perfil; omitido nas listagens gerais = todos. */
  agentId?: string;
};

export type ListPropertiesParams = {
  search?: string;
  page?: number;
  perPage?: number;
  /** Vazio / omitido = todos. */
  status?: readonly PropertyStatus[];
  type?: readonly PropertyType[];
  listingType?: readonly ListingType[];
  /** `yes` / `no`; vazio = todos. */
  negotiable?: readonly ('yes' | 'no')[];
  /** Quando informado, retorna só imóveis deste corretor. */
  agentId?: string;
};

export type ListPropertiesResult = {
  data: readonly PropertyListing[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

export const LISTING_TYPE_LABEL: Record<ListingType, string> = {
  sale: 'À venda',
  rent: 'Para alugar',
};

export type { Person, PropertyStatus, PropertyType };
