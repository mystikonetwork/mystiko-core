import { Fixture } from 'ethereum-waffle/dist/esm';
// @ts-ignore
import { ethers, waffle } from 'hardhat';
import { Artifacts } from 'hardhat/internal/artifacts';
import { Artifact } from 'hardhat/types';
import { parseUnits } from '@ethersproject/units';
import { Wallet } from '@ethersproject/wallet';
import {
  Hasher2,
  Hasher2__factory,
  TestToken,
  TestToken__factory,
  WithdrawVerifier__factory,
  WithdrawVerifier,
  Rollup1Verifier__factory,
  Rollup1Verifier,
  Rollup4Verifier__factory,
  Rollup4Verifier,
  Rollup16Verifier__factory,
  Rollup16Verifier,
  MystikoV2WithLoopERC20__factory,
  MystikoV2WithLoopERC20,
  MystikoV2WithLoopMain__factory,
  MystikoV2WithLoopMain,
  MystikoWithTBridgeMain__factory,
  MystikoTBridgeProxy__factory,
  MystikoWithTBridgeERC20__factory,
} from '../../typechain';
import {
  MerkleTreeHeight,
  RootHistoryLength,
  MinBridgeFee,
  MinExecutorFee,
  MinRollupFee,
  UserPrivKeys,
  DefaultTokenAmount,
  SourceChainID,
  DestinationChainID,
} from './constants';

// Workaround for https://github.com/nomiclabs/hardhat/issues/849
// TODO: Remove once fixed upstream.
export function loadFixture<T>(fixture: Fixture<T>): Promise<T> {
  return waffle.createFixtureLoader(waffle.provider.getWallets(), waffle.provider)(fixture);
}

interface CoreBridgeDeploymentInfo {
  proxy: any;
  localMain: any;
  localERC20: any;
  remoteMain: any;
  remoteERC20: any;
}

interface CoreLoopDeploymentInfo {
  loopMain: MystikoV2WithLoopMain;
  loopERC20: MystikoV2WithLoopERC20;
}

interface DependDeploymentInfo {
  testToken: TestToken;
  withdraw: WithdrawVerifier;
  rollup1: Rollup1Verifier;
  rollup4: Rollup4Verifier;
  rollup16: Rollup16Verifier;
}

interface ExternalDeploymentInfo {
  hasher2: Hasher2;
}

export function getArtifact(contract: string): Promise<Artifact> {
  const artifactsPath: string = './artifactsExternal';
  // const artifactsPath: string = "./artifacts";
  const artifacts = new Artifacts(artifactsPath);
  return artifacts.readArtifact(contract);
}

export async function deployLoopContracts(
  accounts: Wallet[],
  withdrawVerifierAddress: string,
  tokenAddress: string,
  { treeHeight = MerkleTreeHeight, rootHistoryLength = RootHistoryLength, minRollupFee = MinRollupFee },
): Promise<CoreLoopDeploymentInfo> {
  const loopMainFactory = (await ethers.getContractFactory(
    'MystikoV2WithLoopMain',
  )) as MystikoV2WithLoopMain__factory;
  const loopMain = await loopMainFactory
    .connect(accounts[0])
    .deploy(treeHeight, rootHistoryLength, minRollupFee, withdrawVerifierAddress);
  await loopMain.deployed();

  const loopERC20Factory = (await ethers.getContractFactory(
    'MystikoV2WithLoopERC20',
  )) as MystikoV2WithLoopERC20__factory;
  const loopERC20 = await loopERC20Factory
    .connect(accounts[0])
    .deploy(treeHeight, rootHistoryLength, minRollupFee, withdrawVerifierAddress, tokenAddress);
  await loopERC20.deployed();

  return { loopMain, loopERC20 };
}

export async function deployTBridgeContracts(
  accounts: Wallet[],
  withdrawVerifierAddress: string,
  tokenAddress: string,
  {
    treeHeight = MerkleTreeHeight,
    rootHistoryLength = RootHistoryLength,
    minBridgeFee = MinBridgeFee,
    minExecutorFee = MinExecutorFee,
    minRollupFee = MinRollupFee,
  },
): Promise<CoreBridgeDeploymentInfo> {
  const proxyFactory = (await ethers.getContractFactory(
    'MystikoTBridgeProxy',
  )) as MystikoTBridgeProxy__factory;
  const proxy = await proxyFactory.connect(accounts[0]).deploy();
  await proxy.deployed();

  const tBridgeMainFactory = (await ethers.getContractFactory(
    'MystikoWithTBridgeMain',
  )) as MystikoWithTBridgeMain__factory;

  const localMain = await tBridgeMainFactory
    .connect(accounts[0])
    .deploy(
      proxy.address,
      DestinationChainID,
      treeHeight,
      rootHistoryLength,
      minBridgeFee,
      minExecutorFee,
      minRollupFee,
      withdrawVerifierAddress,
    );

  const remoteMain = await tBridgeMainFactory
    .connect(accounts[0])
    .deploy(
      proxy.address,
      SourceChainID,
      treeHeight,
      rootHistoryLength,
      minBridgeFee,
      minExecutorFee,
      minRollupFee,
      withdrawVerifierAddress,
    );

  const tBridgeERC20Factory = (await ethers.getContractFactory(
    'MystikoWithTBridgeERC20',
  )) as MystikoWithTBridgeERC20__factory;

  const localERC20 = await tBridgeERC20Factory
    .connect(accounts[0])
    .deploy(
      proxy.address,
      DestinationChainID,
      treeHeight,
      rootHistoryLength,
      minBridgeFee,
      minExecutorFee,
      minRollupFee,
      withdrawVerifierAddress,
      tokenAddress,
    );

  const remoteERC20 = await tBridgeERC20Factory
    .connect(accounts[0])
    .deploy(
      proxy.address,
      SourceChainID,
      treeHeight,
      rootHistoryLength,
      minBridgeFee,
      minExecutorFee,
      minRollupFee,
      withdrawVerifierAddress,
      tokenAddress,
    );

  return { proxy, localMain, localERC20, remoteMain, remoteERC20 };
}

export async function deployDependContracts(accounts: Wallet[]): Promise<DependDeploymentInfo> {
  const testTokenFactory = (await ethers.getContractFactory('TestToken')) as TestToken__factory;
  const testToken = await testTokenFactory.connect(accounts[0]).deploy('Mystiko Test Token', 'MTT', 18);
  await testToken.deployed();

  for (let i = 0; i < accounts.length; i += 1) {
    await testToken.transfer(accounts[i].address, DefaultTokenAmount);
  }

  const withdrawFactory = (await ethers.getContractFactory('WithdrawVerifier')) as WithdrawVerifier__factory;
  const withdraw = await withdrawFactory.connect(accounts[0]).deploy();
  await withdraw.deployed();

  const rollup1Factory = (await ethers.getContractFactory('Rollup1Verifier')) as Rollup1Verifier__factory;
  const rollup1 = await rollup1Factory.connect(accounts[0]).deploy();
  await rollup1.deployed();

  const rollup4Factory = (await ethers.getContractFactory('Rollup4Verifier')) as Rollup4Verifier__factory;
  const rollup4 = await rollup4Factory.connect(accounts[0]).deploy();
  await rollup4.deployed();

  const rollup16Factory = (await ethers.getContractFactory('Rollup16Verifier')) as Rollup16Verifier__factory;
  const rollup16 = await rollup16Factory.connect(accounts[0]).deploy();
  await rollup16.deployed();

  return { testToken, withdraw, rollup1, rollup4, rollup16 };
}

export async function deployExternalContracts(): Promise<ExternalDeploymentInfo> {
  const artifact = await getArtifact('Hasher2');
  const Hasher = (await ethers.getContractFactoryFromArtifact(artifact)) as Hasher2__factory;
  const hasher = (await Hasher.deploy()) as Hasher2;
  await hasher.deployed();

  return { hasher2: hasher };
}

export async function getAccounts(admin: Wallet, num: number): Promise<Wallet[]> {
  const accounts: Wallet[] = [];
  const accountPromise = [];
  for (let i = 0; i < num; i += 1) {
    const wallet = new ethers.Wallet(UserPrivKeys[i]).connect(ethers.provider);
    // @ts-ignore
    accounts.push(wallet);
    const trx = admin.sendTransaction({
      to: accounts[i].address,
      value: parseUnits('10'),
    });
    accountPromise.push(trx);
    // for (let j = 0; j < assets.length; j++) {
    //   await assets[j].transfer(accounts[i].address, parseUnits('1000'));
    // }
  }

  await Promise.all(accountPromise);
  accounts.sort((a, b) => (a.address.toLowerCase() > b.address.toLowerCase() ? 1 : -1));
  return accounts;
}
