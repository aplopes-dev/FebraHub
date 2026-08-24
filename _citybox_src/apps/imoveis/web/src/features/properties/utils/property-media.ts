import type { Options } from 'browser-image-compression';

/**
 * Compressão no navegador (Web Worker) antes do upload multipart.
 * Backend aceita PNG/JPEG/WebP até 4 MB — o alvo aqui é WebP ~1 MB.
 * HEIC/HEIF (iPhone) é convertido para JPEG no cliente antes do WebP.
 */

const API_MAX_BYTES = 4 * 1024 * 1024;
const COMPRESSION_LIB_PATH = '/vendor/browser-image-compression.js';

/** Alinhado a `MAX_PROPERTY_PHOTOS` na imoveis-api. */
export const MAX_PROPERTY_PHOTOS = 20;
export const PROPERTY_PHOTO_MAX_SIZE_LABEL = '4 MB';
export const PROPERTY_PHOTO_FORMATS_HINT = 'JPEG, PNG, WebP ou HEIC (iPhone)';
export const PROPERTY_PHOTO_FILE_ACCEPT =
  'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif';

export const PROPERTY_PHOTO_COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
  fileType: 'image/webp',
  initialQuality: 0.85,
} as const;

export type PropertyPhotoCompressor = (
  file: File,
  options: Options,
) => Promise<File | Blob>;

export type HeicConverter = (file: File) => Promise<File>;

export type PropertyPhotoProgress = {
  phase: 'compress' | 'upload';
  current: number;
  total: number;
};

function withExtension(name: string, type: string): string {
  const ext = type === 'image/webp' ? 'webp' : 'jpg';
  const base = name.replace(/\.[^.]+$/, '') || 'imagem';
  return `${base}.${ext}`;
}

function compressionLibUrl(): string {
  if (typeof window === 'undefined') {
    return COMPRESSION_LIB_PATH;
  }
  return `${window.location.origin}${COMPRESSION_LIB_PATH}`;
}

function toNamedFile(source: File | Blob, originalName: string): File {
  const type = source.type || 'image/webp';
  return new File([source], withExtension(originalName, type), { type });
}

export function isHeicFile(file: Pick<File, 'name' | 'type'>): boolean {
  const mime = file.type.toLowerCase();
  if (mime === 'image/heic' || mime === 'image/heif') return true;
  return /\.hei[cf]$/i.test(file.name);
}

export function isPropertyPhotoFile(file: Pick<File, 'name' | 'type'>): boolean {
  if (file.type.startsWith('image/')) return true;
  return isHeicFile(file);
}

async function defaultCompress(file: File, options: Options): Promise<File> {
  const { default: imageCompression } = await import(
    'browser-image-compression'
  );
  return imageCompression(file, options);
}

async function defaultConvertHeic(file: File): Promise<File> {
  const heic2any = (await import('heic2any')).default;
  const converted = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.9,
  });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  return new File([blob], withExtension(file.name, 'image/jpeg'), {
    type: 'image/jpeg',
  });
}

export function propertyPhotosCaption(
  maxPhotos: number = MAX_PROPERTY_PHOTOS,
): string {
  return `Até ${maxPhotos} fotos. A primeira é a capa (catálogo, card e WhatsApp). Formatos: ${PROPERTY_PHOTO_FORMATS_HINT}. Máx. ${PROPERTY_PHOTO_MAX_SIZE_LABEL} cada — arquivos maiores são otimizados automaticamente.`;
}

export function photoProgressLabel(
  progress: PropertyPhotoProgress,
): string {
  const verb = progress.phase === 'compress' ? 'Otimizando' : 'Enviando';
  if (progress.total <= 1) return `${verb}…`;
  return `${verb} ${progress.current}/${progress.total}`;
}

/** Recomprime `file` para WebP (~1 MB, lado ≤ 1600) fora da thread da UI. */
export async function compressPropertyPhoto(
  file: File,
  compress: PropertyPhotoCompressor = defaultCompress,
  convertHeic: HeicConverter = defaultConvertHeic,
): Promise<File> {
  if (!isPropertyPhotoFile(file)) {
    throw new Error('Selecione um arquivo de imagem.');
  }

  let source = file;
  if (isHeicFile(file)) {
    try {
      source = await convertHeic(file);
    } catch {
      throw new Error(
        'Não foi possível ler a foto HEIC. Abra no iPhone em JPEG ou tente outro arquivo.',
      );
    }
  }

  let result: File | Blob;
  try {
    result = await compress(source, {
      ...PROPERTY_PHOTO_COMPRESSION_OPTIONS,
      libURL: compressionLibUrl(),
    });
  } catch {
    throw new Error('Não foi possível otimizar a imagem. Tente outra foto.');
  }

  const compressed = toNamedFile(result, file.name);

  if (compressed.size > API_MAX_BYTES) {
    throw new Error('Imagem deve ter no máximo 4 MB');
  }

  return compressed;
}

export function formatFileSizeLabel(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Extrai o id da foto do path relativo da API. */
export function photoIdFromPath(path: string): string | null {
  const match = path.match(/\/photos\/([^/?#]+)/);
  return match?.[1] ?? null;
}
