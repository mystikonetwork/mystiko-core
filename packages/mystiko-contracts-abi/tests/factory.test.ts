import { ethers } from 'ethers';
import {
  CommitmentPool,
  ERC20,
  MystikoContractFactory,
  MystikoV2Bridge,
  MystikoV2Loop,
  MystikoV2WithCeler,
  MystikoV2WithTBridge,
} from '../src';

let provider: ethers.providers.Provider;

beforeEach(() => {
  provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
});

test('test connect ERC20', () => {
  const erc20 = MystikoContractFactory.connect<ERC20>(
    'ERC20',
    '0x5c7c88e07e3899fff3cc0effe23494591dfe87b6',
    provider,
  );
  expect(erc20.address).toBe('0x5c7c88e07e3899fff3cc0effe23494591dfe87b6');
});

test('test connect CommitmentPool', () => {
  const erc20 = MystikoContractFactory.connect<CommitmentPool>(
    'CommitmentPool',
    '0x5c7c88e07e3899fff3cc0effe23494591dfe87b6',
    provider,
  );
  expect(erc20.address).toBe('0x5c7c88e07e3899fff3cc0effe23494591dfe87b6');
});

test('test connect MystikoV2Loop', () => {
  let erc20 = MystikoContractFactory.connect<MystikoV2Loop>(
    'MystikoV2Loop',
    '0x5c7c88e07e3899fff3cc0effe23494591dfe87b6',
    provider,
  );
  expect(erc20.address).toBe('0x5c7c88e07e3899fff3cc0effe23494591dfe87b6');
  erc20 = MystikoContractFactory.connect<MystikoV2Loop>(
    'MystikoV2WithLoopERC20',
    '0x5c7c88e07e3899fff3cc0effe23494591dfe87b6',
    provider,
  );
  expect(erc20.address).toBe('0x5c7c88e07e3899fff3cc0effe23494591dfe87b6');
});

test('test connect MystikoV2Bridge', () => {
  const erc20 = MystikoContractFactory.connect<MystikoV2Bridge>(
    'MystikoV2Bridge',
    '0x5c7c88e07e3899fff3cc0effe23494591dfe87b6',
    provider,
  );
  expect(erc20.address).toBe('0x5c7c88e07e3899fff3cc0effe23494591dfe87b6');
});

test('test connect MystikoV2WithCeler', () => {
  const erc20 = MystikoContractFactory.connect<MystikoV2WithCeler>(
    'MystikoV2WithCelerERC20',
    '0x5c7c88e07e3899fff3cc0effe23494591dfe87b6',
    provider,
  );
  expect(erc20.address).toBe('0x5c7c88e07e3899fff3cc0effe23494591dfe87b6');
});

test('test connect MystikoV2WithTBridge', () => {
  const erc20 = MystikoContractFactory.connect<MystikoV2WithTBridge>(
    'MystikoV2WithTBridgeERC20',
    '0x5c7c88e07e3899fff3cc0effe23494591dfe87b6',
    provider,
  );
  expect(erc20.address).toBe('0x5c7c88e07e3899fff3cc0effe23494591dfe87b6');
});

test('test invalid contractName', () => {
  expect(() =>
    MystikoContractFactory.connect('wrong name', '0x5c7c88e07e3899fff3cc0effe23494591dfe87b6', provider),
  ).toThrow(new Error('unsupported contract name wrong name'));
});
