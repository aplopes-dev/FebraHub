'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Stack, Typography } from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import { ModuleBackLink } from '@/components/ui/module-back-link';
import { useCurrentAgentId } from '@/features/shared/session/hooks/use-current-agent-id';
import {
  Modal,
  ModalActions,
  ModalCancelButton,
  ModalConfirmButton,
  ModalContent,
  ModalDescription,
  ModalScrollBody,
  ModalTitle,
} from '@/components/ui/modal';
import {
  DocumentViewerDialog,
  type ViewableDocument,
} from '@/features/shared/components/document-viewer-dialog';
import type { PropertyStatus, PropertyType } from '@/features/shared/types';
import { EMPTY_PROPERTY } from '../data/mock-data';
import {
  useDeletePropertyMutation,
  useSavePropertyWithMediaMutation,
  useUpdatePropertyMutation,
} from '../hooks/use-properties-queries';
import type {
  PropertyDocumentDraft,
  PropertyPhotoDraft,
} from '../services/properties-service';
import type { ListingType, PropertyListing } from '../types';
import { formatCostDisplay, parseCostInput } from '../utils/field-masks';
import { describePropertyApiError } from '../utils/property-api-error';
import {
  compressPropertyPhoto,
  formatFileSizeLabel,
  MAX_PROPERTY_PHOTOS,
  type PropertyPhotoProgress,
} from '../utils/property-media';
import { movePhotoToFront } from '../utils/property-media-save';
import { listingToWriteInput } from '../utils/property-form-helpers';
import {
  highlightsToText,
  textToHighlights,
} from '../utils/property-catalog-text';
import {
  PropertyFormDetails,
  type PropertyFormDetailsForm,
} from './property-form-details';
import { PropertyFormPhotos } from './property-form-photos';
import {
  PropertyPhotoViewerDialog,
  type PropertyPhotoViewerSource,
} from './property-photo-viewer-dialog';
import {
  PropertyFormDocuments,
  PropertyFormPreview,
} from './property-form-sidebar';

type PropertyFormPageProps = {
  mode: 'create' | 'edit';
  initialProperty?: PropertyListing | null;
};

type FormState = {
  name: string;
  city: string;
  state: string;
  type: PropertyType;
  units: string;
  costDisplay: string;
  status: PropertyStatus;
  occupiedUnits: string;
  listingType: ListingType;
  negotiable: boolean;
  bedrooms: string;
  floors: string;
  sizeSqm: string;
  yearBuilt: string;
  address: string;
  country: string;
  zipCode: string;
  mapCoordinate: string;
  description: string;
  highlightsText: string;
  photos: PropertyPhotoDraft[];
  documents: PropertyDocumentDraft[];
};

const MAX_DOCS = 12;
const MAX_DOC_BYTES = 15 * 1024 * 1024;

function toFormState(property: PropertyListing): FormState {
  return {
    name: property.name,
    city: property.city,
    state: property.state,
    type: property.type,
    units: String(property.units || ''),
    costDisplay: property.cost ? formatCostDisplay(property.cost) : '',
    status: property.status,
    occupiedUnits:
      property.occupiedUnits !== undefined ? String(property.occupiedUnits) : '',
    listingType: property.listingType,
    negotiable: property.negotiable,
    bedrooms: String(property.bedrooms || ''),
    floors: String(property.floors || ''),
    sizeSqm: property.sizeSqm ? String(property.sizeSqm) : '',
    yearBuilt: property.yearBuilt > 0 ? String(property.yearBuilt) : '',
    address: property.address,
    country: property.country,
    zipCode: property.zipCode,
    mapCoordinate: property.mapCoordinate ?? '',
    description: property.description ?? '',
    highlightsText: highlightsToText(property.highlights),
    photos: property.photoUrls.map((path) => ({
      key: path,
      path,
    })),
    documents: property.documents.map((doc) => ({
      key: doc.id,
      id: doc.id,
      name: doc.name,
      sizeLabel: doc.sizeLabel,
      path: doc.path,
    })),
  };
}

export function PropertyFormPage({ mode, initialProperty }: PropertyFormPageProps) {
  const router = useRouter();
  const currentAgentId = useCurrentAgentId();
  const saveMutation = useSavePropertyWithMediaMutation();
  const deleteMutation = useDeletePropertyMutation();
  const updateMutation = useUpdatePropertyMutation();
  const seed = initialProperty ?? EMPTY_PROPERTY;
  const [form, setForm] = useState<FormState>(() => toFormState(seed));
  const [initialPhotoPaths, setInitialPhotoPaths] = useState(() => [
    ...seed.photoUrls,
  ]);
  const [initialDocumentIds] = useState(() => seed.documents.map((d) => d.id));
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoProgress, setPhotoProgress] = useState<PropertyPhotoProgress | null>(
    null,
  );
  const [persistedPropertyId, setPersistedPropertyId] = useState<string | null>(
    mode === 'edit' ? seed.id : null,
  );
  const [viewerDoc, setViewerDoc] = useState<ViewableDocument | null>(null);
  const [photoViewerIndex, setPhotoViewerIndex] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reactivateConfirmOpen, setReactivateConfirmOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const title = mode === 'create' ? 'Adicionar imóvel' : 'Editar imóvel';
  const cover = form.photos[0];
  const photoViewerSources: PropertyPhotoViewerSource[] = form.photos.map(
    (photo, index) => ({
      src: photo.localPreview ?? photo.path,
      alt: `Foto ${index + 1}`,
    }),
  );

  function openPhotoViewer(index: number) {
    if (photoViewerSources.length === 0) return;
    setPhotoViewerIndex(index);
  }
  const saving =
    saveMutation.isPending ||
    deleteMutation.isPending ||
    updateMutation.isPending;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateDetails<K extends keyof PropertyFormDetailsForm>(
    key: K,
    value: PropertyFormDetailsForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Informe o nome do imóvel.');
      return;
    }

    const ownerAgentId = currentAgentId;
    if (!ownerAgentId) {
      toast.error('Aguarde a loja carregar e tente de novo.');
      return;
    }

    const payload = {
      name: form.name,
      city: form.city,
      state: form.state,
      type: form.type,
      units: Number(form.units) || 0,
      cost: parseCostInput(form.costDisplay),
      status: form.status,
      occupiedUnits:
        form.status === 'occupied' ? Number(form.occupiedUnits) || 0 : undefined,
      listingType: form.listingType,
      negotiable: form.negotiable,
      bedrooms: Number(form.bedrooms) || 0,
      floors: Number(form.floors) || 0,
      sizeSqm: Number(form.sizeSqm) || 0,
      yearBuilt: Number(form.yearBuilt) || 0,
      address: form.address,
      country: form.country,
      zipCode: form.zipCode,
      mapCoordinate: form.mapCoordinate,
      typeCode: seed.typeCode,
      description: form.description.trim(),
      highlights: textToHighlights(form.highlightsText),
      views: seed.views,
      activeLeads: seed.activeLeads,
      totalActiveLeads: seed.totalActiveLeads,
      agentId: mode === 'edit' ? (seed.agentId ?? ownerAgentId) : ownerAgentId,
    };

    try {
      const result = await saveMutation.mutateAsync({
        propertyId: persistedPropertyId,
        input: payload,
        media: {
          photos: form.photos,
          initialPhotoPaths,
          documents: form.documents,
          initialDocumentIds,
        },
        onProgress: setPhotoProgress,
      });
      setPersistedPropertyId(result.listing.id);
      setForm((current) => ({ ...current, photos: [...result.photos] }));
      setInitialPhotoPaths(
        result.photos
          .map((photo) => photo.path)
          .filter((path): path is string => Boolean(path)),
      );
      if (result.failedPhotoKeys.length > 0) {
        toast.error(
          `${result.failedPhotoKeys.length} fotos não enviadas — salve de novo para tentar`,
        );
        return;
      }
      toast.success(mode === 'create' && !persistedPropertyId ? 'Imóvel criado' : 'Alterações salvas', {
        description:
          mode === 'create' && !persistedPropertyId
            ? `${form.name} foi adicionado à lista.`
            : `Os dados de ${form.name} foram atualizados.`,
      });
      router.push('/properties');
    } catch (error) {
      toast.error('Não foi possível salvar o imóvel.', {
        description: describePropertyApiError(error),
      });
    } finally {
      setPhotoProgress(null);
    }
  }

  async function confirmDelete() {
    if (mode !== 'edit') return;
    try {
      const ok = await deleteMutation.mutateAsync(seed.id);
      if (!ok) {
        toast.error('Não foi possível excluir o imóvel.', {
          description: 'O imóvel não está mais disponível na lista.',
        });
        return;
      }
      toast.success('Imóvel excluído');
      setDeleteConfirmOpen(false);
      router.push('/properties');
    } catch (error) {
      toast.error('Não foi possível excluir o imóvel.', {
        description: describePropertyApiError(error),
      });
    }
  }

  async function confirmReactivate() {
    if (mode !== 'edit' || !seed.id) return;
    try {
      const updated = await updateMutation.mutateAsync({
        id: seed.id,
        input: listingToWriteInput(
          {
            ...seed,
            name: form.name,
            city: form.city,
            state: form.state,
            type: form.type,
            units: Number(form.units) || seed.units,
            cost: parseCostInput(form.costDisplay) || seed.cost,
            listingType: form.listingType,
            negotiable: form.negotiable,
            bedrooms: Number(form.bedrooms) || seed.bedrooms,
            floors: Number(form.floors) || seed.floors,
            sizeSqm: Number(form.sizeSqm) || seed.sizeSqm,
            yearBuilt: Number(form.yearBuilt) || seed.yearBuilt,
            address: form.address,
            country: form.country,
            zipCode: form.zipCode,
            mapCoordinate: form.mapCoordinate,
            typeCode: seed.typeCode,
            description: form.description.trim(),
            highlights: textToHighlights(form.highlightsText),
          },
          'available',
        ),
      });
      if (!updated) {
        toast.error('Não foi possível reativar o imóvel.');
        return;
      }
      setForm((current) => ({ ...current, status: 'available', occupiedUnits: '' }));
      setReactivateConfirmOpen(false);
      toast.success('Imóvel reativado como Disponível.');
    } catch (error) {
      toast.error('Não foi possível reativar o imóvel.', {
        description: describePropertyApiError(error),
      });
    }
  }

  function handleUseAsTemplate() {
    if (!seed.id) return;
    router.push(`/properties/new?from=${encodeURIComponent(seed.id)}`);
  }

  async function handlePhotoSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    const remaining = MAX_PROPERTY_PHOTOS - form.photos.length;
    if (remaining <= 0) {
      toast.error(`Limite de ${MAX_PROPERTY_PHOTOS} fotos.`);
      return;
    }

    setPhotoBusy(true);
    setPhotoProgress(null);
    const next: PropertyPhotoDraft[] = [];
    try {
      const selected = files.slice(0, remaining);
      for (let index = 0; index < selected.length; index += 1) {
        const file = selected[index];
        if (!file) continue;
        setPhotoProgress({
          phase: 'compress',
          current: index + 1,
          total: selected.length,
        });
        const compressed = await compressPropertyPhoto(file);
        next.push({
          key: `local-${crypto.randomUUID()}`,
          localPreview: URL.createObjectURL(compressed),
          file: compressed,
        });
      }
      toast.success(
        next.length === 1 ? 'Foto adicionada' : `${next.length} fotos adicionadas`,
      );
    } catch (error) {
      toast.error('Não foi possível enviar a foto', {
        description: error instanceof Error ? error.message : 'Tente outra imagem.',
      });
    } finally {
      if (next.length > 0) {
        update('photos', [...form.photos, ...next]);
      }
      setPhotoBusy(false);
      setPhotoProgress(null);
    }
  }

  function handleRemovePhoto(index: number) {
    const photo = form.photos[index];
    if (photo?.localPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(photo.localPreview);
    }
    update(
      'photos',
      form.photos.filter((_, i) => i !== index),
    );
  }

  function handleDocSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (form.documents.length >= MAX_DOCS) {
      toast.error(`Limite de ${MAX_DOCS} documentos.`);
      return;
    }

    if (file.size > MAX_DOC_BYTES) {
      toast.error('Arquivo muito grande', {
        description: 'O limite é 15 MB.',
      });
      return;
    }

    const allowed = /\.(pdf|docx?)$/i.test(file.name);
    if (!allowed) {
      toast.error('Formato inválido', {
        description: 'Envie PDF ou DOCX.',
      });
      return;
    }

    const draft: PropertyDocumentDraft = {
      key: `local-${crypto.randomUUID()}`,
      name: file.name,
      sizeLabel: formatFileSizeLabel(file.size),
      file,
    };
    update('documents', [...form.documents, draft]);
    toast.success('Documento adicionado', {
      description: 'Salve o imóvel para enviar o arquivo.',
    });
  }

  function handleRemoveDoc(key: string) {
    update(
      'documents',
      form.documents.filter((doc) => doc.key !== key),
    );
  }

  function renderPreview() {
    return (
      <PropertyFormPreview
        seedId={seed.id}
        name={form.name}
        city={form.city}
        state={form.state}
        costDisplay={form.costDisplay}
        sizeSqm={form.sizeSqm}
        type={form.type}
        units={form.units}
        status={form.status}
        occupiedUnits={form.occupiedUnits}
        agentId={
          mode === 'edit' ? (seed.agentId ?? currentAgentId) : currentAgentId
        }
        cover={cover}
        onCoverClick={
          photoViewerSources.length > 0 ? () => openPhotoViewer(0) : undefined
        }
      />
    );
  }

  function renderDocuments() {
    return (
      <PropertyFormDocuments
        documents={form.documents}
        docInputRef={docInputRef}
        onDocSelected={handleDocSelected}
        onRemoveDoc={handleRemoveDoc}
        onOpenDoc={(doc) =>
          setViewerDoc({
            name: doc.name,
            sizeLabel: doc.sizeLabel,
            path: doc.path,
            file: doc.file,
          })
        }
      />
    );
  }

  function renderPhotos() {
    return (
      <PropertyFormPhotos
        photos={form.photos}
        maxPhotos={MAX_PROPERTY_PHOTOS}
        photoBusy={photoBusy || saving}
        photoProgress={photoProgress}
        photoInputRef={photoInputRef}
        onPhotoSelected={handlePhotoSelected}
        onRemovePhoto={handleRemovePhoto}
        onReorderPhotos={(photos) => update('photos', [...photos])}
        onUseAsCover={(index) => update('photos', movePhotoToFront(form.photos, index))}
        onUploadClick={() => photoInputRef.current?.click()}
        onPhotoClick={openPhotoViewer}
      />
    );
  }

  function renderDetails() {
    return (
      <PropertyFormDetails
        mode={mode}
        form={form}
        saving={saving}
        onChange={updateDetails}
        onSave={handleSave}
        onDelete={() => setDeleteConfirmOpen(true)}
        onReactivate={
          mode === 'edit' && form.status !== 'available'
            ? () => setReactivateConfirmOpen(true)
            : undefined
        }
        onUseAsTemplate={
          mode === 'edit' && form.status !== 'available'
            ? handleUseAsTemplate
            : undefined
        }
      />
    );
  }

  return (
    <Stack spacing={2.5} sx={{ minWidth: 0 }}>
      <ModuleBackLink href="/properties" label="Voltar para imóveis" />

      <Typography
        component="h1"
        sx={{
          fontSize: '2rem',
          fontWeight: 500,
          letterSpacing: '-0.02em',
          lineHeight: 1.4,
        }}
      >
        {title}
      </Typography>

      {/* Mobile: ordem linear */}
      <Stack spacing={2.5} sx={{ minWidth: 0, display: { xs: 'flex', lg: 'none' } }}>
        {renderPhotos()}
        {renderPreview()}
        {renderDocuments()}
        {renderDetails()}
      </Stack>

      {/* Desktop: colunas independentes — fotos empurram só os blocos à direita */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          gap: 2.5,
          alignItems: 'flex-start',
          minWidth: 0,
        }}
      >
        <Stack spacing={2.5} sx={{ width: 340, flexShrink: 0, minWidth: 0 }}>
          {renderPreview()}
          {renderDocuments()}
        </Stack>
        <Stack spacing={2.5} sx={{ flex: 1, minWidth: 0 }}>
          {renderPhotos()}
          {renderDetails()}
        </Stack>
      </Box>

      <DocumentViewerDialog
        open={viewerDoc !== null}
        document={viewerDoc}
        onOpenChange={(open) => {
          if (!open) setViewerDoc(null);
        }}
      />

      <PropertyPhotoViewerDialog
        open={photoViewerIndex !== null}
        photos={photoViewerSources}
        index={photoViewerIndex ?? 0}
        onIndexChange={setPhotoViewerIndex}
        onOpenChange={(open) => {
          if (!open) setPhotoViewerIndex(null);
        }}
      />

      <Modal
        open={reactivateConfirmOpen}
        onClose={() => {
          if (updateMutation.isPending) return;
          setReactivateConfirmOpen(false);
        }}
        maxWidth="xs"
        fullWidth
      >
        <ModalScrollBody>
          <ModalTitle>Reativar imóvel?</ModalTitle>
          <ModalContent>
            <ModalDescription>
              Marcar este imóvel como Disponível? Ele voltará a aparecer na
              escolha de novos negócios.
            </ModalDescription>
          </ModalContent>
          <ModalActions>
            <ModalCancelButton
              disabled={updateMutation.isPending}
              onClick={() => setReactivateConfirmOpen(false)}
            />
            <ModalConfirmButton
              disabled={updateMutation.isPending}
              onClick={confirmReactivate}
            >
              {updateMutation.isPending ? 'Reativando…' : 'Reativar'}
            </ModalConfirmButton>
          </ModalActions>
        </ModalScrollBody>
      </Modal>

      <Modal
        open={deleteConfirmOpen}
        onClose={() => {
          if (deleteMutation.isPending) return;
          setDeleteConfirmOpen(false);
        }}
        maxWidth="xs"
        fullWidth
      >
        <ModalScrollBody>
          <ModalTitle>Excluir imóvel?</ModalTitle>
          <ModalContent>
            <ModalDescription>
              Tem certeza que deseja excluir{' '}
              <Box component="span" sx={{ fontWeight: 600 }}>
                {form.name || 'este imóvel'}
              </Box>
              ? Esta ação não pode ser desfeita.
            </ModalDescription>
          </ModalContent>
          <ModalActions>
            <ModalCancelButton
              disabled={deleteMutation.isPending}
              onClick={() => setDeleteConfirmOpen(false)}
            />
            <ModalConfirmButton
              color="error"
              disabled={deleteMutation.isPending}
              onClick={confirmDelete}
            >
              {deleteMutation.isPending ? 'Excluindo…' : 'Excluir'}
            </ModalConfirmButton>
          </ModalActions>
        </ModalScrollBody>
      </Modal>
    </Stack>
  );
}
