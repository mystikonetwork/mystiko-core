import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import { MystikoConfig, ChainConfig } from '../config';
import { check, toHex } from '../utils.js';

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
    if (this.provider) {
      const acc = await this.accounts();
      return acc.length > 0;
    }
    return false;
  }

  async installed() {
    return await new Promise((resolve) => resolve(false));
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
      this.etherProvider = etherProvider ? etherProvider : new ethers.providers.Web3Provider(this.provider);
    }
    return acc;
  }

  async switchChain(chainId, chainConfig) {
    check(this.provider, 'wallet is not initialized');
    check(typeof chainId === 'number', 'chainId should be a number');
    check(chainConfig instanceof ChainConfig, 'chainConfig should be instance of ChainConfig');
    check(chainId === chainConfig.chainId, 'chainId and chainConfig.chainId does not match');
    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: toHex(chainId) }],
      });
    } catch (error) {
      if (error.code === 4902) {
        await this.provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: toHex(chainId),
              chainName: chainConfig.name,
              rpcUrls: chainConfig.providers,
              blockExplorerUrls: [chainConfig.explorerUrl],
            },
          ],
        });
      } else {
        throw error;
      }
    }
    check(toHex(chainId) === (await this.chainId()), 'chain has not been switched');
  }
}

export class MetaMaskSigner extends BaseSigner {
  constructor(config, provider = undefined) {
    super(config, provider);
  }

  async installed() {
    const provider = await detectEthereumProvider().catch(() => undefined);
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

export async function checkSigner(signer, chainId, config) {
  check(signer instanceof BaseSigner, 'signer should be instance of BaseSigner');
  check(await signer.connected(), 'signer has not been connected');
  check(config instanceof MystikoConfig, 'chainConfig should be instance of MystikoConfig');
  const signerChainId = await signer.chainId();
  const chainIdHex = toHex(chainId);
  if (signerChainId !== chainIdHex) {
    await signer.switchChain(chainId, config.getChainConfig(chainId));
  }
}
