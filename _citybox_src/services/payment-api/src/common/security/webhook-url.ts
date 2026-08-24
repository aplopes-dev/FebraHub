import { BadRequestException } from '@nestjs/common';

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/,
  /^::1$/,
  /^0\.0\.0\.0$/,
];

const DEFAULT_DOCKER_ALLOWED_HOSTS = 'citybox_core_api';

function dockerAllowedHosts(): Set<string> {
  const raw = process.env.PAYMENT_API_DOCKER_ALLOWED_HOSTS?.trim() ?? DEFAULT_DOCKER_ALLOWED_HOSTS;
  return new Set(
    raw
      .split(',')
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  );
}

function isPrivateHost(hostname: string): boolean {
  const normalized = hostname.replace(/^\[/, '').replace(/\]$/, '');
  return PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(normalized));
}

/** Allowlist explícita — evita SSRF via hostnames arbitrários sem FQDN. */
function isDockerInternalHostname(hostname: string): boolean {
  const normalized = hostname.replace(/^\[/, '').replace(/\]$/, '').toLowerCase();
  if (isPrivateHost(normalized)) return false;
  if (/^\d+$/.test(normalized)) return false;
  return dockerAllowedHosts().has(normalized);
}

export function assertSafeWebhookUrl(rawUrl: string): void {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new BadRequestException('URL de webhook inválida');
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const inDockerStack = process.env.PAYMENT_API_IN_DOCKER === 'true';
  const dockerInternalHttp =
    inDockerStack && parsed.protocol === 'http:' && isDockerInternalHostname(parsed.hostname);
  // Apenas dev local (NODE_ENV !== production); sem efeito em produção.
  const allowHttpLocal =
    !isProduction && process.env.PAYMENTS_ALLOW_HTTP_WEBHOOKS === 'true';

  if (isProduction && parsed.protocol !== 'https:' && !dockerInternalHttp) {
    throw new BadRequestException('URL de webhook deve usar HTTPS em produção');
  }

  if (!isProduction && parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new BadRequestException('URL de webhook deve usar HTTP ou HTTPS');
  }

  if (parsed.protocol === 'http:' && isProduction && !dockerInternalHttp) {
    throw new BadRequestException('URL de webhook HTTP não permitida em produção');
  }

  if (!isProduction && parsed.protocol === 'http:' && !allowHttpLocal && !dockerInternalHttp) {
    throw new BadRequestException('URL de webhook HTTP não permitida — use HTTPS ou PAYMENTS_ALLOW_HTTP_WEBHOOKS=true em dev');
  }

  if (isPrivateHost(parsed.hostname) && isProduction && !dockerInternalHttp) {
    throw new BadRequestException('URL de webhook aponta para endereço privado ou local');
  }

  if (parsed.username || parsed.password) {
    throw new BadRequestException('URL de webhook não pode conter credenciais embutidas');
  }
}
