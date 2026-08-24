'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Box, Stack, Typography } from '@citybox/mui/atoms';
import { SearchInput } from '@citybox/mui/molecules';
import { AvatarGroup } from '@/components/ui/avatar-group';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { PropertyImage } from '@/components/ui/property-image';
import { PropertyStatusBadge } from '@/components/ui/status-badge';
import { AuthPropertyPhoto } from '@/features/properties/components/auth-property-photo';
import { formatCompactCurrency, formatNumber } from '@/features/shared/utils/format';
import { PROPERTY_TYPE_LABEL } from '@/features/shared/types';
import type { ActiveListing } from '../types';

export function ActiveListingsCard({ listings }: { listings: readonly ActiveListing[] }) {
  const [query, setQuery] = useState('');

  const visibleListings = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (normalized.length === 0) {
      return listings;
    }

    return listings.filter((listing) =>
      `${listing.name} ${listing.city} ${listing.state}`.toLowerCase().includes(normalized),
    );
  }, [listings, query]);

  const hiddenFromMd = { display: { xs: 'none', md: 'table-cell' } };
  const hiddenFromSm = { display: { xs: 'none', sm: 'table-cell' } };
  const hiddenFromLg = { display: { xs: 'none', lg: 'table-cell' } };
  const hiddenFromXl = { display: { xs: 'none', xl: 'table-cell' } };

  return (
    <Panel
      sx={{
        display: 'flex',
        width: '100%',
        minWidth: 0,
        height: '100%',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <PanelHeader
        title="Imóveis ativos"
        sx={{
          flexWrap: 'wrap',
          alignItems: { xs: 'stretch', sm: 'center' },
          rowGap: 1.5,
        }}
        action={
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: 'center',
              width: { xs: '100%', sm: 'auto' },
              flex: { xs: '1 1 100%', sm: '0 0 auto' },
              justifyContent: { xs: 'space-between', sm: 'flex-end' },
            }}
          >
            <SearchInput
              placeholder="Buscar..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              size="small"
              sx={{
                flex: { xs: 1, sm: '0 0 auto' },
                width: { xs: 'auto', sm: 180 },
                minWidth: 0,
                '& .MuiOutlinedInput-root': {
                  height: 32,
                  borderRadius: '999px',
                  bgcolor: 'secondary.main',
                  fontSize: '0.75rem',
                  '& fieldset': { border: 'none' },
                },
              }}
            />
            <Box
              component={Link}
              href="/properties"
              aria-label="Ver todos os imóveis"
              sx={{
                display: 'inline-flex',
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '999px',
                bgcolor: 'secondary.main',
                color: 'text.secondary',
                textDecoration: 'none',
                '&:hover': { bgcolor: 'secondary.dark', color: 'text.primary' },
              }}
            >
              <NorthEastIcon sx={{ fontSize: 14 }} />
            </Box>
          </Stack>
        }
      />

      <Box sx={{ width: '100%', minWidth: 0, overflowX: 'auto', borderRadius: '12px' }}>
        <Table
          size="small"
          sx={{
            width: '100%',
            tableLayout: 'fixed',
            '& td, & th': { borderColor: 'secondary.main', px: 1.5, py: 1.5 },
            '& th': { borderBottomWidth: 0 },
          }}
        >
          <TableHead>
            <TableRow sx={{ '&:hover': { bgcolor: 'transparent' } }}>
              <TableCell
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'text.secondary',
                  width: { xs: '42%', sm: '36%', md: '32%' },
                }}
              >
                Imóvel
              </TableCell>
              <TableCell
                sx={{
                  ...hiddenFromMd,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'text.secondary',
                  whiteSpace: 'nowrap',
                }}
              >
                Tipo
              </TableCell>
              <TableCell
                sx={{
                  ...hiddenFromSm,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'text.secondary',
                  whiteSpace: 'nowrap',
                }}
              >
                Unidades
              </TableCell>
              <TableCell
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'text.secondary',
                  whiteSpace: 'nowrap',
                }}
              >
                Valor
              </TableCell>
              <TableCell
                sx={{
                  ...hiddenFromLg,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'text.secondary',
                  whiteSpace: 'nowrap',
                }}
              >
                Leads ativos
              </TableCell>
              <TableCell
                sx={{
                  ...hiddenFromXl,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'text.secondary',
                  whiteSpace: 'nowrap',
                }}
              >
                Views
              </TableCell>
              <TableCell
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'text.secondary',
                  whiteSpace: 'nowrap',
                }}
              >
                Status
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {visibleListings.map((listing) => {
              const cover = listing.photoUrls?.[0];
              return (
              <TableRow key={listing.id} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                <TableCell>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        flexShrink: 0,
                        overflow: 'hidden',
                        borderRadius: '6px',
                        bgcolor: 'secondary.main',
                      }}
                    >
                      {cover ? (
                        <AuthPropertyPhoto
                          src={cover}
                          alt={`Foto de ${listing.name}`}
                          className="size-full object-cover"
                        />
                      ) : (
                        <PropertyImage seed={listing.id} alt={`Foto de ${listing.name}`} />
                      )}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {listing.name}
                      </Typography>
                      <Typography
                        color="text.secondary"
                        sx={{
                          display: 'block',
                          fontSize: '0.75rem',
                          fontWeight: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {listing.city}, {listing.state}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell sx={hiddenFromMd}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                    {PROPERTY_TYPE_LABEL[listing.type]}
                  </Typography>
                </TableCell>
                <TableCell sx={hiddenFromSm}>
                  <Typography color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {formatNumber(listing.units)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography color="text.secondary" sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    {formatCompactCurrency(listing.cost)}
                  </Typography>
                </TableCell>
                <TableCell sx={hiddenFromLg}>
                  <AvatarGroup
                    people={listing.activeLeads}
                    total={listing.totalActiveLeads}
                    size="sm"
                  />
                </TableCell>
                <TableCell sx={hiddenFromXl}>
                  <Typography color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {formatNumber(listing.views)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <PropertyStatusBadge
                    status={listing.status}
                    occupiedUnits={listing.occupiedUnits}
                    units={listing.units}
                  />
                </TableCell>
              </TableRow>
              );
            })}

            {visibleListings.length === 0 && (
              <TableRow sx={{ '&:hover': { bgcolor: 'transparent' } }}>
                <TableCell colSpan={7} sx={{ py: 5, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    Nenhum imóvel encontrado para “{query}”.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </Panel>
  );
}
