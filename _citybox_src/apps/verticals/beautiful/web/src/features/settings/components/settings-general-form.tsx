'use client';

import type { ReactNode } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  Grid,
  Input,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@citybox/mui/atoms';
import { Icon, type IconName } from '@citybox/mui/icons';
import { StoreLogoUpload } from '@/features/settings/components/store-logo-upload';
import { BRAZILIAN_STATES } from '../lib/brazilian-states';
import {
  mutedForeground,
  settingsFieldLabelSx,
  settingsInputSx,
  settingsMutedTextSx,
} from '@/features/settings/lib/settings-muted';
import type { StoreSettingsFormData } from '../services/settings-service';

type SettingsGeneralFormProps = {
  values: StoreSettingsFormData;
  errors: Record<string, string>;
  isSaving: boolean;
  isLoading: boolean;
  isDirty: boolean;
  loadError: boolean;
  saveSuccess: boolean;
  canManage: boolean;
  isSearchingCep: boolean;
  cepFeedback?: string;
  logoUrl: string | null;
  onPatch: (patch: Partial<StoreSettingsFormData>) => void;
  onCepChange: (value: string) => void;
  onLogoChanged: () => void;
  onRetryLoad?: () => void;
  onSave: () => void;
};

function SectionTitle({ icon, title }: { icon: IconName; title: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Icon name={icon} size={16} sx={{ color: (theme) => mutedForeground(theme) }} />
      <Typography variant="subtitle1" sx={{ fontWeight: 500, lineHeight: 1.3 }}>
        {title}
      </Typography>
    </Stack>
  );
}

function Field({
  id,
  label,
  error,
  helperText,
  children,
}: {
  id?: string;
  label: string;
  error?: string;
  helperText?: string;
  children: ReactNode;
}) {
  return (
    <Stack spacing={0.75} sx={{ minWidth: 0 }}>
      <Box
        component="label"
        htmlFor={id}
        sx={settingsFieldLabelSx(Boolean(error))}
      >
        {label}
      </Box>
      {children}
      {error ? (
        <Typography variant="body2" color="error" role="alert">
          {error}
        </Typography>
      ) : helperText ? (
        <Typography variant="body2" color="warning.main" role="alert">
          {helperText}
        </Typography>
      ) : null}
    </Stack>
  );
}

export function SettingsGeneralForm({
  values,
  errors,
  isSaving,
  isLoading,
  isDirty,
  loadError,
  saveSuccess,
  canManage,
  isSearchingCep,
  cepFeedback,
  logoUrl,
  onPatch,
  onCepChange,
  onLogoChanged,
  onRetryLoad,
  onSave,
}: SettingsGeneralFormProps) {
  const formDisabled = isSaving || isLoading || !canManage;
  const isCepBusy = formDisabled || isSearchingCep;

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      {loadError ? (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            onRetryLoad ? (
              <Button color="inherit" size="small" variant="outlined" onClick={onRetryLoad}>
                Tentar novamente
              </Button>
            ) : null
          }
        >
          Não foi possível carregar os dados do estabelecimento.
        </Alert>
      ) : null}

      <Box
        component="fieldset"
        disabled={formDisabled}
        sx={{
          m: 0,
          p: 0,
          minWidth: 0,
          border: 0,
          opacity: formDisabled ? 0.6 : 1,
        }}
      >
        <Stack spacing={2.5}>
          <Stack spacing={2.5}>
            <SectionTitle icon="building" title="Dados do estabelecimento" />

            <Stack
              direction={{ xs: 'column', lg: 'row' }}
              spacing={1.5}
              sx={{ alignItems: 'stretch' }}
            >
              <Grid container spacing={1.5} sx={{ minWidth: 0, flex: 1, alignContent: 'stretch' }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Field id="store-name" label="Nome do estabelecimento" error={errors.name}>
                    <Input
                      id="store-name"
                      value={values.name}
                      onChange={(event) => onPatch({ name: event.target.value })}
                      placeholder="Ex.: Studio Bella"
                      error={Boolean(errors.name)}
                      sx={settingsInputSx}
                      fullWidth
                    />
                  </Field>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Field id="store-cnpj" label="CNPJ">
                    <Input
                      id="store-cnpj"
                      value={values.cnpj}
                      onChange={(event) => onPatch({ cnpj: event.target.value })}
                      placeholder="00.000.000/0000-00"
                      sx={settingsInputSx}
                      fullWidth
                    />
                  </Field>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Field id="store-communications-name" label="Nome nas comunicações">
                    <Input
                      id="store-communications-name"
                      value={values.communicationsName}
                      onChange={(event) =>
                        onPatch({ communicationsName: event.target.value })
                      }
                      placeholder="Nome em e-mails e mensagens"
                      sx={settingsInputSx}
                      fullWidth
                    />
                  </Field>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Field id="store-responsible" label="Responsável">
                    <Input
                      id="store-responsible"
                      value={values.responsible}
                      onChange={(event) => onPatch({ responsible: event.target.value })}
                      placeholder="Nome do responsável"
                      sx={settingsInputSx}
                      fullWidth
                    />
                  </Field>
                </Grid>
              </Grid>

              <Stack
                spacing={0.75}
                sx={{
                  width: { xs: '100%', lg: 176 },
                  flexShrink: 0,
                  alignSelf: 'stretch',
                }}
              >
                <Box
                  component="label"
                  sx={settingsFieldLabelSx()}
                >
                  Logo estabelecimento
                </Box>
                <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
                  <StoreLogoUpload
                    logoUrl={logoUrl}
                    disabled={formDisabled}
                    onChanged={onLogoChanged}
                  />
                </Box>
              </Stack>
            </Stack>
          </Stack>

          <Divider />

          <Stack spacing={2.5}>
            <SectionTitle icon="settings" title="Informação do estabelecimento" />

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                <Field id="store-email" label="E-mail" error={errors.email}>
                  <Input
                    id="store-email"
                    type="email"
                    value={values.email}
                    onChange={(event) => onPatch({ email: event.target.value })}
                    placeholder="contato@estabelecimento.com"
                    error={Boolean(errors.email)}
                    sx={settingsInputSx}
                    fullWidth
                  />
                </Field>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                <Field id="store-phone" label="Telefone">
                  <Input
                    id="store-phone"
                    value={values.phone}
                    onChange={(event) => onPatch({ phone: event.target.value })}
                    placeholder="(00) 0000-0000"
                    sx={settingsInputSx}
                    fullWidth
                  />
                </Field>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                <Field id="store-mobile" label="Celular">
                  <Input
                    id="store-mobile"
                    value={values.mobile}
                    onChange={(event) => onPatch({ mobile: event.target.value })}
                    placeholder="(00) 00000-0000"
                    sx={settingsInputSx}
                    fullWidth
                  />
                </Field>
              </Grid>
            </Grid>
          </Stack>

          <Divider />

          <Stack spacing={2.5}>
            <SectionTitle icon="map-pin" title="Localização" />

            <Stack spacing={1.5}>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Field
                    id="store-cep"
                    label="CEP"
                    error={errors.cep}
                    helperText={cepFeedback}
                  >
                    <Input
                      id="store-cep"
                      value={values.cep}
                      onChange={(event) => onCepChange(event.target.value)}
                      placeholder="00000-000"
                      inputMode="numeric"
                      disabled={isCepBusy}
                      error={Boolean(errors.cep || cepFeedback)}
                      slotProps={{
                        input: {
                          endAdornment: isSearchingCep ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : undefined,
                        },
                      }}
                      sx={settingsInputSx}
                      fullWidth
                    />
                  </Field>
                </Grid>

                <Grid size={{ xs: 12, sm: 3 }}>
                  <Field id="store-street" label="Rua">
                    <Input
                      id="store-street"
                      value={values.street}
                      onChange={(event) => onPatch({ street: event.target.value })}
                      placeholder="Nome da rua"
                      sx={settingsInputSx}
                      fullWidth
                    />
                  </Field>
                </Grid>

                <Grid size={{ xs: 12, sm: 3 }}>
                  <Field id="store-number" label="Número">
                    <Input
                      id="store-number"
                      value={values.number}
                      onChange={(event) => onPatch({ number: event.target.value })}
                      placeholder="123"
                      sx={settingsInputSx}
                      fullWidth
                    />
                  </Field>
                </Grid>

                <Grid size={{ xs: 12, sm: 3 }}>
                  <Field id="store-complement" label="Complemento">
                    <Input
                      id="store-complement"
                      value={values.complement}
                      onChange={(event) => onPatch({ complement: event.target.value })}
                      placeholder="Sala, bloco"
                      sx={settingsInputSx}
                      fullWidth
                    />
                  </Field>
                </Grid>
              </Grid>

              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field id="store-neighborhood" label="Bairro">
                    <Input
                      id="store-neighborhood"
                      value={values.neighborhood}
                      onChange={(event) => onPatch({ neighborhood: event.target.value })}
                      placeholder="Bairro"
                      sx={settingsInputSx}
                      fullWidth
                    />
                  </Field>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field id="store-city" label="Cidade">
                    <Input
                      id="store-city"
                      value={values.city}
                      onChange={(event) => onPatch({ city: event.target.value })}
                      placeholder="Cidade"
                      sx={settingsInputSx}
                      fullWidth
                    />
                  </Field>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field id="store-state" label="Estado">
                    <FormControl fullWidth disabled={formDisabled} sx={settingsInputSx}>
                      <Select
                        id="store-state"
                        displayEmpty
                        value={values.state}
                        disabled={formDisabled}
                        inputProps={{ 'aria-label': 'Estado' }}
                        onChange={(event) =>
                          onPatch({ state: String(event.target.value) })
                        }
                        renderValue={(selected) => {
                          const value = String(selected ?? '');
                          if (!value) {
                            return (
                              <Box component="span" sx={settingsMutedTextSx}>
                                UF
                              </Box>
                            );
                          }
                          return value;
                        }}
                      >
                        <MenuItem value="">
                          <Box component="span" sx={settingsMutedTextSx}>
                            UF
                          </Box>
                        </MenuItem>
                        {BRAZILIAN_STATES.map((item) => (
                          <MenuItem key={item.uf} value={item.uf}>
                            {item.uf} — {item.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Field>
                </Grid>
              </Grid>
            </Stack>
          </Stack>

          <Divider />

          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}
          >
            {saveSuccess ? (
              <Typography variant="body2" color="primary" role="status">
                Alterações salvas com sucesso.
              </Typography>
            ) : null}

            {canManage ? (
              <Button
                variant="contained"
                onClick={onSave}
                disabled={formDisabled || !isDirty}
                startIcon={
                  isSaving ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Icon name="check" size={18} />
                  )
                }
              >
                {isSaving ? 'Salvando…' : 'Salvar alterações'}
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
