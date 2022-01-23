# Mystiko.Network - The Layer P(rivacy) of Web 3.0

[![build status](https://github.com/mystikonetwork/mystiko-core/actions/workflows/build.yml/badge.svg)](https://github.com/mystikonetwork/mystiko-core/actions/workflows/build.yml)

[Mystiko.Network](https://mystiko.network) is the base layer Of Web3 via zero knowledge proof based cross-chain networks.
This repository contains the implementation of Mystiko's core protocol in Solidity and Javascript. Please check our
[Whitepaper](https://mystiko.network/whitepaper.pdf) for more formal information about the protocol.

Our zero knowledge proof primitives are built based on [Circom](https://github.com/iden3/circom), which is a popular
zkSnark compiler and toolchain. Here is the details of the proving schemes we are using:
* **alt_bn128** - a pairing-friendly elliptic curve, which is also efficient on EVM.
* **[groth16](https://eprint.iacr.org/2016/260)** - a proving scheme could work with the alt_bn128 curves.
* **[snarkjs](https://github.com/iden3/snarkjs)** - a zkSnark backend and runtime.

## Preliminaries
### Install Node 14
Please install Node.js 14 as the recommended running Node environment for this project. If you don't know which
node version you have installed, you can check it by running the below command:

```bash
node -v
```

To install the Node.js 14, we recommend you use [Node Version Manager](https://github.com/nvm-sh/nvm) for managing
the installed Node.js environment. Please follow the document at there to get Node 14 installed.

### Install Yarn
After your Node.js 14 environment is correctly installed, you need to install the [Yarn](https://yarnpkg.com/) package
manager for Node.js and web applications. You can do it by running this command:

```bash
npm install -g yarn
```

## Developing Guide
### Install dependencies
Once you have checked out this repo into your local machine, you could install all dependencies by running this command:

```bash
yarn install
```

If you observed some network failure when running above command, you could add `--network-timeout 100000` to the above
command, which sets the network timeout threshold in milliseconds.

### Build the repo
This repo includes three parts:
* [contracts](./contracts) it contains the smart contract written in Solidity.
* [circom circuits](./circuits) it contains the zkSnark circuit written in Circom language.
* [javascript library](./src) it contains the Javascript implementation of all off-chain computation and wallet related logic.

Normally you don't need to build circuits, because it is kinda stable and the build script will overwrite the generated
public parameters of zkSnark in the [dist](./dist) folder. You could just run this command to build the other two parts:

```bash
yarn build
```

If you want to build the Solidity contract separately, you could run this command:

```bash
yarn build:contract
```

The final built outputs and intermediate outputs are stored in [build/contracts](./build/contracts).

If you want to build the Javascript library into bundled UMD or CommandJS library separately, you could run this command:

```bash
yarn build:js
```

The built outputs are stored in [build/js](./build/js). More precisely, [build/js/mystiko.js](./build/js/mystiko.js) is the UMD bundle,
and [build/js/mystiko.cjs](./build/js/mystiko.cjs) is the CommonJS bundle.

If you do want to regenerate the [Verifier](./contracts/Verifier.sol) contract and regenerate zkSnark public
parameters in [dist](./dist), you could run this command.

```bash
yarn build:circuits
```

Please take this step cautiously, because it will overwrite the existing files.

### Test the Solidity smart contract

Firstly, you need to start [Ganache](https://trufflesuite.com/ganache/) as local Ethereum testnet as the prerequisites
of running `truffle test`. You could bootstrap Ganache environment either by installing their GUI application
or by running this command:

```bash
npx ganache-cli --port 7545
```

Please make sure the Ganache client runs on port `7545`, which is configured in [truffle-config.js](./truffle-config.js).
You have to change it to other number before you run Ganache client on different port.

The second step before running tests is: setting the correct environment variables. We have put some example settings
in [.env.example](./.env.example), you use it by running this command:

```bash
cp .env.example .env
```

You could modify these environment variables to your preferred values before you start running the tests.

All tests written for the Solidity are located in [contracts/tests](./contracts/tests), which are wrapped with
Truffle's test suite. Please run the tests with this command:

```bash
yarn test:contract
```

### Test the Javascript library

All Javascript unit test cases are located in [tests](./tests). The testing suite used by this project is
[Jest](https://jestjs.io). You could run the Javascript test with this command:

```bash
yarn test:js
```

These will output the test results and the coverage summary. The coverage report will be generated into the
[coverage](./coverage) folder, you could find more coverage information in there.

### Linting the repo

We configured the linters for Javascript and Solidity, which are [ESLint](https://eslint.org/)
and [solhint](https://github.com/protofire/solhint). You could check their configuration with
[.eslintrc](./.eslintrc) and [.solhint.json](./.solhint.json). You could run the linters with this command:

```bash
yarn lint
```

Or with these command separately for linting different language:

```bash
yarn lint:js # for linting .js files
```
```bash
yarn lint:sol # for linting .sol files
```

If you see any code style violation errors, you could run the prettier command to help you fix them:

```bash
yarn prettier:fix
```

If the above prettier command cannot solve it, you should modify the code violates the rules manually.

### Deploy the smart contracts

This project relies on Truffle to deploy into different blockchain networks. The deploying scripts are
located in [migrations](./migrations) folder. Therefore, you could deploy the smart contracts into different
network by running this command:

```bash
npx truffle migrate --network ropsten
```

Please check [Truffle Document](https://trufflesuite.com/docs/truffle/getting-started/running-migrations.html)
for more information about `truffle migrate`.

After successfully deployed, you could then verify the smart contracts by running this command:

```bash
npx truffle run verify [Contract Name]@[Contract Address] --network [Network]
```
For more information about the verification process, please check [truffle-plugin-verify](https://github.com/rkalis/truffle-plugin-verify).
