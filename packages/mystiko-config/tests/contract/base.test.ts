import { validate } from 'class-validator';
import { BaseContractConfig, ContractType } from '../../src';

let config: BaseContractConfig;

beforeEach(() => {
  config = new BaseContractConfig();
  config.version = 2;
  config.name = 'MystikoWithPolyERC20';
  config.address = '0x961f315a836542e603a3df2e0dd9d4ecd06ebc67';
  config.type = ContractType.DEPOSIT;
  config.startBlock = 1000000;
  config.eventFilterSize = 10000;
});

test('test validate success', async () => {
  expect((await validate(config)).length).toBe(0);
  config.eventFilterSize = undefined;
  expect((await validate(config)).length).toBe(0);
});
