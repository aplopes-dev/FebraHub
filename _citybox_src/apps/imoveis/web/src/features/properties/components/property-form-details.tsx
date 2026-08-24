'use client';

import { type KeyboardEvent, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import {
  Box,
  Button,
  FormControl,
  IconButton,
  Input,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Switch,
  Typography,
} from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import { Panel } from '@/components/ui/panel';
import { fetchAddressByCep, geocodeAddress, cepDigits, isValidCepDigits } from '../utils/cep-lookup';
import { formatMapCoordinate } from '../utils/map-coordinate';
import { PropertyStatusBadge } from '@/components/ui/status-badge';
import {
  PROPERTY_STATUS_LABEL,
  PROPERTY_TYPE_LABEL,
  type PropertyStatus,
  type PropertyType,
} from '@/features/shared/types';
import { listifyError, listifyPrimary } from '@/theme/tokens';
import { LISTING_TYPE_LABEL, type ListingType } from '../types';
import { maskCostInput, maskSqmInput, maskZipCode } from '../utils/field-masks';
import { applyHighlightLineBreak } from '../utils/property-catalog-text';
import {
  propertyFormFieldSx,
  propertyFormMultilineSx,
  propertyFormSelectSx,
  propertyStatusSelectAvailableSx,
} from './property-form-styles';

export type PropertyFormDetailsForm = {
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
};

const PropertyMapPicker = dynamic(
  () =>
    import('./property-map-picker').then((mod) => mod.PropertyMapPicker),
  {
    ssr: false,
    loading: () => (
      <Skeleton variant="rounded" height={224} sx={{ borderRadius: '20px' }} />
    ),
  },
);

export type PropertyFormDetailsProps = {
  mode: 'create' | 'edit';
  form: PropertyFormDetailsForm;
  saving: boolean;
  onChange: <K extends keyof PropertyFormDetailsForm>(
    key: K,
    value: PropertyFormDetailsForm[K],
  ) => void;
  onSave: () => void;
  onDelete: () => void;
  /** Reativa imóvel indisponível (status → available). */
  onReactivate?: () => void;
  /** Abre create pré-preenchido a partir deste cadastro. */
  onUseAsTemplate?: () => void;
};

function Field({
  label,
  htmlFor,
  children,
  sx,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  sx?: object;
}) {
  return (
    <Stack spacing={0.75} sx={sx}>
      <Box
        component="label"
        htmlFor={htmlFor}
        sx={{
          fontSize: '0.875rem',
          fontWeight: 500,
          lineHeight: 1.55,
          color: 'text.secondary',
        }}
      >
        {label}
      </Box>
      {children}
    </Stack>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Typography
      component="h2"
      sx={{
        fontSize: '1.125rem',
        fontWeight: 500,
        letterSpacing: '-0.02em',
        lineHeight: 1.4,
      }}
    >
      {children}
    </Typography>
  );
}

function digitsOnlyLocal(value: string): string {
  return value.replace(/\D/g, '');
}

export function PropertyFormDetails({
  mode,
  form,
  saving,
  onChange,
  onSave,
  onDelete,
  onReactivate,
  onUseAsTemplate,
}: PropertyFormDetailsProps) {
  const statusSelectSx =
    form.status === 'available'
      ? propertyStatusSelectAvailableSx
      : propertyFormSelectSx;
  const showUnavailableActions =
    mode === 'edit' && form.status !== 'available';

  function handleHighlightsKeyDown(event: KeyboardEvent) {
    const key = event.key;
    if (key !== 'Enter' && key !== ',' && key !== ';') return;

    const target = event.target;
    if (!(target instanceof HTMLTextAreaElement)) return;
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;
    const result = applyHighlightLineBreak(
      form.highlightsText,
      start,
      end,
      key === 'Enter' ? 'Enter' : key,
    );

    if (!result?.preventDefault) return;

    event.preventDefault();

    if (result.text === form.highlightsText) return;

    onChange('highlightsText', result.text);
    requestAnimationFrame(() => {
      target.setSelectionRange(result.cursor, result.cursor);
    });
  }

  async function handleZipBlur() {
    const digits = cepDigits(form.zipCode);
    if (!isValidCepDigits(digits)) return;
    try {
      const data = await fetchAddressByCep(digits);
      const streetLine = [data.street, data.neighborhood]
        .filter(Boolean)
        .join(', ');
      if (streetLine) onChange('address', streetLine);
      onChange('city', data.city);
      onChange('state', data.state);
      if (!form.country.trim()) onChange('country', 'Brasil');
      const query = [streetLine, data.city, data.state, 'Brasil']
        .filter(Boolean)
        .join(', ');
      const geo = await geocodeAddress(query);
      if (geo) {
        onChange('mapCoordinate', formatMapCoordinate(geo.lat, geo.lng));
      }
    } catch (error) {
      toast.error('Não foi possível preencher o CEP.', {
        description:
          error instanceof Error ? error.message : 'Digite o endereço manualmente.',
      });
    }
  }

  return (
    <Panel sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, p: 3 }}>
      {showUnavailableActions ? (
        <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {onReactivate ? (
            <Button
              type="button"
              variant="outlined"
              disabled={saving}
              onClick={onReactivate}
              sx={{ textTransform: 'none', borderRadius: '12px' }}
            >
              Reativar (Disponível)
            </Button>
          ) : null}
          {onUseAsTemplate ? (
            <Button
              type="button"
              variant="text"
              disabled={saving}
              onClick={onUseAsTemplate}
              sx={{ textTransform: 'none' }}
            >
              Usar como base de novo imóvel
            </Button>
          ) : null}
        </Stack>
      ) : null}
      <Stack spacing={1.5}>
        <SectionTitle>Informações básicas</SectionTitle>

        <Box
          sx={{
            display: 'grid',
            gap: 2.5,
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          }}
        >
          <Stack spacing={1.5}>
            <Field label="Nome do imóvel" htmlFor="prop-name">
              <Input
                id="prop-name"
                value={form.name}
                onChange={(event) => onChange('name', event.target.value)}
                placeholder="Maison Sterling"
                fullWidth
                sx={propertyFormFieldSx}
              />
            </Field>
            <Field label="Status do anúncio" htmlFor="prop-status">
              <FormControl fullWidth>
                <Select
                  id="prop-status"
                  value={form.status}
                  onChange={(event) =>
                    onChange('status', event.target.value as PropertyStatus)
                  }
                  sx={statusSelectSx}
                  renderValue={(value) => PROPERTY_STATUS_LABEL[value as PropertyStatus]}
                >
                  {(Object.keys(PROPERTY_STATUS_LABEL) as PropertyStatus[]).map(
                    (status) => (
                      <MenuItem key={status} value={status}>
                        <PropertyStatusBadge status={status} />
                      </MenuItem>
                    ),
                  )}
                </Select>
              </FormControl>
            </Field>
          </Stack>

          <Stack spacing={1.5}>
            <Field label="Finalidade" htmlFor="prop-listing-type">
              <FormControl fullWidth>
                <Select
                  id="prop-listing-type"
                  value={form.listingType}
                  onChange={(event) =>
                    onChange('listingType', event.target.value as ListingType)
                  }
                  sx={propertyFormSelectSx}
                >
                  {(Object.keys(LISTING_TYPE_LABEL) as ListingType[]).map((type) => (
                    <MenuItem key={type} value={type}>
                      {LISTING_TYPE_LABEL[type]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Field>
            <Field label="Custo" htmlFor="prop-cost">
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ alignItems: 'center', width: '100%' }}
              >
                <Input
                  id="prop-cost"
                  inputMode="numeric"
                  value={form.costDisplay}
                  onChange={(event) =>
                    onChange('costDisplay', maskCostInput(event.target.value))
                  }
                  placeholder="R$ 1.560.400"
                  fullWidth
                  sx={propertyFormFieldSx}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <AttachMoneyOutlinedIcon
                          sx={{ fontSize: 18, color: 'text.secondary', mr: 0.5 }}
                        />
                      ),
                    },
                  }}
                />
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: 'center', flexShrink: 0 }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: form.negotiable ? 'text.primary' : 'text.secondary',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Negociável
                  </Typography>
                  <Switch
                    checked={form.negotiable}
                    onChange={(_event, checked) => onChange('negotiable', checked)}
                    aria-label="Negociável"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: listifyPrimary[300],
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        bgcolor: listifyPrimary[300],
                      },
                    }}
                  />
                </Stack>
              </Stack>
            </Field>
          </Stack>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: {
              xs: '1fr 1fr',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(5, 1fr)',
            },
          }}
        >
          <Field label="Quartos" htmlFor="prop-bedrooms">
            <Input
              id="prop-bedrooms"
              inputMode="numeric"
              value={form.bedrooms}
              onChange={(event) =>
                onChange('bedrooms', digitsOnlyLocal(event.target.value))
              }
              fullWidth
              sx={propertyFormFieldSx}
            />
          </Field>
          <Field label="Andares" htmlFor="prop-floors">
            <Input
              id="prop-floors"
              inputMode="numeric"
              value={form.floors}
              onChange={(event) =>
                onChange('floors', digitsOnlyLocal(event.target.value))
              }
              fullWidth
              sx={propertyFormFieldSx}
            />
          </Field>
          <Field label="Tamanho" htmlFor="prop-size">
            <Input
              id="prop-size"
              inputMode="numeric"
              value={form.sizeSqm}
              onChange={(event) =>
                onChange('sizeSqm', maskSqmInput(event.target.value))
              }
              fullWidth
              sx={propertyFormFieldSx}
              slotProps={{
                input: {
                  endAdornment: (
                    <Typography
                      color="text.secondary"
                      sx={{ fontSize: '0.75rem', ml: 0.5, whiteSpace: 'nowrap' }}
                    >
                      m²
                    </Typography>
                  ),
                },
              }}
            />
          </Field>
          <Field label="Unidades" htmlFor="prop-units">
            <Input
              id="prop-units"
              inputMode="numeric"
              value={form.units}
              onChange={(event) =>
                onChange('units', digitsOnlyLocal(event.target.value))
              }
              fullWidth
              sx={propertyFormFieldSx}
            />
          </Field>
          <Field label="Ano" htmlFor="prop-year">
            <Input
              id="prop-year"
              inputMode="numeric"
              value={form.yearBuilt}
              onChange={(event) =>
                onChange(
                  'yearBuilt',
                  digitsOnlyLocal(event.target.value).slice(0, 4),
                )
              }
              fullWidth
              sx={propertyFormFieldSx}
            />
          </Field>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          }}
        >
          <Field label="Categoria" htmlFor="prop-type">
            <FormControl fullWidth>
              <Select
                id="prop-type"
                value={form.type}
                onChange={(event) =>
                  onChange('type', event.target.value as PropertyType)
                }
                sx={propertyFormSelectSx}
              >
                {(Object.keys(PROPERTY_TYPE_LABEL) as PropertyType[]).map((type) => (
                  <MenuItem key={type} value={type}>
                    {PROPERTY_TYPE_LABEL[type]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Field>
          <Field label="UF" htmlFor="prop-state">
            <Input
              id="prop-state"
              value={form.state}
              onChange={(event) =>
                onChange('state', event.target.value.toUpperCase().slice(0, 2))
              }
              placeholder="SP"
              fullWidth
              sx={propertyFormFieldSx}
              slotProps={{ htmlInput: { maxLength: 2 } }}
            />
          </Field>
        </Box>

        {form.status === 'occupied' ? (
          <Field label="Unidades ocupadas" htmlFor="prop-occupied">
            <Input
              id="prop-occupied"
              inputMode="numeric"
              value={form.occupiedUnits}
              onChange={(event) =>
                onChange('occupiedUnits', digitsOnlyLocal(event.target.value))
              }
              fullWidth
              sx={propertyFormFieldSx}
            />
          </Field>
        ) : null}
      </Stack>

      <Stack spacing={1.5}>
        <SectionTitle>Localização</SectionTitle>
        <Field label="Endereço" htmlFor="prop-address">
          <Input
            id="prop-address"
            value={form.address}
            onChange={(event) => onChange('address', event.target.value)}
            fullWidth
            sx={propertyFormFieldSx}
          />
        </Field>
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          }}
        >
          <Field label="Cidade" htmlFor="prop-city">
            <Input
              id="prop-city"
              value={form.city}
              onChange={(event) => onChange('city', event.target.value)}
              placeholder="Ilhéus"
              fullWidth
              sx={propertyFormFieldSx}
            />
          </Field>
          <Field label="CEP" htmlFor="prop-zip">
            <Input
              id="prop-zip"
              inputMode="numeric"
              value={form.zipCode}
              onChange={(event) =>
                onChange('zipCode', maskZipCode(event.target.value))
              }
              onBlur={() => {
                void handleZipBlur();
              }}
              placeholder="00000-000"
              fullWidth
              sx={propertyFormFieldSx}
            />
          </Field>
        </Box>
        <Field label="Estado / País" htmlFor="prop-country">
          <Input
            id="prop-country"
            value={form.country}
            onChange={(event) => onChange('country', event.target.value)}
            placeholder="São Paulo, Brasil"
            fullWidth
            sx={propertyFormFieldSx}
          />
        </Field>
        {form.mapCoordinate ? (
          <PropertyMapPicker
            mapCoordinate={form.mapCoordinate}
            onChange={(value) => onChange('mapCoordinate', value)}
            title="Ajuste o pin no mapa"
          />
        ) : (
          <Typography
            color="text.secondary"
            sx={{ fontSize: '0.8125rem', fontWeight: 300 }}
          >
            Preencha o CEP para posicionar o mapa. Depois toque em Editar para
            ajustar o pin.
          </Typography>
        )}
      </Stack>

      <Stack spacing={1.5}>
        <SectionTitle>Catálogo público</SectionTitle>
        <Typography color="text.secondary" sx={{ fontSize: '0.875rem', fontWeight: 300 }}>
          Estes textos aparecem na página pública do imóvel para clientes finais.
        </Typography>
        <Field label="Descrição do imóvel" htmlFor="prop-description">
          <Input
            id="prop-description"
            multiline
            minRows={4}
            value={form.description}
            onChange={(event) => onChange('description', event.target.value)}
            placeholder="Descreva o imóvel, ambientes, acabamento e localização…"
            fullWidth
            sx={propertyFormMultilineSx}
          />
        </Field>
        <Field label="Diferenciais" htmlFor="prop-highlights">
          <Input
            id="prop-highlights"
            multiline
            minRows={4}
            value={form.highlightsText}
            onChange={(event) => onChange('highlightsText', event.target.value)}
            onKeyDown={handleHighlightsKeyDown}
            placeholder={
              'Um diferencial por linha (Enter ou vírgula para a próxima)\nEx.: Varanda gourmet\nEx.: 2 vagas cobertas'
            }
            fullWidth
            sx={propertyFormMultilineSx}
          />
        </Field>
      </Stack>

      <Stack direction="row" spacing={2.5} sx={{ alignItems: 'stretch', pt: 0.5 }}>
        <Button
          type="button"
          variant="contained"
          onClick={onSave}
          disabled={saving}
          sx={{
            flex: 1,
            height: 52,
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: 500,
            textTransform: 'none',
            boxShadow: 'none',
          }}
        >
          {saving ? 'Salvando…' : 'Salvar alterações'}
        </Button>
        {mode === 'edit' ? (
          <IconButton
            aria-label="Excluir imóvel"
            onClick={onDelete}
            disabled={saving}
            sx={{
              width: 56,
              height: 56,
              borderRadius: 999,
              bgcolor: listifyError[0],
              color: listifyError[100],
              '&:hover': { bgcolor: listifyError[25] },
            }}
          >
            <DeleteOutlinedIcon sx={{ fontSize: 24 }} />
          </IconButton>
        ) : null}
      </Stack>
    </Panel>
  );
}
