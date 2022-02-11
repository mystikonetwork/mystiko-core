import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import { MystikoConfig, ChainConfig } from '../config';
import { check, toHex, toHexNoPrefix, toString } from '../utils.js';
import { ProviderPool } from './provider.js';
import rootLogger from '../logger.js';

/**
 * @class BaseSigner
 * @desc base signer wrapping class for signing transaction sent to blockchain.
 * @param {MystikoConfig} config full configuration of {@link MystikoConfig}
 * @param {*} [provider] low-level provider instance for operating the signer,
 * e.g. {@link https://docs.metamask.io/guide/ethereum-provider.html window.ethereum}
 */
export class BaseSigner {
  constructor(config, provider = undefined) {
    check(config instanceof MystikoConfig, 'config should be instance of MystikoConfig');
    this.config = config;
    this.provider = provider;
    this.logger = rootLogger.getLogger('BaseSigner');
  }

  /**
   * @property {external:Signer} signer
   * @desc get the {@link external:Signer} instance of this wrapped signer instance.
   * @throws {Error} if the signer has not been connected.
   */
  get signer() {
    check(this.etherProvider, 'wallet is not connected');
    return this.etherProvider.getSigner();
  }

  /**
   * @desc whether this signer is connected, and it can be signing transaction.
   * @returns {Promise<boolean>} true if it is connected, otherwise it returns false.
   */
  async connected() {
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
  async installed() {
    return await new Promise((resolve) => resolve(false));
  }

  /**
   * @desc get the connected list of accounts from this signer.
   * Current effective account is the first element of the returned array.
   * @returns {Promise<string[]>} an array of account addresses.
   * @throws {Error} if this signer has not been connected.
   */
  async accounts() {
    check(this.provider, 'wallet is not connected');
    return await this.provider.request({ method: 'eth_accounts' });
  }

  /**
   * @desc get current active chain id of the signer in hex string with prefix '0x'.
   * @returns {Promise<string>} chain id
   * @throws {Error} if this signer has not been connected.
   */
  async chainId() {
    check(this.provider, 'wallet is not connected');
    return await this.provider.request({ method: 'eth_chainId' });
  }

  /**
   * @desc get current active chain name of the signer in string.
   * @returns {Promise<string>} chain name if the chain is supported. Otherwise it returns 'Unsupported Network'
   * @throws {Error} if this signer has not been connected.
   */
  async chainName() {
    check(this.provider, 'wallet is not connected');
    const chainIdHex = await this.chainId();
    const chainConfig = this.config.getChainConfig(parseInt(chainIdHex));
    return chainConfig ? chainConfig.name : 'Unsupported Network';
  }

  /**
   * @desc connect this signer by asking user permission from the browser.
   * @param {external:Provider} [etherProvider] if provided it overrides this default {@link external:Provider} constructor.
   * @returns {Promise<string[]>} an array of account addresses, which this signer offers.
   * @throws {Error} if the signer is not properly initialized.
   */
  async connect(etherProvider = undefined) {
    check(this.provider, 'wallet is not initialized');
    const acc = await this.provider.request({ method: 'eth_requestAccounts' });
    if (acc.length > 0) {
      this.etherProvider = etherProvider ? etherProvider : new ethers.providers.Web3Provider(this.provider);
      this.logger.info(`successfully connected to signer with account=${acc[0]}`);
    } else {
      this.logger.error('failed to connect to signer, no account connected');
    }
    return acc;
  }

  /**
   * @desc switch current connected signer to a different blockchain network by asking user's permission
   * from browser.
   * @param {number} chainId the chain id to switch to.
   * @param {ChainConfig} chainConfig configuration of the chain to switch to.
   * @returns {Promise<void>}
   * @throws {Error} if the signer is not properly initialized, or failed to switch to the requested chain.
   */
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
  }

  /**
   * @desc add listener to subscribe signer events, this is useful to detect accounts or network changes.
   * @param {string} eventName name of the event.
   * @param {function} callback function to call when event occurs.
   */
  addListener(eventName, callback) {
    check(typeof eventName === 'string', 'eventName should be a string');
    check(typeof callback === 'function', 'callback should be a function');
  }

  /**
   * @desc remove listener to stop subscribing signer events.
   * @param {string} eventName name of the event.
   * @param {function} callback function to call when event occurs.
   */
  removeListener(eventName, callback) {
    check(typeof eventName === 'string', 'eventName should be a string');
    check(typeof callback === 'function', 'callback should be a function');
  }
}

/**
 * @class MetaMaskSigner
 * @extends BaseSigner
 * @param {MystikoConfig} config full configuration of {@link MystikoConfig}
 * @param {*} [provider] low-level provider instance for operating the signer,
 * @desc a signer class wrapped {@link https://metamask.io Metamask} as a provider.
 */
export class MetaMaskSigner extends BaseSigner {
  constructor(config, provider = undefined) {
    super(config, provider);
    this.logger = rootLogger.getLogger('MetaMaskSigner');
  }

  /**
   * @desc whether MetaMask is properly installed in user's browser.
   * @override
   * @returns {Promise<boolean>} true if it is installed properly, otherwise it returns false.
   */
  async installed() {
    const provider = await detectEthereumProvider().catch(() => undefined);
    return !!provider;
  }

  /**
   * @desc connect MetaMask by asking user permission from the browser.
   * @override
   * @param {external:Provider | external:Wallet} [etherProvider] if provided it overrides
   * this default {@link external:Provider} constructor.
   * @returns {Promise<string[]>} an array of account addresses, which this signer offers.
   * @throws {Error} if MetaMask is not installed in this browser as an extension.
   */
  async connect(etherProvider = undefined) {
    if (!this.provider) {
      this.provider = await detectEthereumProvider();
    }
    check(this.provider, 'MetaMask is not installed');
    return await super.connect(etherProvider);
  }

  /**
   * @desc add listener to subscribe signer events, this is useful to detect accounts or network changes.
   * @override
   * @param {string} eventName name of the event.
   * @param {function} callback function to call when event occurs.
   */
  addListener(eventName, callback) {
    super.addListener(eventName, callback);
    check(this.provider, 'MetaMask is not installed');
    this.provider.on(eventName, callback);
  }

  /**
   * @desc remove listener to stop subscribing signer events.
   * @override
   * @param {string} eventName name of the event.
   * @param {function} callback function to call when event occurs.
   */
  removeListener(eventName, callback) {
    super.removeListener(eventName, callback);
    check(this.provider, 'MetaMask is not installed');
    this.provider.removeListener(eventName, callback);
  }
}

/**
 * @class PrivateKeySigner
 * @extends BaseSigner
 * @param {string} privateKey a Ethereum-based private key string in hex.
 * @param {MystikoConfig} config full configuration of {@link MystikoConfig}
 * @param {ProviderPool} providerPool a pool of JSON-RPC providers
 * @desc a signer class which uses private key to sign transaction
 */
export class PrivateKeySigner extends BaseSigner {
  constructor(config, providerPool) {
    super(config);
    check(providerPool instanceof ProviderPool, 'providerPool should be an instance of ProviderPool');
    this.providerPool = providerPool;
    this.logger = rootLogger.getLogger('PrivateKeySigner');
  }

  /**
   * @desc update the signer's private key.
   * @param {string} privateKey the private key to update.
   */
  setPrivateKey(privateKey) {
    check(typeof privateKey === 'string', 'privateKey should be a string');
    this.provider = new ethers.Wallet(toHexNoPrefix(privateKey));
  }

  /**
   * @desc whether this signer is properly installed.
   * @override
   * @returns {Promise<boolean>} true if it is installed properly, otherwise it returns false.
   */
  installed() {
    return Promise.resolve(true);
  }

  /**
   * @desc get the connected list of accounts from this signer.
   * Current effective account is the first element of the returned array.
   * @override
   * @returns {Promise<string[]>} an array of account addresses.
   */
  accounts() {
    return Promise.resolve(this.provider ? [this.provider.address] : []);
  }

  /**
   * @desc connect the signer to a JSON-RPC provider.
   * @override
   * @param {external:Provider | external:Wallet} [etherProvider] if provided it overrides
   * this default {@link external:Provider} constructor.
   * @returns {Promise<string[]>} an array of account addresses, which this signer offers.
   * @throws {Error} if MetaMask is not installed in this browser as an extension.
   */
  async connect(etherProvider = undefined) {
    check(
      !etherProvider || etherProvider instanceof ethers.Wallet,
      'etherProvider should be an instance of ethers.Wallet',
    );
    if (etherProvider) {
      this.provider = etherProvider;
    } else {
      check(this.provider, 'you should call setPrivateKey before calling connect');
    }
    return await this.accounts();
  }

  /**
   * @desc get current active chain id of the signer in hex string with prefix '0x'.
   * @returns {Promise<string>} chain id
   * @override
   * @throws {Error} if this signer has not been connected.
   */
  async chainId() {
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
  switchChain(chainId, chainConfig) {
    check(typeof chainId === 'number', 'chainId should be a number');
    check(chainConfig instanceof ChainConfig, 'chainConfig should be instance of ChainConfig');
    check(this.provider, 'you should call setPrivateKey before calling switchChain');
    const jsonRpcProvider = this.providerPool.getProvider(chainId);
    this.provider = this.provider.connect(jsonRpcProvider);
    this.logger.info(`successfully switched to chain ${chainId}`);
    return Promise.resolve();
  }

  /**
   * @property {external:Signer} signer
   * @override
   * @desc get the {@link external:Signer} instance of this wrapped signer instance.
   * @throws {Error} if the signer has not been connected.
   */
  get signer() {
    return this.provider;
  }
}

/**
 * @function module:mystiko/chain.checkSigner
 * @desc check whether the given signer satisfy the given chain id, and switch to the given chain id if possible.
 * @param {BaseSigner} signer the {@link BaseSigner} instance for checking.
 * @param {number} chainId id of the blockchain to be sending transaction to.
 * @param {ChainConfig} config configuration of the given blockchain.
 * @returns {Promise<void>} if check holds
 * @throws {Error} if the signer is not connected, or failed to change to the requested chain.
 */
export async function checkSigner(signer, chainId, config) {
  check(signer instanceof BaseSigner, 'signer should be instance of BaseSigner');
  check(await signer.connected(), 'signer has not been connected');
  check(config instanceof MystikoConfig, 'chainConfig should be instance of MystikoConfig');
  const signerChainId = await signer.chainId();
  const chainIdHex = toHex(chainId);
  if (signerChainId !== chainIdHex) {
    await signer.switchChain(chainId, config.getChainConfig(chainId));
  }
  check(signer.signer, 'raw signer is undefined or null');
}
