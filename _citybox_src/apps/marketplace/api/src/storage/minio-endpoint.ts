export function parseMinioEndpoint(): { host: string; port: number } {
  let raw = (process.env.MINIO_ENDPOINT ?? 'localhost:9000').replace(/^https?:\/\//, '');
  if (raw.startsWith('citybox_minio')) {
    raw = raw.replace('citybox_minio', 'minio');
  }
  if (raw.includes(':')) {
    const [host, portStr] = raw.split(':');
    return { host, port: Number(portStr) || 9000 };
  }
  return { host: raw, port: Number(process.env.MINIO_PORT ?? 9000) };
}
