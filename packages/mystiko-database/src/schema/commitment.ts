import { ExtractDocumentTypeFromTypedRxJsonSchema, RxJsonSchema, toTypedRxJsonSchema } from 'rxdb';
import { BN_REGEX, ETH_ADDRESS_REGEX, ETH_TX_HASH_REGEX, HEX_REGEX } from '../constants';

const commitmentSchemaLiteral = {
  version: 0,
  title: 'commitment schema',
  description: 'a document contains commitment information',
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
    commitmentHash: {
      type: 'string',
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
    bridgeType: {
      type: 'string',
      minLength: 1,
      final: true,
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
      pattern: BN_REGEX,
    },
    shieldedAddress: {
      type: 'string',
      minLength: 1,
    },
    srcChainId: {
      type: 'integer',
      minimum: 0,
    },
    srcChainContractAddress: {
      type: 'string',
      pattern: ETH_ADDRESS_REGEX,
    },
    srcAssetSymbol: {
      type: 'string',
      minLength: 1,
    },
    srcAssetDecimals: {
      type: 'integer',
      minimum: 1,
    },
    srcAssetAddress: {
      type: 'string',
      pattern: ETH_ADDRESS_REGEX,
    },
    creationTransactionHash: {
      type: 'string',
      pattern: ETH_TX_HASH_REGEX,
    },
    relayTransactionHash: {
      type: 'string',
      pattern: ETH_TX_HASH_REGEX,
    },
    spendingTransactionHash: {
      type: 'string',
      pattern: ETH_TX_HASH_REGEX,
    },
    rollupTransactionHash: {
      type: 'string',
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
    'bridgeType',
    'srcChainId',
    'srcChainContractAddress',
    'srcAssetSymbol',
    'srcAssetDecimals',
    'commitmentHash',
    'status',
  ],
  indexes: [
    'chainId',
    'contractAddress',
    'commitmentHash',
    'srcChainId',
    'srcChainContractAddress',
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
