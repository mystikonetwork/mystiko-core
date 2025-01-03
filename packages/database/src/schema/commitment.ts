import { ExtractDocumentTypeFromTypedRxJsonSchema, RxJsonSchema, toTypedRxJsonSchema } from 'rxdb';
import { BN_REGEX, ETH_ADDRESS_REGEX, ETH_TX_HASH_REGEX, HEX_REGEX } from '../constants';

const commitmentSchemaLiteral = {
  version: 1,
  title: 'commitment schema',
  description: 'a document contains commitment information',
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
    contractAddress: {
      type: 'string',
      maxLength: 64,
      final: true,
      pattern: ETH_ADDRESS_REGEX,
    },
    commitmentHash: {
      type: 'string',
      maxLength: 128,
      final: true,
      pattern: BN_REGEX,
    },
    assetSymbol: {
      type: 'string',
      minLength: 1,
      final: true,
    },
    assetDecimals: {
      type: 'integer',
      final: true,
      minimum: 1,
    },
    assetAddress: {
      type: 'string',
      pattern: ETH_ADDRESS_REGEX,
    },
    status: {
      type: 'string',
      minLength: 1,
    },
    rollupFeeAmount: {
      type: 'string',
      pattern: BN_REGEX,
    },
    encryptedNote: {
      type: 'string',
      pattern: HEX_REGEX,
    },
    leafIndex: {
      type: 'string',
      pattern: BN_REGEX,
    },
    amount: {
      type: 'string',
      pattern: BN_REGEX,
    },
    serialNumber: {
      type: 'string',
      maxLength: 128,
      pattern: BN_REGEX,
    },
    shieldedAddress: {
      type: 'string',
      maxLength: 128,
      minLength: 1,
    },
    creationTransactionHash: {
      type: 'string',
      maxLength: 128,
      pattern: ETH_TX_HASH_REGEX,
    },
    spendingTransactionHash: {
      type: 'string',
      maxLength: 128,
      pattern: ETH_TX_HASH_REGEX,
    },
    rollupTransactionHash: {
      type: 'string',
      maxLength: 128,
      pattern: ETH_TX_HASH_REGEX,
    },
  },
  required: [
    'id',
    'createdAt',
    'updatedAt',
    'chainId',
    'contractAddress',
    'assetSymbol',
    'assetDecimals',
    'commitmentHash',
    'status',
  ],
  indexes: [
    'createdAt',
    'updatedAt',
    'chainId',
    'contractAddress',
    'commitmentHash',
    'shieldedAddress',
    'serialNumber',
    'creationTransactionHash',
    'spendingTransactionHash',
    'rollupTransactionHash',
  ],
} as const;

const schemaTyped = toTypedRxJsonSchema(commitmentSchemaLiteral);

export type CommitmentType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
export const commitmentSchema: RxJsonSchema<CommitmentType> = commitmentSchemaLiteral;
