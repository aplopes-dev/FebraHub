const SENSITIVE_KEY = /^(authorization|api[_-]?key|token|secret|password|credential|cvv|cvc|asaas[_-]?api[_-]?key|pagbank[_-]?token)$/i;

export function redactForLogs(value: unknown, depth = 0): unknown {
  if (depth > 8) return '[MAX_DEPTH]';
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return value;
    }
    if (/^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)) {
      return '[REDACTED_JWT]';
    }
    if (value.length > 32 && !/\s/.test(value)) {
      return '[REDACTED_TOKEN]';
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactForLogs(item, depth + 1));
  }

  if (typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY.test(key)) {
        output[key] = '[REDACTED]';
        continue;
      }
      output[key] = redactForLogs(child, depth + 1);
    }
    return output;
  }

  return value;
}
