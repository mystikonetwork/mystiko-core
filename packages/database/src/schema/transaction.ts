import { ExtractDocumentTypeFromTypedRxJsonSchema, RxJsonSchema, toTypedRxJsonSchema } from 'rxdb';
import {
  BN_REGEX,
  COMMITMENT_COLLECTION_NAME,
  ETH_ADDRESS_REGEX,
  ETH_TX_HASH_REGEX,
  HEX_REGEX,
  WALLET_COLLECTION_NAME,
} from '../constants';

const transactionLiteral = {
  version: 2,
  title: 'transaction schema',
  description: 'a document contains transaction information',
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
    proof: {
      type: 'string',
      minLength: 1,
    },
    rootHash: {
      type: 'string',
      maxLength: 128,
      pattern: BN_REGEX,
    },
    inputCommitments: {
      type: 'array',
      final: true,
      minItems: 1,
      uniqueItems: true,
      ref: COMMITMENT_COLLECTION_NAME,
      items: {
        type: 'string',
      },
    },
    outputCommitments: {
      type: 'array',
      final: true,
      uniqueItems: true,
      ref: COMMITMENT_COLLECTION_NAME,
      items: {
        type: 'string',
      },
    },
    serialNumbers: {
      type: 'array',
      minItems: 1,
      uniqueItems: true,
      items: {
        type: 'string',
      },
    },
    signaturePublicKey: {
      type: 'string',
      maxLength: 128,
      pattern: HEX_REGEX,
    },
    signaturePublicKeyHashes: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'string',
        pattern: BN_REGEX,
      },
    },
    amount: {
      type: 'string',
      final: true,
      pattern: BN_REGEX,
    },
    publicAmount: {
      type: 'string',
      final: true,
      pattern: BN_REGEX,
    },
    rollupFeeAmount: {
      type: 'string',
      final: true,
      pattern: BN_REGEX,
    },
    gasRelayerFeeAmount: {
      type: 'string',
      final: true,
      pattern: BN_REGEX,
    },
    shieldedAddress: {
      type: 'string',
      maxLength: 128,
      minLength: 1,
    },
    publicAddress: {
      type: 'string',
      maxLength: 64,
      pattern: ETH_ADDRESS_REGEX,
    },
    gasRelayerAddress: {
      type: 'string',
      pattern: ETH_ADDRESS_REGEX,
    },
    signature: {
      type: 'string',
      pattern: HEX_REGEX,
    },
    randomAuditingPublicKey: {
      type: 'string',
      pattern: BN_REGEX,
    },
    encryptedAuditorNotes: {
      type: 'array',
      items: {
        type: 'string',
        pattern: BN_REGEX,
      },
    },
    type: {
      type: 'string',
      maxLength: 32,
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
    transactionHash: {
      type: 'string',
      maxLength: 128,
      pattern: ETH_TX_HASH_REGEX,
    },
    wallet: {
      type: 'string',
      maxLength: 32,
      ref: WALLET_COLLECTION_NAME,
      final: true,
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
    'inputCommitments',
    'amount',
    'publicAmount',
    'rollupFeeAmount',
    'gasRelayerFeeAmount',
    'type',
    'status',
    'wallet',
  ],
  indexes: [
    'createdAt',
    'updatedAt',
    'chainId',
    'contractAddress',
    'signaturePublicKey',
    'rootHash',
    'shieldedAddress',
    'publicAddress',
    'transactionHash',
    'type',
    'wallet',
  ],
} as const;

const schemaTyped = toTypedRxJsonSchema(transactionLiteral);

export type TransactionType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
export const transactionSchema: RxJsonSchema<TransactionType> = transactionLiteral;
