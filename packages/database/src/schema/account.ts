import { ExtractDocumentTypeFromTypedRxJsonSchema, RxJsonSchema, toTypedRxJsonSchema } from 'rxdb';
import { HEX_REGEX, WALLET_COLLECTION_NAME } from '../constants';

const accountSchemaLiteral = {
  version: 2,
  title: 'account schema',
  description: 'a document contains account information',
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
    name: {
      type: 'string',
      minLength: 1,
    },
    shieldedAddress: {
      type: 'string',
      maxLength: 128,
      final: true,
    },
    publicKey: {
      type: 'string',
      maxLength: 160,
      final: true,
      pattern: HEX_REGEX,
    },
    encryptedSecretKey: {
      type: 'string',
      minLength: 1,
    },
    status: {
      type: 'string',
      minLength: 1,
    },
    scanSize: {
      type: 'integer',
      minimum: 1,
    },
    scannedCommitmentId: {
      type: 'string',
      minimum: 1,
      maxLength: 32,
    },
    wallet: {
      type: 'string',
      maxLength: 32,
      ref: WALLET_COLLECTION_NAME,
    },
  },
  required: [
    'id',
    'createdAt',
    'updatedAt',
    'name',
    'shieldedAddress',
    'publicKey',
    'encryptedSecretKey',
    'status',
    'scanSize',
    'wallet',
  ],
  indexes: ['createdAt', 'updatedAt', 'shieldedAddress', 'publicKey'],
} as const;

const schemaTyped = toTypedRxJsonSchema(accountSchemaLiteral);

export type AccountType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
export const accountSchema: RxJsonSchema<AccountType> = accountSchemaLiteral;
