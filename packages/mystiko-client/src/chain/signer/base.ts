import { ethers } from 'ethers';
import { Logger } from 'loglevel';
import { check, logger as rootLogger, toHex, toString } from '@mystiko/utils';
import { ChainConfig, MystikoConfig } from '@mystiko/config';

/**
 * @class BaseSigner
 * @desc base signer wrapping class for signing transaction sent to blockchain.
 * @param {MystikoConfig} config full configuration of {@link MystikoConfig}
 * @param {any} [provider] low-level provider instance for operating the signer,
 * e.g. {@link https://docs.metamask.io/guide/ethereum-provider.html window.ethereum}
 */
export class BaseSigner {
  protected readonly config: MystikoConfig;

  protected provider?: any;

  protected etherProvider?: ethers.providers.Web3Provider;

  protected logger: Logger;

  constructor(config: MystikoConfig, provider?: any) {
    this.config = config;
    this.provider = provider;
    this.logger = rootLogger.getLogger('BaseSigner');
  }

  /**
   * @property {ethers.Signer} signer
   * @desc get the ethers.Signer instance of this wrapped signer instance.
   * @throws {Error} if the signer has not been connected.
   */
  public get signer(): ethers.Signer {
    if (this.etherProvider) {
      return this.etherProvider.getSigner();
    }
    throw new Error('wallet is not connected');
  }

  /**
   * @desc whether this signer is connected, and it can be signing transaction.
   * @returns {Promise<boolean>} true if it is connected, otherwise it returns false.
   */
  public async connected(): Promise<boolean> {
    if (this.provider) {
      const acc = await this.accounts();
      return acc.length > 0;
    }
    return false;
  }

  /**
   * @desc whether this signer is properly installed in user's browser.
   * @returns {Promise<boolean>} true if it is installed properly, otherwise it returns false.
   */
  public installed(): Promise<boolean> {
    return Promise.resolve(false);
  }

  /**
   * @desc get the connected list of accounts from this signer.
   * Current effective account is the first element of the returned array.
   * @returns {Promise<string[]>} an array of account addresses.
   * @throws {Error} if this signer has not been connected.
   */
  public accounts(): Promise<string[]> {
    if (this.provider) {
      return this.provider.request({ method: 'eth_accounts' });
    }
    return Promise.reject(new Error('wallet is not connected'));
  }

  /**
   * @desc get current active chain id of the signer in hex string with prefix '0x'.
   * @returns {Promise<string>} chain id
   * @throws {Error} if this signer has not been connected.
   */
  public chainId(): Promise<string> {
    if (this.provider) {
      return this.provider.request({ method: 'eth_chainId' });
    }
    return Promise.reject(new Error('wallet is not connected'));
  }

  /**
   * @desc get current active chain name of the signer in string.
   * @returns {Promise<string>} chain name if the chain is supported. Otherwise it returns 'Unsupported Network'
   * @throws {Error} if this signer has not been connected.
   */
  public async chainName(): Promise<string> {
    if (this.provider) {
      const chainIdHex = await this.chainId();
      const chainConfig = this.config.getChainConfig(parseInt(chainIdHex, 16));
      return chainConfig?.name || 'Unsupported Network';
    }
    return Promise.reject(new Error('wallet is not connected'));
  }

  /**
   * @desc connect this signer by asking user permission from the browser.
   * @param {ethers.providers.Web3Provider} [etherProvider] if provided it overrides this default ethers.providers.Web3Provider constructor.
   * @returns {Promise<string[]>} an array of account addresses, which this signer offers.
   * @throws {Error} if the signer is not properly initialized.
   */
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

  /**
   * @desc switch current connected signer to a different blockchain network by asking user's permission
   * from browser.
   * @param {number} chainId the chain id to switch to.
   * @param {ChainConfig} chainConfig configuration of the chain to switch to.
   * @returns {Promise<void>}
   * @throws {Error} if the signer is not properly initialized, or failed to switch to the requested chain.
   */
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

  /**
   * @desc add listener to subscribe signer events, this is useful to detect accounts or network changes.
   * @param {string} eventName name of the event.
   * @param {function} callback function to call when event occurs.
   */
  public addListener(eventName: string, callback: (message: any) => void) {
    if (this.provider) {
      this.provider.on(eventName, callback);
    }
  }

  /**
   * @desc remove listener to stop subscribing signer events.
   * @param {string} eventName name of the event.
   * @param {function} callback function to call when event occurs.
   */
  public removeListener(eventName: string, callback: (message: any) => void) {
    if (this.provider) {
      this.provider.removeListener(eventName, callback);
    }
  }
}

/**
 * @function module:mystiko/chain.checkSigner
 * @desc check whether the given signer satisfy the given chain id, and switch to the given chain id if possible.
 * @param {BaseSigner} signer the {@link BaseSigner} instance for checking.
 * @param {number} chainId id of the blockchain to be sending transaction to.
 * @param {MystikoConfig} config configuration of the given blockchain.
 * @returns {Promise<void>} if check holds
 * @throws {Error} if the signer is not connected, or failed to change to the requested chain.
 */
export async function checkSigner(signer: BaseSigner, chainId: number, config: MystikoConfig): Promise<void> {
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
