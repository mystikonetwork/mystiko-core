import { ethers } from 'ethers';
import { ChainConfig, MystikoConfig } from '@mystiko/config';
import { check, logger as rootLogger, toHex, toHexNoPrefix } from '@mystiko/utils';
import { ProviderPool } from '../provider';
import { BaseSigner } from './base';

/**
 * @class PrivateKeySigner
 * @extends BaseSigner
 * @param {string} privateKey a Ethereum-based private key string in hex.
 * @param {MystikoConfig} config full configuration of {@link MystikoConfig}
 * @param {ProviderPool} providerPool a pool of JSON-RPC providers
 * @desc a signer class which uses private key to sign transaction
 */
export class PrivateKeySigner extends BaseSigner {
  private readonly providerPool: ProviderPool;

  constructor(config: MystikoConfig, providerPool: ProviderPool) {
    super(config);
    this.providerPool = providerPool;
    this.logger = rootLogger.getLogger('PrivateKeySigner');
  }

  /**
   * @desc update the signer's private key.
   * @param {string} privateKey the private key to update.
   */
  public setPrivateKey(privateKey: string) {
    this.provider = new ethers.Wallet(toHexNoPrefix(privateKey));
  }

  /**
   * @desc whether this signer is properly installed.
   * @override
   * @returns {Promise<boolean>} true if it is installed properly, otherwise it returns false.
   */
  // eslint-disable-next-line class-methods-use-this
  public installed(): Promise<boolean> {
    return Promise.resolve(true);
  }

  /**
   * @desc get the connected list of accounts from this signer.
   * Current effective account is the first element of the returned array.
   * @override
   * @returns {Promise<string[]>} an array of account addresses.
   */
  public accounts(): Promise<string[]> {
    return Promise.resolve(this.provider ? [this.provider.address] : []);
  }

  /**
   * @desc connect the signer to a JSON-RPC provider.
   * @override
   * @param {ethers.providers.Web3Provider} [etherProvider] if provided it overrides
   * this default ethers.providers.Web3Provider constructor.
   * @returns {Promise<string[]>} an array of account addresses, which this signer offers.
   * @throws {Error} if MetaMask is not installed in this browser as an extension.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,require-await
  public async connect(etherProvider?: ethers.providers.Web3Provider): Promise<string[]> {
    return this.accounts();
  }

  /**
   * @desc get current active chain id of the signer in hex string with prefix '0x'.
   * @returns {Promise<string>} chain id
   * @override
   * @throws {Error} if this signer has not been connected.
   */
  public async chainId(): Promise<string> {
    if (this.provider && this.provider.provider) {
      const { chainId } = await this.provider.provider.getNetwork();
      return toHex(chainId);
    }
    return 'undefined';
  }

  /**
   * @desc switch current connected signer to a different blockchain network.
   * @override
   * @param {number} chainId the chain id to switch to.
   * @param {ChainConfig} chainConfig configuration of the chain to switch to.
   * @returns {Promise<void>}
   * @throws {Error} if the signer is not properly initialized, or failed to switch to the requested chain.
   */
  public switchChain(chainId: number, chainConfig: ChainConfig): Promise<void> {
    check(chainId === chainConfig.chainId, `${chainId} !== ${chainConfig.chainId} chain id mismatch`);
    check(this.provider, 'you should call setPrivateKey before calling switchChain');
    const jsonRpcProvider = this.providerPool.getProvider(chainId);
    this.provider = this.provider.connect(jsonRpcProvider);
    this.logger.info(`successfully switched to chain ${chainId}`);
    return Promise.resolve();
  }

  /**
   * @property {ethers.Signer} signer
   * @override
   * @desc get the ethers.Signer instance of this wrapped signer instance.
   * @throws {Error} if the signer has not been connected.
   */
  public get signer(): ethers.Signer {
    return this.provider;
  }
}
