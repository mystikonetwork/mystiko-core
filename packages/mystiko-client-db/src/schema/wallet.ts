import { ExtractDocumentTypeFromTypedRxJsonSchema, RxJsonSchema, toTypedRxJsonSchema } from 'rxdb';
import { HEX_REGEX } from '../constants';

const walletSchemaLiteral = {
  version: 0,
  title: 'wallet schema',
  description: 'a document contains wallet information',
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
    encryptedMasterSeed: {
      type: 'string',
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
  },
  required: ['id', 'createdAt', 'updatedAt', 'encryptedMasterSeed', 'hashedPassword', 'accountNonce'],
} as const;

const schemaTyped = toTypedRxJsonSchema(walletSchemaLiteral);

export type WalletType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
export const walletSchema: RxJsonSchema<WalletType> = walletSchemaLiteral;
