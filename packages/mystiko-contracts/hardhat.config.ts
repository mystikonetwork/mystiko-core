import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-contract-sizer';
import 'hardhat-deploy';
import 'hardhat-gas-reporter';

import * as dotenv from 'dotenv';
import { HardhatUserConfig } from 'hardhat/types';
import './scripts/compileHasher.hardhat';
dotenv.config();

const DEFAULT_ENDPOINT = 'http://localhost:8545';
const DEFAULT_PRIVATE_KEY = process.env.PRIVATE_KEY;

// Testnets
const ropstenEndpoint = process.env.ROPSTEN_ENDPOINT || DEFAULT_ENDPOINT;
const ropstenPrivateKey = process.env.ROPSTEN_PRIVATE_KEY || DEFAULT_PRIVATE_KEY;

const goerliEndpoint = process.env.GOERLI_ENDPOINT || DEFAULT_ENDPOINT;
const goerliPrivateKey = process.env.GOERLI_PRIVATE_KEY || DEFAULT_PRIVATE_KEY;

const bscTestEndpoint = process.env.BSC_TEST_ENDPOINT || DEFAULT_ENDPOINT;
const bscTestPrivateKey = process.env.BSC_TEST_PRIVATE_KEY || DEFAULT_PRIVATE_KEY;

const fantomTestEndpoint = process.env.FANTOM_TEST_ENDPOINT || DEFAULT_ENDPOINT;
const fantomTestPrivateKey = process.env.FANTOM_TEST_PRIVATE_KEY || DEFAULT_PRIVATE_KEY;

const avalancheTestEndpoint = process.env.AVALANCHE_TEST_ENDPOINT || DEFAULT_ENDPOINT;
const avalancheTestPrivateKey = process.env.AVALANCHE_TEST_PRIVATE_KEY || DEFAULT_PRIVATE_KEY;

const auroraTestEndpoint = process.env.AURORA_TEST_ENDPOINT || DEFAULT_ENDPOINT;
const auroraTestPrivateKey = process.env.AURORA_TEST_PRIVATE_KEY || DEFAULT_PRIVATE_KEY;

const polygonTestEndpoint = process.env.POLYGON_TEST_ENDPOINT || DEFAULT_ENDPOINT;
const polygonTestPrivateKey = process.env.POLYGON_TEST_PRIVATE_KEY || DEFAULT_PRIVATE_KEY;

const moonbaseAlphaTestEndpoint = process.env.MOONBASE_ALPHA_TEST_ENDPOINT || DEFAULT_ENDPOINT;
const moonbaseAlphaTestPrivateKey = process.env.MOONBASE_ALPHA_TEST_PRIVATE_KEY || DEFAULT_PRIVATE_KEY;

// Mainnets
const ethMainnetEndpoint = process.env.ETH_MAINNET_ENDPOINT || DEFAULT_ENDPOINT;
const ethMainnetPrivateKey = process.env.ETH_MAINNET_PRIVATE_KEY || DEFAULT_PRIVATE_KEY;

const bscEndpoint = process.env.BSC_ENDPOINT || DEFAULT_ENDPOINT;
const bscPrivateKey = process.env.BSC_PRIVATE_KEY || DEFAULT_PRIVATE_KEY;

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {},
    localhost: { timeout: 600000 },
    ropsten: {
      url: ropstenEndpoint,
      accounts: [`0x${ropstenPrivateKey}`],
    },
    goerli: {
      url: goerliEndpoint,
      accounts: [`0x${goerliPrivateKey}`],
    },
    bsctestnet: {
      url: bscTestEndpoint,
      accounts: [`0x${bscTestPrivateKey}`],
    },
    fantomtestnet: {
      url: fantomTestEndpoint,
      accounts: [`0x${fantomTestPrivateKey}`],
    },
    avalanchetestnet: {
      url: avalancheTestEndpoint,
      accounts: [`0x${avalancheTestPrivateKey}`],
    },
    moonbase: {
      url: moonbaseAlphaTestEndpoint,
      accounts: [`0x${moonbaseAlphaTestPrivateKey}`],
    },
    auroratestnet: {
      url: auroraTestEndpoint,
      accounts: [`0x${auroraTestPrivateKey}`],
    },
    polygontestnet: {
      url: polygonTestEndpoint,
      accounts: [`0x${polygonTestPrivateKey}`],
    },
    ethMainnet: {
      url: ethMainnetEndpoint,
      accounts: [`0x${ethMainnetPrivateKey}`],
    },
    bsc: {
      url: bscEndpoint,
      accounts: [`0x${bscPrivateKey}`],
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  solidity: {
    version: '0.8.10',
    settings: {
      optimizer: {
        enabled: true,
        runs: 800,
      },
    },
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: false,
    disambiguatePaths: false,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === 'true' ? true : false,
    noColors: true,
    outputFile: 'reports/gas_usage/summary.txt',
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
    // alwaysGenerateOverloads: true,
    externalArtifacts: ['artifactsExternal/*.json'],
  },
};

export default config;
