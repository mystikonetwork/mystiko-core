import { createError, MystikoContext, MystikoErrorCode } from '../../src';
import { createTestContext } from '../common/context';

test('test raise errors', async () => {
  const context = await createTestContext();
  expect(() => context.accounts).toThrow(
    createError('account handler has not been set', MystikoErrorCode.NO_HANDLER),
  );
  expect(() => context.assets).toThrow(
    createError('asset handler has not been set', MystikoErrorCode.NO_HANDLER),
  );
  expect(() => context.chains).toThrow(
    createError('chain handler has not been set', MystikoErrorCode.NO_HANDLER),
  );
  expect(() => context.contracts).toThrow(
    createError('contract handler has not been set', MystikoErrorCode.NO_HANDLER),
  );
  expect(() => context.commitments).toThrow(
    createError('commitment handler has not been set', MystikoErrorCode.NO_HANDLER),
  );
  expect(() => context.deposits).toThrow(
    createError('deposit handler has not been set', MystikoErrorCode.NO_HANDLER),
  );
  expect(() => context.nullifiers).toThrow(
    createError('nullifier handler has not been set', MystikoErrorCode.NO_HANDLER),
  );
  expect(() => context.transactions).toThrow(
    createError('transaction handler has not been set', MystikoErrorCode.NO_HANDLER),
  );
  expect(() => context.wallets).toThrow(
    createError('wallet handler has not been set', MystikoErrorCode.NO_HANDLER),
  );
  const newContext = new MystikoContext(context.config, context.db, context.protocol);
  expect(() => newContext.providers).toThrow(
    createError('provider pool has not been set', MystikoErrorCode.NO_PROVIDER_POOL),
  );
  expect(() => newContext.executors).toThrow(
    createError('executor factory has not been set', MystikoErrorCode.NO_EXECUTOR),
  );

  expect(() => newContext.gasRelayers).toThrow(
    createError('gas relayer client has not been set', MystikoErrorCode.NO_GAS_RELAYER_CLIENT),
  );
  expect(() => newContext.screening).toThrow(
    createError('prover factory has not been set', MystikoErrorCode.NO_SCREENING_CLIENT),
  );
});
