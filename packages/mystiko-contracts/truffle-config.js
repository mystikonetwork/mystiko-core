/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * trufflesuite.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like @truffle/hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');
const babelRegister = require('@babel/register');
babelRegister({
  ignore: [/node_modules\/(?!(@mystiko)\/)/],
});
const { ethers } = require('ethers');

const providers = {
  //testnet
  ropsten: 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  goerli: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  bsctestnet: 'https://bsc.getblock.io/testnet/?api_key=71722c7c-f748-4ea3-bacd-6edc2900c4f0',
  moonbase: 'https://rpc.api.moonbase.moonbeam.network',
  auroratestnet: 'https://testnet.aurora.dev',
  fantomtestnet: 'https://rpc.testnet.fantom.network',
  polygontestnet: 'https://matic.getblock.io/testnet/?api_key=71722c7c-f748-4ea3-bacd-6edc2900c4f0',
  //mainnet
  bsc: 'https://bsc-dataseed1.binance.org',
  moonbeam: 'https://rpc.api.moonbeam.network',
  polygon: 'https://matic-mainnet.chainstacklabs.com',
};

function getGasPrice() {
  return process.env.GAS_PRICE_GWEI
    ? ethers.utils.parseUnits(process.env.GAS_PRICE_GWEI, 9).toString()
    : ethers.utils.parseUnits('100', 9).toString();
}

function getConfirmation() {
  return process.env.CONFIRMATION ? process.env.CONFIRMATION : '4';
}

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1', // Localhost (default: none)
      port: 7545, // Standard Ethereum port (default: none)
      network_id: '*', // Any network (default: none)
    },
    ropsten: {
      provider: () => new HDWalletProvider(process.env.PRIVATE_KEY, providers.ropsten),
      network_id: 3,
      gas: 8000000,
      gasPrice: getGasPrice(),
      skipDryRun: true,
      confirmations: getConfirmation(),
    },
    goerli: {
      provider: () => new HDWalletProvider(process.env.PRIVATE_KEY, providers.goerli),
      network_id: 5,
      gas: 8000000,
      gasPrice: getGasPrice(),
      skipDryRun: true,
      confirmations: getConfirmation(),
    },
    bsctestnet: {
      provider: () => new HDWalletProvider(process.env.PRIVATE_KEY, providers.bsctestnet),
      network_id: 97,
      gas: 8000000,
      gasPrice: getGasPrice(),
      skipDryRun: true,
      confirmations: getConfirmation(),
      timeoutBlocks: 200,
      networkCheckTimeout: 1000000000,
    },
    auroratestnet: {
      provider: () => new HDWalletProvider(process.env.PRIVATE_KEY, providers.auroratestnet),
      network_id: 1313161555,
      gas: 8000000,
      gasPrice: 0,
      skipDryRun: true,
      confirmations: getConfirmation(),
      timeoutBlocks: 200,
    },
    moonbase: {
      provider: () => new HDWalletProvider(process.env.PRIVATE_KEY, providers.moonbase),
      network_id: 1287,
      gas: 8000000,
      gasPrice: getGasPrice(),
      skipDryRun: true,
      confirmations: getConfirmation(),
    },
    fantomtestnet: {
      provider: () => new HDWalletProvider(process.env.PRIVATE_KEY, providers.fantomtestnet),
      network_id: 4002,
      gas: 8000000,
      gasPrice: 300000000000,
      skipDryRun: true,
      confirmations: getConfirmation(),
    },
    polygontestnet: {
      provider: () => new HDWalletProvider(process.env.PRIVATE_KEY, providers.polygontestnet),
      network_id: 80001,
      gas: 8000000,
      gasPrice: getGasPrice(),
      skipDryRun: true,
      confirmations: getConfirmation(),
      networkCheckTimeout: 1000000000,
    },
    bsc: {
      provider: () => new HDWalletProvider(process.env.PRIVATE_KEY, providers.bsc),
      network_id: 56,
      gas: 8000000,
      gasPrice: getGasPrice(),
      skipDryRun: true,
      confirmations: getConfirmation(),
      timeoutBlocks: 200,
      networkCheckTimeout: 1000000000,
    },
    moonbeam: {
      provider: () => new HDWalletProvider(process.env.PRIVATE_KEY, providers.moonbeam),
      network_id: 1284,
      gas: 8000000,
      gasPrice: getGasPrice(),
      skipDryRun: true,
      confirmations: getConfirmation(),
    },
    polygon: {
      provider: () => new HDWalletProvider(process.env.PRIVATE_KEY, providers.polygon),
      network_id: 137,
      gas: 8000000,
      gasPrice: getGasPrice(),
      skipDryRun: true,
      confirmations: getConfirmation(),
      networkCheckTimeout: 1000000000,
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    rootHooks: [babelRegister],
  },

  compilers: {
    solc: {
      version: '0.6.11',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
    external: {
      command: 'node ./scripts/compileHasher.js',
      targets: [
        {
          path: './build/Hasher2.json',
        },
        {
          path: './build/Hasher3.json',
        },
      ],
    },
  },

  plugins: ['truffle-plugin-verify'],

  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY,
    bscscan: process.env.BSCSCAN_API_KEY,
  },
};
