import { ExtractDocumentTypeFromTypedRxJsonSchema, RxJsonSchema, toTypedRxJsonSchema } from 'rxdb';
import { BN_REGEX, ETH_ADDRESS_REGEX, ETH_TX_HASH_REGEX } from '../constants';

const nullifierSchemaLiteral = {
  version: 0,
  title: 'nullifier schema',
  description: 'a document contains nullifier information',
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
    contractAddress: {
      type: 'string',
      final: true,
      pattern: ETH_ADDRESS_REGEX,
    },
    serialNumber: {
      type: 'string',
      final: true,
      pattern: BN_REGEX,
    },
    transactionHash: {
      type: 'string',
      pattern: ETH_TX_HASH_REGEX,
    },
  },
  required: ['id', 'createdAt', 'updatedAt', 'chainId', 'contractAddress', 'serialNumber', 'transactionHash'],
  indexes: ['createdAt', 'updatedAt', 'chainId', 'contractAddress', 'serialNumber', 'transactionHash'],
} as const;

const schemaTyped = toTypedRxJsonSchema(nullifierSchemaLiteral);

export type NullifierType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
export const nullifierSchema: RxJsonSchema<NullifierType> = nullifierSchemaLiteral;
