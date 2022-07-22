import { ExtractDocumentTypeFromTypedRxJsonSchema, RxJsonSchema, toTypedRxJsonSchema } from 'rxdb';
import {
  BN_REGEX,
  ETH_ADDRESS_REGEX,
  ETH_TX_HASH_REGEX,
  HEX_REGEX,
  WALLET_COLLECTION_NAME,
} from '../constants';

const depositSchemaLiteral = {
  version: 2,
  title: 'deposit schema',
  description: 'a document contains deposit information',
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
    poolAddress: {
      type: 'string',
      final: true,
      pattern: ETH_ADDRESS_REGEX,
    },
    commitmentHash: {
      type: 'string',
      maxLength: 128,
      final: true,
      pattern: BN_REGEX,
    },
    hashK: {
      type: 'string',
      final: true,
      pattern: BN_REGEX,
    },
    randomS: {
      type: 'string',
      final: true,
      pattern: BN_REGEX,
    },
    encryptedNote: {
      type: 'string',
      final: true,
      pattern: HEX_REGEX,
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
    bridgeFeeAssetAddress: {
      type: 'string',
      pattern: ETH_ADDRESS_REGEX,
    },
    executorFeeAmount: {
      type: 'string',
      final: true,
      pattern: BN_REGEX,
    },
    executorFeeAssetAddress: {
      type: 'string',
      pattern: ETH_ADDRESS_REGEX,
    },
    serviceFeeAmount: {
      type: 'string',
      final: true,
      pattern: BN_REGEX,
    },
    shieldedRecipientAddress: {
      type: 'string',
      maxLength: 128,
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
      maxLength: 32,
      ref: WALLET_COLLECTION_NAME,
      final: true,
    },
    dstChainId: {
      type: 'integer',
      minimum: 0,
      maximum: 1e32,
      multipleOf: 1,
      final: true,
    },
    dstChainContractAddress: {
      type: 'string',
      maxLength: 64,
      pattern: ETH_ADDRESS_REGEX,
      final: true,
    },
    dstPoolAddress: {
      type: 'string',
      final: true,
      pattern: ETH_ADDRESS_REGEX,
    },
    assetApproveTransactionHash: {
      type: 'string',
      maxLength: 128,
      pattern: ETH_TX_HASH_REGEX,
    },
    transactionHash: {
      type: 'string',
      maxLength: 128,
      pattern: ETH_TX_HASH_REGEX,
    },
    relayTransactionHash: {
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
    'poolAddress',
    'commitmentHash',
    'hashK',
    'randomS',
    'encryptedNote',
    'assetSymbol',
    'assetDecimals',
    'bridgeType',
    'amount',
    'bridgeFeeAmount',
    'executorFeeAmount',
    'rollupFeeAmount',
    'serviceFeeAmount',
    'shieldedRecipientAddress',
    'dstChainId',
    'dstChainContractAddress',
    'dstPoolAddress',
    'status',
    'wallet',
  ],
  indexes: [
    'createdAt',
    'updatedAt',
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
