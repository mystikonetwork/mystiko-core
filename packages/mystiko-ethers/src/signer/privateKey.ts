import { ethers } from 'ethers';
import { ChainConfig, MystikoConfig } from '@mystikonetwork/config';
import { check, logger as rootLogger, toHex, toHexNoPrefix } from '@mystikonetwork/utils';
import { ProviderPool } from '../provider';
import { BaseSigner } from './base';

export class PrivateKeySigner extends BaseSigner {
  private readonly providerPool: ProviderPool;

  constructor(config: MystikoConfig, providerPool: ProviderPool) {
    super(config);
    this.providerPool = providerPool;
    this.logger = rootLogger.getLogger('PrivateKeySigner');
  }

  public setPrivateKey(privateKey: string) {
    this.provider = new ethers.Wallet(toHexNoPrefix(privateKey));
  }

  public installed(): Promise<boolean> {
    return Promise.resolve(true);
  }

  public accounts(): Promise<string[]> {
    return Promise.resolve(this.provider ? [this.provider.address] : []);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars,require-await
  public async connect(etherProvider?: ethers.providers.Web3Provider): Promise<string[]> {
    return this.accounts();
  }

  public async chainId(): Promise<string> {
    if (this.provider && this.provider.provider) {
      const { chainId } = await this.provider.provider.getNetwork();
      return toHex(chainId);
    }
    return 'undefined';
  }

  public switchChain(chainId: number, chainConfig: ChainConfig): Promise<void> {
    check(chainId === chainConfig.chainId, `${chainId} !== ${chainConfig.chainId} chain id mismatch`);
    check(this.provider, 'you should call setPrivateKey before calling switchChain');
    const jsonRpcProvider = this.providerPool.getProvider(chainId);
    this.provider = this.provider.connect(jsonRpcProvider);
    this.logger.info(`successfully switched to chain ${chainId}`);
    return Promise.resolve();
  }

  public get signer(): ethers.Signer {
    return this.provider;
  }
}
