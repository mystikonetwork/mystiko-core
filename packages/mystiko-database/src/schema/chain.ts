import { ExtractDocumentTypeFromTypedRxJsonSchema, RxJsonSchema, toTypedRxJsonSchema } from 'rxdb';

const chainSchemaLiteral = {
  version: 0,
  title: 'chain schema',
  description: 'a document contains chain information',
  primaryKey: 'id',
  type: 'object',
  keyCompression: true,
  properties: {
    id: {
      type: 'string',
      final: true,
    },
    createdAt: {
      type: 'string',
      final: true,
      format: 'date-time',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
    },
    chainId: {
      type: 'integer',
      final: true,
      minimum: 0,
    },
    name: {
      type: 'string',
      minLength: 1,
    },
    providers: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'string',
        minLength: 1,
      },
    },
    eventFilterSize: {
      type: 'integer',
      minimum: 1,
    },
  },
  required: ['id', 'createdAt', 'updatedAt', 'chainId', 'name', 'providers', 'eventFilterSize'],
  indexes: ['chainId'],
} as const;

const schemaTyped = toTypedRxJsonSchema(chainSchemaLiteral);

export type ChainType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
export const chainSchema: RxJsonSchema<ChainType> = chainSchemaLiteral;
