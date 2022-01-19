import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import { MystikoConfig } from '../config';
import { check } from '../utils.js';

export class BaseSigner {
  constructor(config, provider = undefined) {
    check(config instanceof MystikoConfig, 'config should be instance of MystikoConfig');
    this.config = config;
    this.provider = provider;
  }

  get signer() {
    check(this.etherProvider, 'wallet is not connected');
    return this.etherProvider.getSigner();
  }

  async connected() {
    return await new Promise((resolve) => resolve(true));
  }

  async installed() {
    return await new Promise((resolve) => resolve(true));
  }

  async accounts() {
    check(this.provider, 'wallet is not connected');
    return await this.provider.request({ method: 'eth_accounts' });
  }

  async chainId() {
    check(this.provider, 'wallet is not connected');
    return await this.provider.request({ method: 'eth_chainId' });
  }

  async connect(etherProvider = undefined) {
    check(this.provider, 'wallet is not initialized');
    const acc = await this.provider.request({ method: 'eth_requestAccounts' });
    if (acc.length > 0) {
      // failed to get accounts, should fall back to disconnected.
      this.etherProvider = etherProvider ? etherProvider : new ethers.providers.Web3Provider(this.provider);
    }
    return acc;
  }

  async disconnect() {
    return await new Promise();
  }
}

export class MetaMaskSigner extends BaseSigner {
  constructor(config, provider = undefined) {
    super(config, provider);
  }

  async connected() {
    if (this.provider) {
      const acc = await this.accounts();
      return acc.length > 0;
    }
    return false;
  }

  async installed() {
    const provider = await detectEthereumProvider();
    return !!provider;
  }

  async connect(etherProvider = undefined) {
    if (!this.provider) {
      this.provider = await detectEthereumProvider();
    }
    check(this.provider, 'MetaMask is not installed');
    return await super.connect(etherProvider);
  }
}
