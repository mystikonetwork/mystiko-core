import { ExtractDocumentTypeFromTypedRxJsonSchema, RxJsonSchema, toTypedRxJsonSchema } from 'rxdb';
import { BN_REGEX, CIRCUIT_COLLECTION_NAME, ETH_ADDRESS_REGEX } from '../constants';

const contractSchemaLiteral = {
  version: 0,
  title: 'contract schema',
  description: 'a document contains contract information',
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
      minimum: 0,
    },
    contractAddress: {
      type: 'string',
      pattern: ETH_ADDRESS_REGEX,
    },
    assetSymbol: {
      type: 'string',
      minLength: 1,
    },
    assetDecimals: {
      type: 'integer',
      minimum: 1,
    },
    assetAddress: {
      type: 'string',
      pattern: ETH_ADDRESS_REGEX,
    },
    bridgeType: {
      type: 'string',
      minLength: 1,
    },
    peerChainId: {
      type: 'integer',
      minimum: 0,
    },
    peerContractAddress: {
      type: 'string',
      pattern: ETH_ADDRESS_REGEX,
    },
    minRollupFeeAmount: {
      type: 'string',
      pattern: BN_REGEX,
    },
    minBridgeFeeAmount: {
      type: 'string',
      pattern: BN_REGEX,
    },
    minExecutorFeeAmount: {
      type: 'string',
      pattern: BN_REGEX,
    },
    depositDisabled: {
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
    circuits: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'string',
        ref: CIRCUIT_COLLECTION_NAME,
      },
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
    'minRollupFeeAmount',
    'minBridgeFeeAmount',
    'minExecutorFeeAmount',
    'depositDisabled',
    'syncStart',
    'syncedBlockNumber',
    'circuits',
  ],
  indexes: ['chainId', 'contractAddress', 'peerChainId', 'peerContractAddress'],
} as const;

const schemaTyped = toTypedRxJsonSchema(contractSchemaLiteral);

export type ContractType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
export const contractSchema: RxJsonSchema<ContractType> = contractSchemaLiteral;
