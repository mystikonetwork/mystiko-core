import { ExtractDocumentTypeFromTypedRxJsonSchema, RxJsonSchema, toTypedRxJsonSchema } from 'rxdb';

const circuitSchemaLiteral = {
  version: 0,
  title: 'circuit schema',
  description: 'a document contains circuit information',
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
    name: {
      type: 'string',
      minLength: 1,
    },
    type: {
      type: 'string',
      minLength: 1,
    },
    programFiles: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'string',
        minLength: 1,
      },
    },
    abiFiles: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'string',
        minLength: 1,
      },
    },
    provingKeyFiles: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'string',
        minLength: 1,
      },
    },
    verifyingKeyFiles: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'string',
        minLength: 1,
      },
    },
  },
  required: [
    'id',
    'createdAt',
    'updatedAt',
    'name',
    'type',
    'programFiles',
    'abiFiles',
    'provingKeyFiles',
    'verifyingKeyFiles',
  ],
  indexes: ['name'],
} as const;

const schemaTyped = toTypedRxJsonSchema(circuitSchemaLiteral);

export type CircuitType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
export const circuitSchema: RxJsonSchema<CircuitType> = circuitSchemaLiteral;
