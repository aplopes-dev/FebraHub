import { parseMinioEndpoint } from './minio-endpoint';

describe('parseMinioEndpoint', () => {
  const original = process.env;

  beforeEach(() => {
    process.env = { ...original };
  });

  afterAll(() => {
    process.env = original;
  });

  it('parses host:port', () => {
    process.env.MINIO_ENDPOINT = '127.0.0.1:9000';
    expect(parseMinioEndpoint()).toEqual({ host: '127.0.0.1', port: 9000 });
  });

  it('strips protocol prefix', () => {
    process.env.MINIO_ENDPOINT = 'http://minio:9000';
    expect(parseMinioEndpoint()).toEqual({ host: 'minio', port: 9000 });
  });

  it('maps docker service name', () => {
    process.env.MINIO_ENDPOINT = 'citybox_minio:9000';
    expect(parseMinioEndpoint()).toEqual({ host: 'minio', port: 9000 });
  });
});
