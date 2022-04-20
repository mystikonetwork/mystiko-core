import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import { MystikoConfig } from '@mystikonetwork/config';
import { check, logger as rootLogger } from '@mystikonetwork/utils';
import { BaseSigner } from './base';

export class MetaMaskSigner extends BaseSigner {
  constructor(config: MystikoConfig, provider?: any) {
    super(config, provider);
    this.logger = rootLogger.getLogger('MetaMaskSigner');
  }

  public async installed(): Promise<boolean> {
    const provider = await detectEthereumProvider().catch(() => undefined);
    return !!provider;
  }

  public async connect(etherProvider?: ethers.providers.Web3Provider): Promise<string[]> {
    if (!this.provider) {
      this.provider = await detectEthereumProvider().catch(() => undefined);
    }
    check(this.provider, 'MetaMask is not installed');
    return super.connect(etherProvider);
  }
}
