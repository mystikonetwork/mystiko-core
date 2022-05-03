import { BridgeType, MystikoConfig } from '@mystikonetwork/config';
import { createTestContext } from '../../../common/context';

test('test basic getters', async () => {
  const context = await createTestContext({
    config: await MystikoConfig.createFromFile('tests/files/config.test.json'),
  });
  const depositContractConfig = context.config.getDepositContractConfig(97, 97, 'BNB', BridgeType.LOOP);
  const poolContractConfig = context.config.getPoolContractConfig(97, 'BNB', BridgeType.LOOP);
  if (!depositContractConfig) {
    throw new Error('deposit contract config should not be undefined');
  }
  if (!poolContractConfig) {
    throw new Error('deposit contract config should not be undefined');
  }
  expect(context.executors.getAssetExecutor()).not.toBe(undefined);
  expect(context.executors.getCommitmentExecutor()).not.toBe(undefined);
  expect(context.executors.getDepositExecutor(depositContractConfig)).not.toBe(undefined);
  expect(context.executors.getTransactionExecutor(poolContractConfig)).not.toBe(undefined);
});
