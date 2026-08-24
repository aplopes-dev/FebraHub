'use client';

import { useId, useState, type FormEvent } from 'react';
import { Box, Button, Input, Stack, Typography } from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import {
  SETTINGS_FIELD_SX,
  SettingsField,
} from '@/features/settings/utils/settings-form-styles';
import { leadTabMultilineSx } from '@/features/leads/components/lead-form-tab-styles';
import { formatPhoneBR } from '@/features/leads/utils/field-masks';
import { submitPublicLead } from '../services/agent-catalog-client-service';
import { catalogFlatButtonSx } from '../utils/catalog-flat-styles';

type PublicLeadFormProps = {
  agentSlug: string;
  listingId?: string;
  listingTitle?: string;
  compact?: boolean;
};

type FieldErrors = {
  name?: string;
  contact?: string;
};

const submitButtonSx = {
  minHeight: 48,
  height: 48,
  borderRadius: '20px',
  fontSize: '1rem',
  fontWeight: 500,
  textTransform: 'none',
  ...catalogFlatButtonSx,
} as const;

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <Typography
      id={id}
      role="alert"
      sx={{ fontSize: '0.75rem', color: 'error.main', mt: 0.5 }}
    >
      {message}
    </Typography>
  );
}

export function PublicLeadForm({
  agentSlug,
  listingId,
  listingTitle,
  compact = false,
}: PublicLeadFormProps) {
  const formId = useId();
  const fieldId = (name: string) => `${formId}-${name}`;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!name.trim()) {
      nextErrors.name = 'Informe seu nome';
    }
    if (!phone.trim() && !email.trim()) {
      nextErrors.contact = 'Informe telefone ou e-mail';
    }
    if (nextErrors.name || nextErrors.contact) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await submitPublicLead(agentSlug, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        message: message.trim() || undefined,
        listingId,
      });
      setSubmitted(true);
      toast.success('Recebemos seu contato! Em breve entraremos em contato.');
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Não foi possível enviar';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div aria-live="polite" aria-atomic="true">
      {submitted ? (
        <Stack spacing={1} role="status">
          <Typography
            component="h3"
            sx={{
              fontSize: compact ? '1rem' : '1.125rem',
              fontWeight: 500,
              letterSpacing: '-0.02em',
              lineHeight: 1.4,
            }}
          >
            Contato enviado
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: '0.875rem', lineHeight: 1.55 }}>
            {listingTitle
              ? `Registramos seu interesse em ${listingTitle}. Em breve entraremos em contato.`
              : 'Recebemos seus dados. Em breve entraremos em contato.'}
          </Typography>
        </Stack>
      ) : (
        <Box component="form" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <Stack spacing={compact ? 2 : 2.75}>
            <Stack spacing={0.75}>
              <Typography
                component="h3"
                sx={{
                  fontSize: compact ? '1rem' : '1.125rem',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.4,
                }}
              >
                {listingTitle ? 'Tenho interesse neste imóvel' : 'Fale com a corretora'}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: '0.875rem', lineHeight: 1.55 }}>
                Deixe seus dados — respondemos o quanto antes.
              </Typography>
            </Stack>

            <Stack spacing={2}>
              <SettingsField label="Nome" htmlFor={fieldId('name')}>
                <Input
                  id={fieldId('name')}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (errors.name) setErrors((current) => ({ ...current, name: undefined }));
                  }}
                  placeholder="Seu nome completo"
                  fullWidth
                  required
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? fieldId('name-error') : undefined}
                  sx={SETTINGS_FIELD_SX}
                />
                {errors.name ? (
                  <FieldError id={fieldId('name-error')} message={errors.name} />
                ) : null}
              </SettingsField>

              <Stack
                direction={compact ? 'column' : { xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ width: '100%' }}
              >
                <SettingsField
                  label="Telefone"
                  htmlFor={fieldId('phone')}
                  sx={{ flex: 1, minWidth: 0 }}
                >
                  <Input
                    id={fieldId('phone')}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => {
                      setPhone(formatPhoneBR(event.target.value));
                      if (errors.contact) {
                        setErrors((current) => ({ ...current, contact: undefined }));
                      }
                    }}
                    placeholder="(00) 00000-0000"
                    fullWidth
                    aria-invalid={Boolean(errors.contact)}
                    aria-describedby={errors.contact ? fieldId('contact-error') : undefined}
                    sx={SETTINGS_FIELD_SX}
                  />
                </SettingsField>

                <SettingsField
                  label="E-mail"
                  htmlFor={fieldId('email')}
                  sx={{ flex: 1, minWidth: 0 }}
                >
                  <Input
                    id={fieldId('email')}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (errors.contact) {
                        setErrors((current) => ({ ...current, contact: undefined }));
                      }
                    }}
                    placeholder="voce@email.com"
                    fullWidth
                    aria-invalid={Boolean(errors.contact)}
                    aria-describedby={errors.contact ? fieldId('contact-error') : undefined}
                    sx={SETTINGS_FIELD_SX}
                  />
                </SettingsField>
              </Stack>
              {errors.contact ? (
                <FieldError id={fieldId('contact-error')} message={errors.contact} />
              ) : null}

              <SettingsField label="Mensagem (opcional)" htmlFor={fieldId('message')}>
                <Input
                  id={fieldId('message')}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Conte o que você procura ou quando prefere visitar"
                  fullWidth
                  multiline
                  minRows={compact ? 3 : 4}
                  sx={leadTabMultilineSx}
                />
              </SettingsField>
            </Stack>

            <Stack
              direction="row"
              sx={{
                alignItems: 'stretch',
                pt: compact ? 0.5 : 1,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isSubmitting}
                sx={submitButtonSx}
              >
                {isSubmitting ? 'Enviando…' : 'Enviar contato'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      )}
    </div>
  );
}
