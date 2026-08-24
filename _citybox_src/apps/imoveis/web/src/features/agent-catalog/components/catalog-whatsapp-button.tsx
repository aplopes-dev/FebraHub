'use client';

import { useSyncExternalStore } from 'react';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { alpha } from '@mui/material/styles';
import { Box } from '@citybox/mui/atoms';
import {
  buildWhatsAppGeneralHref,
  buildWhatsAppPropertyHref,
  buildWhatsAppPropertyHrefOnClient,
  buildWhatsAppPropertyMessageText,
} from '../utils/whatsapp-property-message';

export type CatalogWhatsAppProperty = {
  title: string;
  /** Código/id do imóvel (Ref + path `/p/:id`). */
  codeOrId: string;
};

export type CatalogWhatsAppButtonProps = {
  phoneNumber?: string;
  enabled?: boolean;
  property?: CatalogWhatsAppProperty;
  className?: string;
  /**
   * `fab` — botão flutuante circular (home / listagens).
   * `sticky-bar` — CTA “Fale conosco” (estilo contained primary) fixo no rodapé
   * no smartphone; botão equivalente no canto no desktop. Abre WhatsApp. Sem faixa de fundo.
   */
  variant?: 'fab' | 'sticky-bar';
};

const GENERAL_MESSAGE =
  'Olá! Encontrei o perfil da imobiliária através do site e gostaria de mais informações sobre os seus serviços e imóveis disponíveis.';

/** @deprecated Preferir `buildWhatsAppPropertyMessageText` — mantido para testes. */
export function buildCatalogWhatsAppMessage(
  property?: CatalogWhatsAppProperty,
): string {
  if (!property) return GENERAL_MESSAGE;
  return buildWhatsAppPropertyMessageText({
    propertyTitle: property.title,
    propertyId: property.codeOrId,
  });
}

function resolveWhatsAppHref(params: {
  phoneNumber?: string;
  enabled?: boolean;
  property?: CatalogWhatsAppProperty;
  /** Pós-mount: origem da aba (evita mismatch e corrige host no link). */
  preferClientOrigin?: boolean;
}): { href: string; label: string } | null {
  if (params.enabled === false) return null;
  const phone = params.phoneNumber?.trim() ?? '';
  if (!phone) return null;

  const href = params.property
    ? params.preferClientOrigin
      ? buildWhatsAppPropertyHrefOnClient({
          phone,
          propertyTitle: params.property.title,
          propertyId: params.property.codeOrId,
        })
      : buildWhatsAppPropertyHref({
          phone,
          propertyTitle: params.property.title,
          propertyId: params.property.codeOrId,
        })
    : buildWhatsAppGeneralHref(phone, GENERAL_MESSAGE);

  if (!href) return null;

  const label = params.property
    ? `Fale conosco sobre ${params.property.title} no WhatsApp (abre em nova aba)`
    : 'Falar no WhatsApp com o corretor (abre em nova aba)';

  return { href, label };
}

function WhatsAppFabLink({
  href,
  label,
  className,
  sticky,
}: {
  href: string;
  label: string;
  className?: string;
  sticky?: 'mobile-bar' | 'desktop-fab' | 'fab';
}) {
  if (sticky === 'mobile-bar') {
    return (
      <Box
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: (theme) => theme.zIndex.fab,
          display: { xs: 'flex', md: 'none' },
          justifyContent: 'center',
          pointerEvents: 'none',
          px: 'max(1rem, env(safe-area-inset-left, 0px))',
          pr: 'max(1rem, env(safe-area-inset-right, 0px))',
          pt: 1.5,
          pb: 'max(0.875rem, env(safe-area-inset-bottom, 0px))',
          bgcolor: 'transparent',
        }}
      >
        <Box
          component="a"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={className}
          sx={{
            pointerEvents: 'auto',
            display: 'inline-flex',
            width: '100%',
            maxWidth: 560,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            minHeight: 48,
            px: 2.5,
            borderRadius: '14px',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            textDecoration: 'none',
            fontSize: '1rem',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
            boxShadow: (theme) =>
              `0 4px 14px ${alpha(theme.palette.primary.main, 0.28)}`,
            transition: 'opacity 0.15s ease',
            '&:hover': { opacity: 0.92 },
            '&:focus-visible': {
              outline: '3px solid',
              outlineColor: 'primary.light',
              outlineOffset: 2,
            },
            '@media (prefers-reduced-motion: reduce)': {
              transition: 'none',
            },
          }}
        >
          <WhatsAppIcon sx={{ fontSize: 22, flexShrink: 0 }} aria-hidden />
          Fale conosco
        </Box>
      </Box>
    );
  }

  if (sticky === 'desktop-fab') {
    return (
      <Box
        component="a"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        sx={{
          position: 'fixed',
          right: '24px',
          bottom: '28px',
          zIndex: (theme) => theme.zIndex.fab,
          display: { xs: 'none', md: 'inline-flex' },
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          minHeight: 48,
          px: 2.5,
          borderRadius: '14px',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          textDecoration: 'none',
          fontSize: '1rem',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          boxShadow: (theme) =>
            `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
          transition: 'opacity 0.15s ease, transform 0.15s ease',
          '&:hover': {
            opacity: 0.94,
            transform: 'translateY(-1px)',
          },
          '&:focus-visible': {
            outline: '3px solid',
            outlineColor: 'primary.light',
            outlineOffset: 2,
          },
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
            '&:hover': { transform: 'none' },
          },
        }}
      >
        <WhatsAppIcon sx={{ fontSize: 22 }} aria-hidden />
        Fale conosco
      </Box>
    );
  }

  return (
    <Box
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={className}
      sx={{
        position: 'fixed',
        right: { xs: '16px', md: '24px' },
        bottom: {
          xs: 'max(1rem, env(safe-area-inset-bottom, 0px))',
          md: '28px',
        },
        zIndex: (theme) => theme.zIndex.fab,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: { xs: 56, md: 60 },
        height: { xs: 56, md: 60 },
        borderRadius: '999px',
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        boxShadow: (theme) =>
          `0 4px 14px ${alpha(theme.palette.primary.main, 0.45)}`,
        textDecoration: 'none',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
        '&:hover': {
          opacity: 0.94,
          boxShadow: (theme) =>
            `0 6px 18px ${alpha(theme.palette.primary.main, 0.55)}`,
          transform: 'translateY(-1px)',
        },
        '&:focus-visible': {
          outline: '3px solid',
          outlineColor: 'primary.light',
          outlineOffset: 2,
        },
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
          '&:hover': { transform: 'none' },
        },
      }}
    >
      <WhatsAppIcon sx={{ fontSize: { xs: 30, md: 32 } }} aria-hidden />
    </Box>
  );
}

/**
 * CTA WhatsApp no catálogo público.
 * Mensagem limpa para o cliente (só link `/p/:id?action=new-lead`).
 * Href inicial SSR-safe; pós-mount realinha origin da aba.
 */
export function CatalogWhatsAppButton({
  phoneNumber,
  enabled = true,
  property,
  className,
  variant = 'fab',
}: CatalogWhatsAppButtonProps) {
  const isClient = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const resolved = resolveWhatsAppHref({
    phoneNumber,
    enabled,
    property,
    preferClientOrigin: isClient && Boolean(property),
  });

  if (!resolved) return null;

  if (variant === 'sticky-bar') {
    return (
      <>
        <WhatsAppFabLink
          href={resolved.href}
          label={resolved.label}
          className={className}
          sticky="mobile-bar"
        />
        <WhatsAppFabLink
          href={resolved.href}
          label={resolved.label}
          sticky="desktop-fab"
        />
      </>
    );
  }

  return (
    <WhatsAppFabLink
      href={resolved.href}
      label={resolved.label}
      className={className}
      sticky="fab"
    />
  );
}
