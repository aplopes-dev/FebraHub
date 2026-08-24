'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type RefObject, type ReactNode } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AddIcon from '@mui/icons-material/Add';
import CollectionsOutlinedIcon from '@mui/icons-material/CollectionsOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined';
import type { SxProps, Theme } from '@mui/material/styles';
import { Badge, Box, IconButton, Typography } from '@citybox/mui/atoms';
import { Panel } from '@/components/ui/panel';
import {
  CATALOG_GALLERY_MAX_VISIBLE,
  getCatalogGalleryDisplay,
} from '@/features/shared/utils/catalog-gallery-display';
import {
  photoActionIconCircleSx,
  photoActionTileBaseSx,
  photoActionTileOutlineSx,
  photoGalleryGridSx,
  photoOpenButtonSx,
  photoTileSx,
} from '@/features/shared/utils/photo-gallery-styles';
import type { PropertyPhotoDraft } from '../services/properties-service';
import {
  PROPERTY_PHOTO_FILE_ACCEPT,
  photoProgressLabel,
  propertyPhotosCaption,
  type PropertyPhotoProgress,
} from '../utils/property-media';
import { AuthPropertyPhoto } from './auth-property-photo';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import { listifyError } from './property-form-styles';

type PropertyFormPhotosProps = {
  photos: readonly PropertyPhotoDraft[];
  maxPhotos: number;
  photoBusy: boolean;
  photoProgress: PropertyPhotoProgress | null;
  photoInputRef: RefObject<HTMLInputElement | null>;
  onPhotoSelected: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (index: number) => void;
  onReorderPhotos: (photos: readonly PropertyPhotoDraft[]) => void;
  onUseAsCover: (index: number) => void;
  onUploadClick: () => void;
  onPhotoClick?: (index: number) => void;
};

function PhotoActionTile({
  ariaLabel,
  title,
  subtitle,
  icon,
  onClick,
  disabled,
  ariaExpanded,
  variant = 'filled',
}: {
  ariaLabel: string;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  ariaExpanded?: boolean;
  variant?: 'filled' | 'outline';
}) {
  return (
    <Box
      component="button"
      type="button"
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      disabled={disabled}
      onClick={onClick}
      sx={
        [
          variant === 'outline' ? photoActionTileOutlineSx : photoActionTileBaseSx,
          {
            cursor: disabled ? 'wait' : 'pointer',
          },
        ] as SxProps<Theme>
      }
    >
      <Box sx={photoActionIconCircleSx}>{icon}</Box>
      <Typography
        sx={{
          fontSize: '1rem',
          fontWeight: 500,
          textAlign: 'center',
          lineHeight: 1.3,
          color: 'text.primary',
        }}
      >
        {title}
      </Typography>
      <Typography
        color="text.secondary"
        sx={{
          minHeight: '1.25rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          lineHeight: 1.25,
          textAlign: 'center',
        }}
      >
        {subtitle ?? '\u00A0'}
      </Typography>
    </Box>
  );
}

function photoPreviewSrc(photo: PropertyPhotoDraft): string | undefined {
  return photo.localPreview ?? photo.path;
}

type PhotoEntry = { photo: PropertyPhotoDraft; index: number };

function PropertyPhotoTile({
  photo,
  index,
  onPhotoClick,
  onRemovePhoto,
  onUseAsCover,
}: {
  photo: PropertyPhotoDraft;
  index: number;
  onPhotoClick?: (index: number) => void;
  onRemovePhoto: (index: number) => void;
  onUseAsCover: (index: number) => void;
}) {
  const isCover = index === 0;
  return (
    <Box
      sx={
        [
          photoTileSx,
          photo.uploadFailed
            ? { borderColor: 'error.main' }
            : null,
        ] as SxProps<Theme>
      }
    >
      <Box
        component="button"
        type="button"
        aria-label={`Ver foto ${index + 1}`}
        onClick={() => onPhotoClick?.(index)}
        sx={
          [
            photoOpenButtonSx,
            { cursor: onPhotoClick ? 'zoom-in' : 'default' },
          ] as SxProps<Theme>
        }
      >
        <AuthPropertyPhoto
          src={photoPreviewSrc(photo)}
          alt=""
          className="size-full object-cover"
        />
      </Box>
      {isCover ? (
        <Badge
          label="Capa"
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            height: 24,
            bgcolor: 'background.paper',
            color: 'text.primary',
            fontWeight: 600,
            pointerEvents: 'none',
          }}
        />
      ) : (
        <IconButton
          size="small"
          aria-label="Usar como capa"
          onClick={(event) => {
            event.stopPropagation();
            onUseAsCover(index);
          }}
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            width: 28,
            height: 28,
            bgcolor: (theme) => listifyElevatedSurface(theme),
            color: 'text.primary',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 1,
            '&:hover': {
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? theme.palette.secondary.dark
                  : theme.palette.background.paper,
            },
          }}
        >
          <StarBorderOutlinedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      )}
      <IconButton
        size="small"
        aria-label="Remover foto"
        onClick={(event) => {
          event.stopPropagation();
          onRemovePhoto(index);
        }}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 28,
          height: 28,
          bgcolor: (theme) => listifyElevatedSurface(theme),
          color: listifyError[100],
          border: '1px solid',
          borderColor: (theme) =>
            theme.palette.mode === 'dark' ? 'divider' : 'transparent',
          boxShadow: 1,
          '&:hover': {
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? theme.palette.secondary.dark
                : listifyError[0],
          },
        }}
      >
        <DeleteOutlinedIcon sx={{ fontSize: 14 }} />
      </IconButton>
    </Box>
  );
}

function SortablePropertyPhotoTile({
  photo,
  index,
  disabled,
  onPhotoClick,
  onRemovePhoto,
  onUseAsCover,
}: {
  photo: PropertyPhotoDraft;
  index: number;
  disabled: boolean;
  onPhotoClick?: (index: number) => void;
  onRemovePhoto: (index: number) => void;
  onUseAsCover: (index: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: photo.key, disabled });

  return (
    <Box
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.65 : 1,
        cursor: disabled ? 'default' : 'grab',
      }}
      {...attributes}
      {...listeners}
    >
      <PropertyPhotoTile
        photo={photo}
        index={index}
        onPhotoClick={onPhotoClick}
        onRemovePhoto={onRemovePhoto}
        onUseAsCover={onUseAsCover}
      />
    </Box>
  );
}

export function PropertyFormPhotos({
  photos,
  maxPhotos,
  photoBusy,
  photoProgress,
  photoInputRef,
  onPhotoSelected,
  onRemovePhoto,
  onReorderPhotos,
  onUseAsCover,
  onUploadClick,
  onPhotoClick,
}: PropertyFormPhotosProps) {
  const [galleryExpanded, setGalleryExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const display = useMemo(
    () => getCatalogGalleryDisplay(photos.map((photo) => photo.key)),
    [photos],
  );

  useEffect(() => {
    if (photos.length <= CATALOG_GALLERY_MAX_VISIBLE) {
      setGalleryExpanded(false);
    }
  }, [photos.length]);

  const showAll = galleryExpanded || isDragging || !display.showMoreTile;

  const collapsedEntries = useMemo((): PhotoEntry[] => {
    return display.visiblePhotos
      .map((key) => {
        const index = photos.findIndex((photo) => photo.key === key);
        if (index < 0) return null;
        return { photo: photos[index], index };
      })
      .filter((entry): entry is PhotoEntry => Boolean(entry));
  }, [display.visiblePhotos, photos]);

  const entriesToShow = useMemo((): PhotoEntry[] => {
    if (showAll) {
      return photos.map((photo, index) => ({ photo, index }));
    }
    return collapsedEntries;
  }, [collapsedEntries, photos, showAll]);

  const showMoreTile = display.showMoreTile && !showAll;

  function handleDragEnd(event: DragEndEvent) {
    setIsDragging(false);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = photos.findIndex((photo) => photo.key === active.id);
    const newIndex = photos.findIndex((photo) => photo.key === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorderPhotos(arrayMove([...photos], oldIndex, newIndex));
  }

  const addTitle = photoProgress
    ? photoProgressLabel(photoProgress)
    : photoBusy
      ? 'Otimizando…'
      : 'Enviar foto';

  return (
    <Panel
      sx={{
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        gap: 2.75,
        p: 3,
        borderRadius: '20px',
        bgcolor: 'background.paper',
      }}
      aria-label="Galeria de fotos do imóvel"
    >
      <Box>
        <Typography
          component="h2"
          sx={{
            fontSize: '1.125rem',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            lineHeight: 1.4,
          }}
        >
          Fotos do imóvel
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: '0.875rem', fontWeight: 300 }}>
          {propertyPhotosCaption(maxPhotos)}
        </Typography>
      </Box>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={() => setIsDragging(true)}
        onDragCancel={() => setIsDragging(false)}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={photos.map((photo) => photo.key)}
          strategy={rectSortingStrategy}
        >
          <Box sx={photoGalleryGridSx}>
            {entriesToShow.map(({ photo, index }) => (
              <SortablePropertyPhotoTile
                key={photo.key}
                photo={photo}
                index={index}
                disabled={photoBusy}
                onPhotoClick={onPhotoClick}
                onRemovePhoto={onRemovePhoto}
                onUseAsCover={onUseAsCover}
              />
            ))}

            {showMoreTile ? (
              <PhotoActionTile
                ariaLabel={`Ver mais ${display.hiddenCount} fotos`}
                ariaExpanded={galleryExpanded}
                title="Mais fotos"
                subtitle={`+${display.hiddenCount}`}
                icon={<CollectionsOutlinedIcon sx={{ fontSize: 24 }} />}
                onClick={() => setGalleryExpanded(true)}
              />
            ) : null}

            {photos.length < maxPhotos || photoProgress ? (
              <PhotoActionTile
                ariaLabel="Enviar foto"
                title={addTitle}
                icon={<AddIcon sx={{ fontSize: 24 }} />}
                onClick={onUploadClick}
                disabled={photoBusy || Boolean(photoProgress)}
                variant="outline"
              />
            ) : null}
          </Box>
        </SortableContext>
      </DndContext>

      <input
        ref={photoInputRef}
        type="file"
        accept={PROPERTY_PHOTO_FILE_ACCEPT}
        multiple
        className="sr-only"
        onChange={onPhotoSelected}
      />
    </Panel>
  );
}
