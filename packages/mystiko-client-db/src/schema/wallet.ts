import { ExtractDocumentTypeFromTypedRxJsonSchema, RxJsonSchema, toTypedRxJsonSchema } from 'rxdb';

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
      uniqueItems: true,
    },
    encryptedMasterSeed: {
      type: 'string',
    },
    hashedPassword: {
      type: 'string',
    },
    accountNonce: {
      type: 'integer',
      minimum: 0,
      default: 0,
    },
  },
  required: ['id', 'encryptedMasterSeed', 'hashedPassword', 'accountNonce'],
} as const;

const schemaTyped = toTypedRxJsonSchema(walletSchemaLiteral);

export type WalletType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
export const walletSchema: RxJsonSchema<WalletType> = walletSchemaLiteral;
