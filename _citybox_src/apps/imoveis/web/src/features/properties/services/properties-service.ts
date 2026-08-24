/**
 * Porta de entrada de dados da feature properties — consome imoveis-api.
 */
import { OTHER_AGENT_ID } from '@/features/shared/constants/agents';
import {
  ImoveisApiError,
  imoveisFetch,
  imoveisUpload,
} from '@/lib/imoveis-api';
import type {
  ListPropertiesParams,
  ListPropertiesResult,
  PropertyListing,
} from '../types';
import type { PropertyStatus, PropertyType } from '@/features/shared/types';
import type { ListingType } from '../types';
import { photoIdFromPath } from '../utils/property-media';
import type { PropertyPhotoProgress } from '../utils/property-media';
import {
  draftsFromPhotoUrls,
  firstNewPhotoPath,
  markPhotoUploadFailed,
  markPhotoUploaded,
  photoIdsInFormOrder,
} from '../utils/property-media-save';

export type PropertyWriteInput = {
  name: string;
  city: string;
  state: string;
  type: PropertyType;
  units: number;
  cost: number;
  status: PropertyStatus;
  occupiedUnits?: number;
  listingType: ListingType;
  negotiable: boolean;
  bedrooms: number;
  floors: number;
  sizeSqm: number;
  yearBuilt: number;
  address: string;
  country: string;
  zipCode: string;
  mapCoordinate: string;
  typeCode?: string;
  description?: string;
  highlights?: readonly string[];
  views?: number;
  activeLeads?: readonly { id: string; name: string; initials: string }[];
  totalActiveLeads?: number;
  agentId?: string;
};

/** Estado de galeria no form — arquivos locais + paths já persistidos. */
export type PropertyPhotoDraft = {
  key: string;
  /** Path relativo da API quando já existe no servidor. */
  path?: string;
  /** Preview local (blob:) de arquivo ainda não enviado. */
  localPreview?: string;
  file?: File;
  /** Último save falhou neste arquivo; o retry reenvia o `file`. */
  uploadFailed?: boolean;
};

/** Estado de documentos no form — arquivos locais + registros já persistidos. */
export type PropertyDocumentDraft = {
  key: string;
  name: string;
  sizeLabel: string;
  /** Id na API quando já existe no servidor. */
  id?: string;
  /** Path relativo autenticado quando já existe no servidor. */
  path?: string;
  /** Arquivo ainda não enviado. */
  file?: File;
};

export type PropertyMediaDrafts = {
  photos: readonly PropertyPhotoDraft[];
  initialPhotoPaths: readonly string[];
  documents: readonly PropertyDocumentDraft[];
  initialDocumentIds: readonly string[];
};

function csv(values?: readonly string[]): string | undefined {
  if (!values || values.length === 0) return undefined;
  return values.join(',');
}

function buildListQuery(params: ListPropertiesParams): string {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.perPage) q.set('perPage', String(params.perPage));
  if (params.search?.trim()) q.set('search', params.search.trim());
  const status = csv(params.status);
  if (status) q.set('status', status);
  const type = csv(params.type);
  if (type) q.set('type', type);
  const listingType = csv(params.listingType);
  if (listingType) q.set('listingType', listingType);
  const negotiable = csv(params.negotiable);
  if (negotiable) q.set('negotiable', negotiable);
  if (params.agentId) q.set('agentId', params.agentId);
  const qs = q.toString();
  return qs ? `?${qs}` : '';
}

function toWriteBody(input: PropertyWriteInput) {
  return {
    name: input.name,
    city: input.city,
    state: input.state,
    type: input.type,
    units: input.units,
    cost: input.cost,
    status: input.status,
    occupiedUnits: input.occupiedUnits,
    listingType: input.listingType,
    negotiable: input.negotiable,
    bedrooms: input.bedrooms,
    floors: input.floors,
    sizeSqm: input.sizeSqm,
    yearBuilt: input.yearBuilt,
    address: input.address,
    country: input.country,
    zipCode: input.zipCode,
    mapCoordinate: input.mapCoordinate,
    typeCode: input.typeCode,
    description: input.description,
    highlights: input.highlights ? [...input.highlights] : undefined,
    views: input.views,
    activeLeads: input.activeLeads,
    totalActiveLeads: input.totalActiveLeads,
    agentId: input.agentId,
  };
}

export async function listProperties(
  params: ListPropertiesParams = {},
): Promise<ListPropertiesResult> {
  return imoveisFetch<ListPropertiesResult>(
    `/v1/properties${buildListQuery(params)}`,
  );
}

export async function getPropertyById(
  id: string,
): Promise<PropertyListing | null> {
  try {
    const res = await imoveisFetch<{ data: PropertyListing }>(
      `/v1/properties/${id}`,
    );
    return res.data;
  } catch (err) {
    if (err instanceof ImoveisApiError && err.status === 404) return null;
    throw err;
  }
}

export async function createProperty(
  input: PropertyWriteInput,
): Promise<PropertyListing> {
  const res = await imoveisFetch<{ data: PropertyListing }>('/v1/properties', {
    method: 'POST',
    body: JSON.stringify(toWriteBody(input)),
  });
  return res.data;
}

export async function updateProperty(
  id: string,
  input: PropertyWriteInput,
): Promise<PropertyListing | null> {
  try {
    const res = await imoveisFetch<{ data: PropertyListing }>(
      `/v1/properties/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(toWriteBody(input)),
      },
    );
    return res.data;
  } catch (err) {
    if (err instanceof ImoveisApiError && err.status === 404) return null;
    throw err;
  }
}

export async function deleteProperty(id: string): Promise<boolean> {
  try {
    await imoveisFetch<void>(`/v1/properties/${id}`, { method: 'DELETE' });
    return true;
  } catch (err) {
    if (err instanceof ImoveisApiError && err.status === 404) return false;
    throw err;
  }
}

export async function uploadPropertyPhoto(
  propertyId: string,
  file: File,
): Promise<PropertyListing> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await imoveisUpload<{ data: PropertyListing }>(
    `/v1/properties/${propertyId}/photos`,
    formData,
  );
  return res.data;
}

export async function deletePropertyPhoto(
  propertyId: string,
  photoId: string,
): Promise<PropertyListing> {
  const res = await imoveisFetch<{ data: PropertyListing }>(
    `/v1/properties/${propertyId}/photos/${photoId}`,
    { method: 'DELETE' },
  );
  return res.data;
}

export async function uploadPropertyDocument(
  propertyId: string,
  file: File,
): Promise<PropertyListing> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', file.name);
  const res = await imoveisUpload<{ data: PropertyListing }>(
    `/v1/properties/${propertyId}/documents`,
    formData,
  );
  return res.data;
}

export async function deletePropertyDocument(
  propertyId: string,
  documentId: string,
): Promise<PropertyListing> {
  const res = await imoveisFetch<{ data: PropertyListing }>(
    `/v1/properties/${propertyId}/documents/${documentId}`,
    { method: 'DELETE' },
  );
  return res.data;
}

export async function reorderPropertyPhotos(
  propertyId: string,
  photoIds: readonly string[],
): Promise<PropertyListing> {
  const res = await imoveisFetch<{ data: PropertyListing }>(
    `/v1/properties/${propertyId}/photos/order`,
    {
      method: 'PUT',
      body: JSON.stringify({ photoIds: [...photoIds] }),
    },
  );
  return res.data;
}

export type SavePropertyWithMediaResult = {
  listing: PropertyListing;
  photos: PropertyPhotoDraft[];
  failedPhotoKeys: readonly string[];
};

/**
 * Persiste metadados do imóvel e sincroniza mídia (uploads multipart + deletes).
 * Falha de uma foto não aborta as demais; o caller reenvia só quem ainda tem `file`.
 */
export async function savePropertyWithMedia(
  propertyId: string | null,
  input: PropertyWriteInput,
  media: PropertyMediaDrafts,
  onProgress?: (progress: PropertyPhotoProgress) => void,
): Promise<SavePropertyWithMediaResult> {
  const saved = propertyId
    ? await updateProperty(propertyId, input)
    : await createProperty(input);
  if (!saved) {
    throw new ImoveisApiError(404, 'Imóvel não encontrado');
  }

  const keptPaths = new Set(
    media.photos.map((p) => p.path).filter((p): p is string => Boolean(p)),
  );
  for (const path of media.initialPhotoPaths) {
    if (keptPaths.has(path)) continue;
    const photoId = photoIdFromPath(path);
    if (photoId) await deletePropertyPhoto(saved.id, photoId);
  }

  const keptDocumentIds = new Set(
    media.documents.map((d) => d.id).filter((id): id is string => Boolean(id)),
  );

  let latest = saved;
  for (const documentId of media.initialDocumentIds) {
    if (keptDocumentIds.has(documentId)) continue;
    latest = await deletePropertyDocument(saved.id, documentId);
  }

  let photos: PropertyPhotoDraft[] = media.photos.map((photo) => ({
    ...photo,
    uploadFailed: false,
  }));
  const pending = photos.filter((photo) => photo.file);
  const failedPhotoKeys: string[] = [];
  let uploadedCount = 0;
  for (const photo of pending) {
    if (!photo.file) continue;
    onProgress?.({
      phase: 'upload',
      current: uploadedCount + 1,
      total: pending.length,
    });
    const knownPaths = new Set(
      photos.map((item) => item.path).filter((path): path is string => Boolean(path)),
    );
    try {
      latest = await uploadPropertyPhoto(saved.id, photo.file);
      const newPath = firstNewPhotoPath(knownPaths, latest.photoUrls);
      if (newPath) {
        photos = markPhotoUploaded(photos, photo.key, newPath);
      }
      uploadedCount += 1;
    } catch {
      photos = markPhotoUploadFailed(photos, photo.key);
      failedPhotoKeys.push(photo.key);
      uploadedCount += 1;
    }
  }

  for (const document of media.documents) {
    if (!document.file) continue;
    latest = await uploadPropertyDocument(saved.id, document.file);
  }

  const orderedIds = photoIdsInFormOrder(photos);
  if (orderedIds.length > 0) {
    latest = await reorderPropertyPhotos(saved.id, orderedIds);
  }

  const failedLocals = photos.filter((photo) => Boolean(photo.file));
  photos = [
    ...draftsFromPhotoUrls(latest.photoUrls),
    ...failedLocals.filter((photo) => !photo.path),
  ];

  return { listing: latest, photos, failedPhotoKeys };
}

export async function syncAgentCatalogProperties(
  agentId: string,
  selectedIds: readonly string[],
): Promise<void> {
  await imoveisFetch<void>(`/v1/agents/${agentId}/properties`, {
    method: 'PUT',
    body: JSON.stringify({
      propertyIds: [...selectedIds],
      fallbackAgentId: OTHER_AGENT_ID,
    }),
  });
}
