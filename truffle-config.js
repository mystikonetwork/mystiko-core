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
const utils = require('./src/utils.js');

const providers = {
  ropsten: 'https://eth-ropsten.alchemyapi.io/v2/LPkA3Wlc-6tR-ZMGJLBgEhi-HTNo7H1j',
};

function getGasPrice() {
  return process.env.GAS_PRICE_GWEI
    ? utils.toDecimals(10, 9).toString()
    : utils.toDecimals(Number(process.env.GAS_PRICE_GWEI), 9).toString();
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
      provider: new HDWalletProvider(process.env.PRIVATE_KEY, providers.ropsten),
      network_id: 3,
      gasPrice: getGasPrice(),
      skipDryRun: true,
      confirmations: getConfirmation(),
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    rootHooks: [babelRegister],
  },

  test_directory: 'contracts/tests',

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
          path: './build/Hasher.json',
        },
      ],
    },
  },

  plugins: ['truffle-plugin-verify'],

  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY,
  },
};
