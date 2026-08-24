/**
 * PCI DSS — spec §46.3: não persistir PAN/CVV; preferir checkout/token PSP.
 */

const PAN_FIELD_KEYS = /^(pan|primary_?account_?number|card_?number|credit_?card_?number|cardnumber)$/i;

const STRIP_AT_REST_KEYS = new Set([
  'cvv',
  'cvc',
  'securitycode',
  'security_code',
  'card_cvv',
  'cardcvv',
  'card_security_code',
]);

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function luhnCheck(digits: string): boolean {
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let doubleDigit = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }
  return sum % 10 === 0;
}

export function looksLikePan(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length < 13 || digits.length > 19) return false;
  return luhnCheck(digits);
}

export function findPanViolations(value: unknown, path = 'body'): string[] {
  const violations: string[] = [];
  walkForPan(value, path, violations);
  return violations;
}

function walkForPan(value: unknown, path: string, violations: string[]): void {
  if (value === null || value === undefined) return;

  if (typeof value === 'string') {
    if (looksLikePan(value)) {
      violations.push(`${path}: número de cartão (PAN) não permitido — use checkout/token PSP`);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => walkForPan(item, `${path}[${index}]`, violations));
    return;
  }

  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const childPath = `${path}.${key}`;
      if (PAN_FIELD_KEYS.test(key) && typeof child === 'string' && looksLikePan(child)) {
        violations.push(`${childPath}: PAN em campo proibido`);
      }
      walkForPan(child, childPath, violations);
    }
  }
}

export function sanitizePciForStorage<T>(value: T): T {
  return deepSanitize(value) as T;
}

function deepSanitize(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    if (looksLikePan(value)) return '[REDACTED_PAN]';
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepSanitize(item));
  }

  if (typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (STRIP_AT_REST_KEYS.has(key.toLowerCase())) {
        output[key] = '[REDACTED]';
        continue;
      }
      if (PAN_FIELD_KEYS.test(key) && typeof child === 'string') {
        output[key] = looksLikePan(child) ? '[REDACTED_PAN]' : child;
        continue;
      }
      output[key] = deepSanitize(child);
    }
    return output;
  }

  return value;
}
