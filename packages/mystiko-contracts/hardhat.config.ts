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

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {},
    localhost: { timeout: 600000 },
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
  mocha: {
    timeout: 600000,
  },
};

export default config;
