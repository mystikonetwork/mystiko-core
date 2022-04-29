import { deployMockContract, MockContract } from '@ethereum-waffle/mock-contract';
import { MockProvider } from '@ethereum-waffle/provider';
import { MystikoConfig } from '@mystikonetwork/config';
import {
  ERC20__factory,
  MystikoV2Bridge__factory,
  MystikoV2Loop__factory,
} from '@mystikonetwork/contracts-abi';
import { toDecimals } from '@mystikonetwork/utils';
import { ethers } from 'ethers';
import {
  CommitmentHandlerV2,
  DepositExecutorV2,
  DepositHandlerV2,
  MystikoContextInterface,
  WalletHandlerV2,
} from '../../../../src';
import { createTestContext } from '../../../common/context';

let config: MystikoConfig;
let context: MystikoContextInterface;
let walletHandler: WalletHandlerV2;
let depositHandler: DepositHandlerV2;
let commitmentHandler: CommitmentHandlerV2;
let executor: DepositExecutorV2;
let mockERC20: MockContract;
let mockMystikoV2Loop: MockContract;
let mockMystikoV2Bridge: MockContract;
let mockProvider: MockProvider;
let etherWallet: ethers.Wallet;

beforeEach(async () => {
  etherWallet = ethers.Wallet.createRandom();
  mockProvider = new MockProvider({
    ganacheOptions: {
      accounts: [{ balance: toDecimals(10), secretKey: etherWallet.privateKey }],
    },
  });
  mockERC20 = await deployMockContract(etherWallet, ERC20__factory.abi);
  mockMystikoV2Loop = await deployMockContract(etherWallet, MystikoV2Loop__factory.abi);
  mockMystikoV2Bridge = await deployMockContract(etherWallet, MystikoV2Bridge__factory.abi);
  config = await MystikoConfig.createFromFile('tests/files/config.test.json');
  context = await createTestContext({ config });
  walletHandler = new WalletHandlerV2(context);
  depositHandler = new DepositHandlerV2(context);
  commitmentHandler = new CommitmentHandlerV2(context);
  executor = new DepositExecutorV2(context);
});

afterEach(async () => {
  await context.db.remove();
});
