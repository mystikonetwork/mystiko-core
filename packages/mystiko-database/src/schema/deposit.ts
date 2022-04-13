import { ExtractDocumentTypeFromTypedRxJsonSchema, RxJsonSchema, toTypedRxJsonSchema } from 'rxdb';
import { BN_REGEX, ETH_ADDRESS_REGEX, ETH_TX_HASH_REGEX, WALLET_COLLECTION_NAME } from '../constants';

const depositSchemaLiteral = {
  version: 0,
  title: 'deposit schema',
  description: 'a document contains deposit information',
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
      final: true,
    },
    amount: {
      type: 'string',
      final: true,
      pattern: BN_REGEX,
    },
    rollupFeeAmount: {
      type: 'string',
      final: true,
      pattern: BN_REGEX,
    },
    bridgeFeeAmount: {
      type: 'string',
      final: true,
      pattern: BN_REGEX,
    },
    executorFeeAmount: {
      type: 'string',
      final: true,
      pattern: BN_REGEX,
    },
    shieldedRecipientAddress: {
      type: 'string',
      minLength: 1,
      final: true,
    },
    status: {
      type: 'string',
      minLength: 1,
    },
    errorMessage: {
      type: 'string',
    },
    wallet: {
      type: 'string',
      ref: WALLET_COLLECTION_NAME,
      final: true,
    },
    dstChainId: {
      type: 'integer',
      minimum: 0,
    },
    dstChainContractAddress: {
      type: 'string',
      pattern: ETH_ADDRESS_REGEX,
    },
    assetApproveTransactionHash: {
      type: 'string',
      pattern: ETH_TX_HASH_REGEX,
    },
    transactionHash: {
      type: 'string',
      pattern: ETH_TX_HASH_REGEX,
    },
    relayTransactionHash: {
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
    'commitmentHash',
    'assetSymbol',
    'assetDecimals',
    'bridgeType',
    'amount',
    'bridgeFeeAmount',
    'executorFeeAmount',
    'rollupFeeAmount',
    'shieldedRecipientAddress',
    'status',
    'wallet',
  ],
  indexes: [
    'chainId',
    'contractAddress',
    'commitmentHash',
    'dstChainId',
    'dstChainContractAddress',
    'shieldedRecipientAddress',
    'assetApproveTransactionHash',
    'transactionHash',
    'relayTransactionHash',
    'rollupTransactionHash',
  ],
} as const;

const schemaTyped = toTypedRxJsonSchema(depositSchemaLiteral);

export type DepositType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
export const depositSchema: RxJsonSchema<DepositType> = depositSchemaLiteral;
