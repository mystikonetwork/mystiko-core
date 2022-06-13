import { ExtractDocumentTypeFromTypedRxJsonSchema, RxJsonSchema, toTypedRxJsonSchema } from 'rxdb';
import { ETH_ADDRESS_REGEX } from '../constants';

const contractSchemaLiteral = {
  version: 1,
  title: 'contract schema',
  description: 'a document contains contract information',
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
      minimum: 0,
      maximum: 1e32,
      multipleOf: 1,
    },
    contractAddress: {
      type: 'string',
      maxLength: 64,
      pattern: ETH_ADDRESS_REGEX,
    },
    type: {
      type: 'string',
      minLength: 1,
    },
    disabled: {
      type: 'integer',
      default: 0,
      minimum: 0,
      maximum: 1,
    },
    syncStart: {
      type: 'integer',
      minimum: 0,
    },
    syncSize: {
      type: 'integer',
      minimum: 1,
    },
    syncedBlockNumber: {
      type: 'integer',
      minimum: 0,
    },
    checkedLeafIndex: {
      type: 'integer',
      minimum: 0,
    },
  },
  required: [
    'id',
    'createdAt',
    'updatedAt',
    'type',
    'chainId',
    'contractAddress',
    'disabled',
    'syncStart',
    'syncSize',
    'syncedBlockNumber',
  ],
  indexes: ['createdAt', 'updatedAt', 'chainId', 'contractAddress'],
} as const;

const schemaTyped = toTypedRxJsonSchema(contractSchemaLiteral);

export type ContractType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
export const contractSchema: RxJsonSchema<ContractType> = contractSchemaLiteral;
