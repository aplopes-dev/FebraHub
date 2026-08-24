/** Limite alinhado ao Multer da clinica-api (`ClinicLogoRoute`). */
export const CLINIC_LOGO_MAX_BYTES = 4 * 1024 * 1024;

export const CLINIC_LOGO_TOO_LARGE_MESSAGE =
  'A imagem é muito pesada. Envie um arquivo de até 4 MB.';

const ACCEPTED_LOGO_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

export function validateClinicLogoFile(file: File): string | null {
  const isAccepted =
    ACCEPTED_LOGO_TYPES.has(file.type) ||
    /\.(jpe?g|png|webp)$/i.test(file.name);

  if (!isAccepted) {
    return 'Envie apenas arquivos JPG, PNG ou WebP.';
  }

  if (file.size > CLINIC_LOGO_MAX_BYTES) {
    return CLINIC_LOGO_TOO_LARGE_MESSAGE;
  }

  return null;
}
