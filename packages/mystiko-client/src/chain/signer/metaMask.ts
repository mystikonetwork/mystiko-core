import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import { MystikoConfig } from '@mystiko/config';
import { check, logger as rootLogger } from '@mystiko/utils';
import { BaseSigner } from './base';

/**
 * @class MetaMaskSigner
 * @extends BaseSigner
 * @param {MystikoConfig} config full configuration of {@link MystikoConfig}
 * @param {any} [provider] low-level provider instance for operating the signer,
 * @desc a signer class wrapped {@link https://metamask.io Metamask} as a provider.
 */
export class MetaMaskSigner extends BaseSigner {
  constructor(config: MystikoConfig, provider?: any) {
    super(config, provider);
    this.logger = rootLogger.getLogger('MetaMaskSigner');
  }

  /**
   * @desc whether MetaMask is properly installed in user's browser.
   * @override
   * @returns {Promise<boolean>} true if it is installed properly, otherwise it returns false.
   */
  public async installed(): Promise<boolean> {
    const provider = await detectEthereumProvider().catch(() => undefined);
    return !!provider;
  }

  /**
   * @desc connect MetaMask by asking user permission from the browser.
   * @override
   * @param {ethers.providers.Web3Provider} [etherProvider] if provided it overrides
   * this default ethers.providers.Web3Provider constructor.
   * @returns {Promise<string[]>} an array of account addresses, which this signer offers.
   * @throws {Error} if MetaMask is not installed in this browser as an extension.
   */
  public async connect(etherProvider?: ethers.providers.Web3Provider): Promise<string[]> {
    if (!this.provider) {
      this.provider = await detectEthereumProvider().catch(() => undefined);
    }
    check(this.provider, 'MetaMask is not installed');
    return super.connect(etherProvider);
  }
}
