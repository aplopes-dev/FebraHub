export type CloudEvent<T = unknown> = {
  specversion: '1.0';
  id: string;
  source: string;
  type: string;
  time: string;
  datacontenttype?: 'application/json';
  data: T;
  storeid?: string;
};

export function createCloudEvent<T>(params: {
  type: string;
  source: string;
  data: T;
  storeId?: string;
}): CloudEvent<T> {
  return {
    specversion: '1.0',
    id: crypto.randomUUID(),
    source: params.source,
    type: params.type,
    time: new Date().toISOString(),
    datacontenttype: 'application/json',
    data: params.data,
    storeid: params.storeId,
  };
}
