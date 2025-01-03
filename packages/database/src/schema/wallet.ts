import { ExtractDocumentTypeFromTypedRxJsonSchema, RxJsonSchema, toTypedRxJsonSchema } from 'rxdb';
import { HEX_REGEX } from '../constants';

const walletSchemaLiteral = {
  version: 4,
  title: 'wallet schema',
  description: 'a document contains wallet information',
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
    encryptedMasterSeed: {
      type: 'string',
      minLength: 1,
    },
    hashedPassword: {
      type: 'string',
      pattern: HEX_REGEX,
    },
    accountNonce: {
      type: 'integer',
      minimum: 0,
      default: 0,
    },
    autoSync: {
      type: 'boolean',
      default: false,
    },
    autoSyncInterval: {
      type: 'number',
      minimum: 60000,
      default: 300000,
    },
    fullSynchronization: {
      type: 'boolean',
      default: false,
    },
    fullSynchronizationOptions: {
      type: 'string',
    },
  },
  required: ['id', 'createdAt', 'updatedAt', 'encryptedMasterSeed', 'hashedPassword', 'accountNonce'],
  indexes: ['createdAt', 'updatedAt'],
} as const;

const schemaTyped = toTypedRxJsonSchema(walletSchemaLiteral);

export type WalletType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
export const walletSchema: RxJsonSchema<WalletType> = walletSchemaLiteral;
