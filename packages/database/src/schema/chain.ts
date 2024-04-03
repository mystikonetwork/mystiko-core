import { RxJsonSchema } from 'rxdb';
import { URL_REGEX } from '../constants';

const chainSchemaLiteral = {
  version: 5,
  title: 'chain schema',
  description: 'a document contains chain information',
  primaryKey: 'id',
  type: 'object',
  keyCompression: true,
  properties: {
    id: {
      type: 'string',
      maxLength: 32,
      final: true,
    },
    createdAt: {
      type: 'string',
      maxLength: 32,
      final: true,
      format: 'date-time',
    },
    updatedAt: {
      type: 'string',
      maxLength: 32,
      format: 'date-time',
    },
    chainId: {
      type: 'integer',
      final: true,
      minimum: 0,
      maximum: 1e32,
      multipleOf: 1,
    },
    name: {
      type: 'string',
      minLength: 1,
    },
    nameOverride: {
      type: 'integer',
      minimum: 0,
      maximum: 1,
    },
    providers: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            pattern: URL_REGEX,
          },
          timeoutMs: {
            type: 'integer',
            minimum: 0,
          },
          maxTryCount: {
            type: 'integer',
            minimum: 0,
          },
          quorumWeight: {
            type: 'integer',
            minimum: 1,
          },
        },
      },
    },
    providerOverride: {
      type: 'integer',
      minimum: 0,
      maximum: 1,
    },
    eventFilterSize: {
      type: 'integer',
      minimum: 1,
    },
    syncedBlockNumber: {
      type: 'integer',
      minimum: 0,
    },
    syncedAt: {
      type: 'integer',
      minimum: 0,
    },
  },
  required: [
    'id',
    'createdAt',
    'updatedAt',
    'chainId',
    'name',
    'providers',
    'eventFilterSize',
    'syncedBlockNumber',
  ],
  indexes: ['createdAt', 'updatedAt', 'chainId'],
} as const;

export type ProviderType = {
  url: string;
  timeoutMs?: number;
  maxTryCount?: number;
  quorumWeight?: number;
};

export type ChainType = {
  id: string;
  createdAt: string;
  updatedAt: string;
  chainId: number;
  name: string;
  nameOverride?: number;
  providers: ProviderType[];
  providerOverride?: number;
  eventFilterSize: number;
  syncedBlockNumber: number;
  syncedAt?: number;
};
export const chainSchema: RxJsonSchema<ChainType> = chainSchemaLiteral;
