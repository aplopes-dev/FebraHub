/* Mock de `@citybox/messaging` (ESM) para o Jest — ver moduleNameMapper no package.json.
 * Reexporta o **src** TypeScript (ts-jest); o dist ESM quebra com SyntaxError: Unexpected token 'export'. */
export * from '../../../../../../../../../packages/messaging/src/contracts/clinic-strand';
export * from '../../../../../../../../../packages/messaging/src/contracts/store-events';

export type RabbitConfig = {
  url: string;
  exchange: string;
  dlx: string;
};

export type CloudEvent<T> = {
  type: string;
  source: string;
  data: T;
};

export function createCloudEvent<T extends Record<string, unknown>>(input: {
  type: string;
  source: string;
  data: T;
  storeId?: string;
}): CloudEvent<T> {
  return {
    type: input.type,
    source: input.source,
    data: input.data,
  };
}

export class RabbitBus {
  constructor(readonly config: RabbitConfig) {}

  async connect(): Promise<void> {}

  async close(): Promise<void> {}

  async publish(): Promise<void> {}

  async consume(): Promise<void> {}
}
