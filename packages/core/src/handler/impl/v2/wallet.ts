import { Wallet, WalletType } from '@mystikonetwork/database';
import { errorMessage } from '@mystikonetwork/utils';
import { isHexadecimal } from 'class-validator';
import { createErrorPromise, MystikoErrorCode } from '../../../error';
import {
  FullSynchronizationAssetOptions,
  FullSynchronizationChainOptions,
  FullSynchronizationOptions,
  MystikoContextInterface,
  WalletHandler,
  WalletOptions,
} from '../../../interface';
import { MystikoHandler } from '../../handler';

export class WalletHandlerV2 extends MystikoHandler implements WalletHandler {
  public static readonly PASSWORD_REGEX = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;

  public static readonly PASSWORD_HINT =
    'the password must contain ' +
    'at least one upper case letter, ' +
    'one lower case letter, ' +
    'one number digit, ' +
    'one special character in [#?!@$%^&*-], ' +
    'and the length should be as least 8';

  public static readonly MIN_AUTO_SYNC_INTERVAL_SECONDS = 60000;

  constructor(context: MystikoContextInterface) {
    super(context);
    this.context.wallets = this;
  }

  public checkCurrent(): Promise<Wallet> {
    return this.current().then((wallet) => {
      if (wallet) {
        return wallet;
      }
      return createErrorPromise('no existing wallet in database', MystikoErrorCode.NON_EXISTING_WALLET);
    });
  }

  public checkPassword(password: string): Promise<Wallet> {
    return this.current().then((wallet) => {
      if (wallet == null) {
        return createErrorPromise('no existing wallet in database', MystikoErrorCode.NON_EXISTING_WALLET);
      }
      if (this.checkPasswordHash(password, wallet)) {
        return wallet;
      }
      return createErrorPromise('wrong wallet password', MystikoErrorCode.WRONG_PASSWORD);
    });
  }

  public create(options: WalletOptions): Promise<Wallet> {
    if (!isHexadecimal(options.masterSeed)) {
      return createErrorPromise(
        'masterSeed should be a valid hexadecimal string',
        MystikoErrorCode.INVALID_MASTER_SEED,
      );
    }
    if (!WalletHandlerV2.validatePassword(options.password)) {
      return createErrorPromise(WalletHandlerV2.PASSWORD_HINT, MystikoErrorCode.INVALID_PASSWORD);
    }
    const now = MystikoHandler.now();
    const rawWallet: WalletType = {
      id: MystikoHandler.generateId(),
      createdAt: now,
      updatedAt: now,
      hashedPassword: this.protocol.checkSum(options.password),
      encryptedMasterSeed: this.protocol.encryptSymmetric(options.password, options.masterSeed),
      accountNonce: 0,
      fullSynchronization: options.fullSynchronization,
    };
    return this.db.wallets.insert(rawWallet).then((wallet) => {
      this.logger.info(`successfully created a wallet(id=${wallet.id})`);
      return wallet;
    });
  }

  public current(): Promise<Wallet | null> {
    return this.db.wallets.findOne({ selector: {}, sort: [{ createdAt: 'desc' }] }).exec();
  }

  public exportMasterSeed(password: string): Promise<string> {
    return this.checkPassword(password).then((wallet) => wallet.masterSeed(this.protocol, password));
  }

  public updatePassword(oldPassword: string, newPassword: string): Promise<Wallet> {
    return this.checkPassword(oldPassword).then((wallet) => {
      if (!WalletHandlerV2.validatePassword(newPassword)) {
        return createErrorPromise(WalletHandlerV2.PASSWORD_HINT, MystikoErrorCode.INVALID_PASSWORD);
      }
      const masterSeed = this.protocol.decryptSymmetric(oldPassword, wallet.encryptedMasterSeed);
      return wallet.atomicUpdate((data) => {
        data.encryptedMasterSeed = this.protocol.encryptSymmetric(newPassword, masterSeed);
        data.hashedPassword = this.protocol.checkSum(newPassword);
        data.updatedAt = MystikoHandler.now();
        return data;
      });
    });
  }

  public autoSync(enable: boolean): Promise<Wallet> {
    return this.checkCurrent().then((wallet) =>
      wallet.atomicUpdate((data) => {
        data.autoSync = enable;
        data.updatedAt = MystikoHandler.now();
        return data;
      }),
    );
  }

  public autoSyncInterval(intervalSeconds: number): Promise<Wallet> {
    if (intervalSeconds < WalletHandlerV2.MIN_AUTO_SYNC_INTERVAL_SECONDS) {
      return createErrorPromise(
        `Auto sync interval should not be less than ${WalletHandlerV2.MIN_AUTO_SYNC_INTERVAL_SECONDS}`,
        MystikoErrorCode.INVALID_AUTO_SYNC_INTERVAL,
      );
    }
    return this.checkCurrent().then((wallet) =>
      wallet.atomicUpdate((data) => {
        data.autoSyncInterval = intervalSeconds;
        data.updatedAt = MystikoHandler.now();
        return data;
      }),
    );
  }

  public fullSynchronization(enable: boolean): Promise<Wallet> {
    return this.checkCurrent().then((wallet) =>
      wallet.atomicUpdate((data) => {
        data.fullSynchronization = enable;
        data.updatedAt = MystikoHandler.now();
        return data;
      }),
    );
  }

  public getFullSynchronizationOptions(): Promise<FullSynchronizationOptions> {
    return this.checkCurrent().then((wallet) => {
      const defaultOptions = this.defaultFullSynchronizationOptions();
      try {
        const options: FullSynchronizationOptions | undefined = wallet.fullSynchronizationOptions
          ? JSON.parse(wallet.fullSynchronizationOptions)
          : undefined;
        if (options) {
          return WalletHandlerV2.mergeFullSynchronizationOptions(defaultOptions, options);
        }
      } catch (error) {
        this.logger.warn(`failed to deserialize saved full synchronization options: ${errorMessage(error)}`);
      }
      return defaultOptions;
    });
  }

  public setFullSynchronizationOptions(options: FullSynchronizationOptions): Promise<Wallet> {
    return this.checkCurrent().then((wallet) => {
      const defaultOptions = this.defaultFullSynchronizationOptions();
      const mergedOptions = WalletHandlerV2.mergeFullSynchronizationOptions(defaultOptions, options);
      return wallet.atomicUpdate((data) => {
        data.fullSynchronizationOptions = JSON.stringify(mergedOptions);
        data.updatedAt = MystikoHandler.now();
        return data;
      });
    });
  }

  private checkPasswordHash(password: string, wallet: Wallet | null): boolean {
    return wallet != null && this.protocol.checkSum(password) === wallet.hashedPassword;
  }

  private defaultFullSynchronizationOptions(): FullSynchronizationOptions {
    const chains: FullSynchronizationChainOptions[] = [];
    this.context.config.chains.forEach((chainConfig) => {
      const chainOptions: FullSynchronizationChainOptions = {
        chainId: chainConfig.chainId,
        name: chainConfig.name,
        assets: [],
        enabled: false,
      };
      const assetsMap: Map<string, FullSynchronizationAssetOptions> = new Map();
      [...chainConfig.depositContracts, ...chainConfig.poolContracts].forEach((contractConfig) => {
        const assetOptions = assetsMap.get(contractConfig.assetSymbol) || {
          assetSymbol: contractConfig.assetSymbol,
          enabled: false,
        };
        assetsMap.set(contractConfig.assetSymbol, assetOptions);
      });
      chainOptions.assets = WalletHandlerV2.sortFullSynchronizationAssetOptions(
        Array.from(assetsMap.values()),
      );
      chains.push(chainOptions);
    });
    return { chains: WalletHandlerV2.sortFullSynchronizationChainOptions(chains) };
  }

  private static validatePassword(password: string): boolean {
    return password.match(WalletHandlerV2.PASSWORD_REGEX) != null;
  }

  private static mergeFullSynchronizationOptions(
    first: FullSynchronizationOptions,
    second: FullSynchronizationOptions,
  ): FullSynchronizationOptions {
    const chainsMap: Map<number, FullSynchronizationChainOptions> = new Map();
    first.chains.forEach((chainOptions) => {
      chainsMap.set(chainOptions.chainId, chainOptions);
    });
    second.chains.forEach((chainOptions) => {
      const savedChainOptions = chainsMap.get(chainOptions.chainId);
      if (savedChainOptions) {
        const assetsMap: Map<string, FullSynchronizationAssetOptions> = new Map();
        savedChainOptions.assets.forEach((assetOptions) => {
          assetsMap.set(assetOptions.assetSymbol, assetOptions);
        });
        chainOptions.assets.forEach((assetOptions) => {
          const savedAssetOptions = assetsMap.get(assetOptions.assetSymbol);
          if (savedAssetOptions) {
            assetsMap.set(assetOptions.assetSymbol, {
              ...savedAssetOptions,
              ...assetOptions,
            });
          } else {
            assetsMap.set(assetOptions.assetSymbol, assetOptions);
          }
        });
        chainsMap.set(chainOptions.chainId, {
          ...savedChainOptions,
          ...chainOptions,
          assets: WalletHandlerV2.sortFullSynchronizationAssetOptions(Array.from(assetsMap.values())),
        });
      } else {
        chainsMap.set(chainOptions.chainId, chainOptions);
      }
    });
    return {
      ...first,
      ...second,
      chains: WalletHandlerV2.sortFullSynchronizationChainOptions(Array.from(chainsMap.values())),
    };
  }

  private static sortFullSynchronizationChainOptions(
    chainsOptions: FullSynchronizationChainOptions[],
  ): FullSynchronizationChainOptions[] {
    return chainsOptions.sort((a, b) => a.chainId - b.chainId);
  }

  private static sortFullSynchronizationAssetOptions(
    assetsOptions: FullSynchronizationAssetOptions[],
  ): FullSynchronizationAssetOptions[] {
    return assetsOptions.sort((a, b) => a.assetSymbol.localeCompare(b.assetSymbol));
  }
}
