import { ExtractDocumentTypeFromTypedRxJsonSchema, RxJsonSchema, toTypedRxJsonSchema } from 'rxdb';
import { HEX_REGEX, WALLET_COLLECTION_NAME } from '../constants';

const accountSchemaLiteral = {
  version: 0,
  title: 'account schema',
  description: 'a document contains account information',
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
    shieldedAddress: {
      type: 'string',
      final: true,
    },
    publicKey: {
      type: 'string',
      final: true,
      pattern: HEX_REGEX,
    },
    encryptedSecretKey: {
      type: 'string',
      minLength: 1,
    },
    wallet: {
      type: 'string',
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
    'wallet',
  ],
  indexes: ['shieldedAddress', 'publicKey'],
} as const;

const schemaTyped = toTypedRxJsonSchema(accountSchemaLiteral);

export type AccountType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
export const accountSchema: RxJsonSchema<AccountType> = accountSchemaLiteral;
