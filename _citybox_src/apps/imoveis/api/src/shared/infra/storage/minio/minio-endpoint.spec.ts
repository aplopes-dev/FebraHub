import { parseMinioEndpoint } from './minio-endpoint';

describe('parseMinioEndpoint', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it('defaults to localhost:9000', () => {
    delete process.env.MINIO_ENDPOINT;
    delete process.env.MINIO_PORT;
    expect(parseMinioEndpoint()).toEqual({ host: 'localhost', port: 9000 });
  });

  it('parses host:port', () => {
    process.env.MINIO_ENDPOINT = 'http://minio:9000';
    expect(parseMinioEndpoint()).toEqual({ host: 'minio', port: 9000 });
  });

  it('rewrites citybox_minio container hostname', () => {
    process.env.MINIO_ENDPOINT = 'citybox_minio:9000';
    expect(parseMinioEndpoint()).toEqual({ host: 'minio', port: 9000 });
  });

  it('rewrites aplopes_minio container hostname', () => {
    process.env.MINIO_ENDPOINT = 'aplopes_minio:9000';
    expect(parseMinioEndpoint()).toEqual({ host: 'minio', port: 9000 });
  });
});
