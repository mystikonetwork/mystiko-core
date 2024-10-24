# Mystiko.Network - The ZK Layer of Web 3.0

[![build status](https://github.com/mystikonetwork/mystiko-core/actions/workflows/build.yml/badge.svg)](https://github.com/mystikonetwork/mystiko-core/actions/workflows/build.yml)

[Mystiko.Network](https://mystiko.network) is the base layer Of Web3 via zero knowledge proof based cross-chain networks.
This repository contains the implementation of Mystiko's core protocol in Solidity and Javascript. Please check our
[Whitepaper](https://mystiko.network/whitepaper.pdf) for more formal information about the protocol.

Our zero knowledge proof primitives are built based on [Circom](https://github.com/iden3/circom), which is a popular
zkSnark compiler and toolchain. Here is the details of the proving schemes we are using:
* **alt_bn128** - a pairing-friendly elliptic curve, which is also efficient on EVM.
* **[Groth16](https://eprint.iacr.org/2016/260)** - a proving scheme could work with the alt_bn128 curves.
* **[Zokrates](https://github.com/mystikonetwork/Zokrates)** - a zkSnark backend and runtime.

## Preliminaries
### Install Git LFS
Some large files are tracked with [Git LFS](https://git-lfs.github.com/), please follow the instruction there to install
Git LFS. After you successfully installed Git LFS, you should check out those Git LFS tracked files by running these commands:

```bash
git lfs install
git lfs pull
```

### Install Node 18
Please install Node.js 18 as the recommended running Node environment for this project. If you don't know which
node version you have installed, you can check it by running the below command:

```bash
node -v
```

To install the Node.js 18, we recommend you use [Node Version Manager](https://github.com/nvm-sh/nvm) for managing
the installed Node.js environment. Please follow the document at there to get Node 14 installed.

### Install Yarn
After your Node.js 14 environment is correctly installed, you need to install the [Yarn](https://yarnpkg.com/) package
manager for Node.js and web applications. You can do it by running this command:

```bash
npm install -g yarn
```

### Install Lerna
This repository is managed by [Lerna](https://lerna.js.org/), which is a tool for managing JavaScript projects with multiple packages.
You can install Lerna by running this command:

```bash
npm install -g lerna
```

### Install dependencies
Once you have checked out this repo into your local machine, you could install all dependencies by running this command:

```bash
yarn install
```

## Developing Guide

### Build the repo
You can build the entire codebase by running this command:

```bash
lerna run build
```

### Test the Repo

You can test entire codebase by running this command:

```bash
cp packages/mystiko-contracts/.env.example packages/mystiko-contracts/.env
lerna run test
```

### Linting the repo

You can lint the entire codebase by running this command:

```bash
lerna run lint
```
