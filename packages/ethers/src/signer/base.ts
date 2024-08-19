import { ethers } from 'ethers';
import { Logger } from 'loglevel';
import { check, logger as rootLogger, toHex, toString } from '@mystikonetwork/utils';
import { ChainConfig, MystikoConfig } from '@mystikonetwork/config';

export interface MystikoSigner {
  get signer(): ethers.Signer;
  connected(): Promise<boolean>;
  installed(): Promise<boolean>;
  accounts(): Promise<string[]>;
  chainId(): Promise<string>;
  chainName(): Promise<string>;
  connect(etherProvider?: ethers.providers.Web3Provider): Promise<string[]>;
  switchChain(chainId: number, chainConfig: ChainConfig): Promise<void>;
  addListener(eventName: string, callback: (message: any) => void): void;
  removeListener(eventName: string, callback: (message: any) => void): void;
  signMessage(message: string): Promise<string>;
}

export class BaseSigner implements MystikoSigner {
  protected readonly config: MystikoConfig;

  protected provider?: any;

  protected etherProvider?: ethers.providers.Web3Provider;

  protected logger: Logger;

  constructor(config: MystikoConfig, provider?: any) {
    this.config = config;
    this.provider = provider;
    this.logger = rootLogger.getLogger('BaseSigner');
  }

  public get signer(): ethers.Signer {
    if (this.etherProvider) {
      return this.etherProvider.getSigner();
    }
    throw new Error('wallet is not connected');
  }

  public async connected(): Promise<boolean> {
    if (this.provider) {
      const acc = await this.accounts();
      return acc.length > 0;
    }
    return false;
  }

  public installed(): Promise<boolean> {
    return Promise.resolve(false);
  }

  public accounts(): Promise<string[]> {
    if (this.provider) {
      return this.provider.request({ method: 'eth_accounts' });
    }
    return Promise.reject(new Error('wallet is not connected'));
  }

  public chainId(): Promise<string> {
    if (this.provider) {
      return this.provider.request({ method: 'eth_chainId' });
    }
    return Promise.reject(new Error('wallet is not connected'));
  }

  public async chainName(): Promise<string> {
    if (this.provider) {
      const chainIdHex = await this.chainId();
      const chainConfig = this.config.getChainConfig(parseInt(chainIdHex, 16));
      return chainConfig?.name || 'Unsupported Network';
    }
    return Promise.reject(new Error('wallet is not connected'));
  }

  public async connect(etherProvider?: ethers.providers.Web3Provider): Promise<string[]> {
    if (this.provider) {
      const acc = await this.provider.request({ method: 'eth_requestAccounts' });
      if (acc.length > 0) {
        this.etherProvider = etherProvider || new ethers.providers.Web3Provider(this.provider);
        this.logger.info(`successfully connected to signer with account=${acc[0]}`);
      } else {
        this.logger.warn('failed to connect to signer, no account connected');
      }
      return acc;
    }
    return Promise.reject(new Error('wallet is not initialized'));
  }

  public async switchChain(chainId: number, chainConfig: ChainConfig): Promise<void> {
    if (this.provider) {
      check(chainId === chainConfig.chainId, 'chainId and chainConfig.chainId does not match');
      try {
        await this.provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: toHex(chainId) }],
        });
      } catch (error) {
        if ((error as { code?: number }).code === 4902) {
          await this.provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: toHex(chainId),
                chainName: chainConfig.name,
                rpcUrls: [chainConfig.signerEndpoint],
                blockExplorerUrls: [chainConfig.explorerUrl],
                nativeCurrency: {
                  name: chainConfig.assetSymbol,
                  symbol: chainConfig.assetSymbol,
                  decimals: chainConfig.assetDecimals,
                },
              },
            ],
          });
        } else {
          this.logger.error(`failed to switch to chain ${chainId}: ${toString(error)}`);
          throw error;
        }
      }
      check(toHex(chainId) === (await this.chainId()), 'chain has not been switched');
      await this.connect();
      this.logger.info(`successfully switch to chain ${chainId}`);
      return Promise.resolve();
    }
    return Promise.reject(new Error('wallet is not initialized'));
  }

  public addListener(eventName: string, callback: (message: any) => void) {
    if (this.provider) {
      this.provider.on(eventName, callback);
    }
  }

  public removeListener(eventName: string, callback: (message: any) => void) {
    if (this.provider) {
      this.provider.removeListener(eventName, callback);
    }
  }

  public async signMessage(message: string): Promise<string> {
    if (this.provider) {
      const accounts = await this.accounts();
      const from = accounts[0];
      const msg = `0x${Buffer.from(message, 'utf8').toString('hex')}`;
      return this.provider.request({ method: 'personal_sign', params: [msg, from] });
    }
    return Promise.reject(new Error('wallet is not connected'));
  }
}

export async function checkSigner(
  signer: MystikoSigner,
  chainId: number,
  config: MystikoConfig,
): Promise<void> {
  check(await signer.connected(), 'signer has not been connected');
  const signerChainId = await signer.chainId();
  const chainIdHex = toHex(chainId);
  const chainConfig = config.getChainConfig(chainId);
  if (chainConfig) {
    if (signerChainId !== chainIdHex) {
      await signer.switchChain(chainId, chainConfig);
    }
  } else {
    throw new Error(`chain ${chainId} does not exist in config`);
  }
  check(!!signer.signer, 'raw signer is undefined or null');
}
