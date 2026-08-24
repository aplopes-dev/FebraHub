'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Box, IconButton, Typography } from '@citybox/mui/atoms';
import type { Theme } from '@mui/material/styles';
import { AvatarGroup } from '@/components/ui/avatar-group';
import { Panel } from '@/components/ui/panel';
import { PropertyImage } from '@/components/ui/property-image';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import { PropertyStatusBadge } from '@/components/ui/status-badge';
import { getAgentDisplayName } from '@/features/shared/constants/agents';
import { PROPERTY_TYPE_LABEL } from '@/features/shared/types';
import { formatNumber } from '@/features/shared/utils/format';
import { formatCostDisplay } from '../utils/field-masks';
import type { PropertyListing } from '../types';
import { AuthPropertyPhoto } from './auth-property-photo';
import {
  PropertyPhotoViewerDialog,
  photosFromUrls,
} from './property-photo-viewer-dialog';
import { isPropertyFullyUnavailable } from '../utils/property-availability';

type PropertiesTableProps = {
  properties: readonly PropertyListing[];
  startIndex: number;
};

/** Cabeçalhos Listify Property List (Figma 18103:15934). */
const headerCellSx = {
  border: 0,
  pb: 1.5,
  px: 1.5,
  pt: 0,
  bgcolor: 'transparent',
  color: 'text.secondary',
  fontSize: '1.125rem',
  fontWeight: 500,
  lineHeight: 1.55,
  whiteSpace: 'nowrap' as const,
};

const bodyCellSx = {
  borderBottom: '1px solid',
  borderColor: 'divider',
  px: 1.5,
  py: 0,
  height: 84,
  fontSize: '1rem',
  fontWeight: 500,
  lineHeight: 1.6,
  bgcolor: (theme: Theme) => listifyElevatedSurface(theme),
};

export function PropertiesTable({ properties, startIndex }: PropertiesTableProps) {
  const router = useRouter();
  const [photoViewer, setPhotoViewer] = useState<{
    propertyId: string;
    index: number;
  } | null>(null);

  const viewerProperty = photoViewer
    ? properties.find((item) => item.id === photoViewer.propertyId)
    : undefined;
  const viewerPhotos = viewerProperty
    ? photosFromUrls(viewerProperty.photoUrls, viewerProperty.name)
    : [];

  return (
    <>
    <Panel sx={{ overflow: 'visible', p: 0, bgcolor: 'transparent', boxShadow: 'none' }}>
      <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
      <Table
        sx={{
          borderCollapse: 'separate',
          borderSpacing: 0,
          width: '100%',
          minWidth: { xs: 1000, sm: 1120, md: 0 },
        }}
      >
        <TableHead>
          <TableRow sx={{ '&:hover': { bgcolor: 'transparent' } }}>
            <TableCell sx={{ ...headerCellSx, width: 56, pl: 1.5 }}>Nº</TableCell>
            <TableCell sx={headerCellSx}>Imóvel</TableCell>
            <TableCell sx={headerCellSx}>Tipo</TableCell>
            <TableCell sx={headerCellSx}>Corretor</TableCell>
            <TableCell sx={headerCellSx}>Unidades</TableCell>
            <TableCell sx={headerCellSx}>Custo</TableCell>
            <TableCell sx={headerCellSx}>Leads ativos</TableCell>
            <TableCell sx={headerCellSx}>Views</TableCell>
            <TableCell sx={headerCellSx}>Ano</TableCell>
            <TableCell sx={headerCellSx}>Status</TableCell>
            <TableCell align="right" sx={{ ...headerCellSx, width: 72, pr: 1.5 }}>
              Ação
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {properties.map((property, index) => {
            const isFirst = index === 0;
            const isLast = index === properties.length - 1;
            const rowRadius = {
              ...(isFirst
                ? {
                    '& > td:first-of-type': { borderTopLeftRadius: '20px' },
                    '& > td:last-of-type': { borderTopRightRadius: '20px' },
                  }
                : {}),
              ...(isLast
                ? {
                    '& > td:first-of-type': { borderBottomLeftRadius: '20px' },
                    '& > td:last-of-type': { borderBottomRightRadius: '20px' },
                    '& > td': { borderBottom: 0 },
                  }
                : {}),
            };

            return (
              <TableRow
                key={property.id}
                hover
                sx={{
                  cursor: 'pointer',
                  '&:hover > td': { bgcolor: 'secondary.light' },
                  ...(isPropertyFullyUnavailable(property)
                    ? { opacity: 0.72, filter: 'saturate(0.55)' }
                    : {}),
                  ...rowRadius,
                }}
                onClick={() => router.push(`/properties/${property.id}`)}
              >
                <TableCell sx={{ ...bodyCellSx, pl: 1.5, color: 'text.primary' }}>
                  {startIndex + index}
                </TableCell>

                <TableCell sx={{ ...bodyCellSx, maxWidth: '16rem' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                    <Box
                      component="button"
                      type="button"
                      aria-label={`Ver fotos de ${property.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (property.photoUrls.length === 0) return;
                        setPhotoViewer({ propertyId: property.id, index: 0 });
                      }}
                      sx={{
                        width: 48,
                        height: 48,
                        flexShrink: 0,
                        overflow: 'hidden',
                        borderRadius: '12px',
                        bgcolor: 'secondary.main',
                        border: 0,
                        p: 0,
                        cursor: property.photoUrls.length > 0 ? 'zoom-in' : 'default',
                      }}
                    >
                      {property.photoUrls[0] ? (
                        <AuthPropertyPhoto
                          src={property.photoUrls[0]}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <PropertyImage seed={property.id} alt="" />
                      )}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Link
                        href={`/properties/${property.id}`}
                        onClick={(event) => event.stopPropagation()}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <Typography
                          sx={{
                            fontSize: '1rem',
                            fontWeight: 500,
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                          }}
                        >
                          {property.name}
                        </Typography>
                      </Link>
                      <Typography
                        color="text.secondary"
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 300,
                          lineHeight: 1.4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {property.city}, {property.state}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                <TableCell sx={bodyCellSx}>
                  {PROPERTY_TYPE_LABEL[property.type]}
                </TableCell>

                <TableCell
                  sx={{
                    ...bodyCellSx,
                    maxWidth: '10rem',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '1rem',
                      fontWeight: 500,
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={getAgentDisplayName(property.agentId)}
                  >
                    {getAgentDisplayName(property.agentId)}
                  </Typography>
                </TableCell>

                <TableCell sx={bodyCellSx}>
                  {formatNumber(property.units)}
                </TableCell>

                <TableCell sx={{ ...bodyCellSx, whiteSpace: 'nowrap' }}>
                  {formatCostDisplay(property.cost)}
                </TableCell>

                <TableCell sx={bodyCellSx}>
                  <AvatarGroup
                    people={property.activeLeads}
                    total={property.totalActiveLeads}
                    max={4}
                    size="sm"
                  />
                </TableCell>

                <TableCell sx={bodyCellSx}>
                  {formatNumber(property.views)}
                </TableCell>

                <TableCell sx={bodyCellSx}>
                  {property.yearBuilt > 0 ? property.yearBuilt : '—'}
                </TableCell>

                <TableCell sx={bodyCellSx}>
                  <PropertyStatusBadge
                    status={property.status}
                    occupiedUnits={property.occupiedUnits}
                    units={property.units}
                  />
                </TableCell>

                <TableCell align="right" sx={{ ...bodyCellSx, pr: 1.5 }}>
                  <IconButton
                    size="small"
                    aria-label={`Abrir ${property.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      router.push(`/properties/${property.id}`);
                    }}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '12px',
                      bgcolor: 'secondary.main',
                      color: 'text.primary',
                      '&:hover': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                      },
                    }}
                  >
                    <NorthEastIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </TableContainer>
    </Panel>

    <PropertyPhotoViewerDialog
      open={photoViewer !== null && viewerPhotos.length > 0}
      photos={viewerPhotos}
      index={photoViewer?.index ?? 0}
      onIndexChange={(index) => {
        if (!photoViewer) return;
        setPhotoViewer({ ...photoViewer, index });
      }}
      onOpenChange={(open) => {
        if (!open) setPhotoViewer(null);
      }}
      title={viewerProperty?.name ?? 'Fotos do imóvel'}
    />
    </>
  );
}
