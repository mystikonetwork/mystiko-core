import { RxDocument } from 'rxdb';
import { MystikoProtocol } from '@mystikonetwork/protocol';
import { toBuff } from '@mystikonetwork/utils';
import { AccountType } from '../schema';

export type AccountMethods = {
  publicKeyForVerification: (protocol: MystikoProtocol) => Buffer;
  publicKeyForEncryption: (protocol: MystikoProtocol) => Buffer;
  secretKeyForVerification: (protocol: MystikoProtocol, password: string) => Buffer;
  secretKeyForEncryption: (protocol: MystikoProtocol, password: string) => Buffer;
};

export type Account = RxDocument<AccountType, AccountMethods>;
export const accountMethods: AccountMethods = {
  publicKeyForVerification(this: Account, protocol: MystikoProtocol): Buffer {
    const publicKeyBuffer = toBuff(this.publicKey);
    const { pkVerify } = protocol.separatedPublicKeys(publicKeyBuffer);
    return pkVerify;
  },
  publicKeyForEncryption(this: Account, protocol: MystikoProtocol): Buffer {
    const publicKeyBuffer = toBuff(this.publicKey);
    const { pkEnc } = protocol.separatedPublicKeys(publicKeyBuffer);
    return pkEnc;
  },
  secretKeyForVerification(this: Account, protocol: MystikoProtocol, password: string): Buffer {
    const secretKeyDecrypted = protocol.decryptSymmetric(password, this.encryptedSecretKey);
    const secretKeyBuffer = toBuff(secretKeyDecrypted);
    const { skVerify } = protocol.separatedSecretKeys(secretKeyBuffer);
    return skVerify;
  },
  secretKeyForEncryption(this: Account, protocol: MystikoProtocol, password: string): Buffer {
    const secretKeyDecrypted = protocol.decryptSymmetric(password, this.encryptedSecretKey);
    const secretKeyBuffer = toBuff(secretKeyDecrypted);
    const { skEnc } = protocol.separatedSecretKeys(secretKeyBuffer);
    return skEnc;
  },
};
