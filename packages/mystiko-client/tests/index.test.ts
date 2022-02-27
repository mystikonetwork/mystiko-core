import mystiko from '../src/index';

test('test initialize', async () => {
  await mystiko.initialize({ isTestnet: true, conf: 'tests/config/config.test.json' });
  expect(mystiko.utils).not.toBe(undefined);
  expect(mystiko.models).not.toBe(undefined);
  expect(mystiko.config).not.toBe(undefined);
  expect(mystiko.db).not.toBe(undefined);
  expect(mystiko.db.adapter).toBe(undefined);
  expect(mystiko.db.exportDataAsString).not.toBe(undefined);
  expect(mystiko.db.importDataFromJson).not.toBe(undefined);
  expect(mystiko.db.importDataFromJsonFile).not.toBe(undefined);
  expect(mystiko.wallets).not.toBe(undefined);
  expect(mystiko.accounts).not.toBe(undefined);
  expect(mystiko.deposits).not.toBe(undefined);
  expect(mystiko.contracts).not.toBe(undefined);
  expect(mystiko.events).not.toBe(undefined);
  expect(mystiko.providers).not.toBe(undefined);
  expect(mystiko.contractPool).not.toBe(undefined);
  expect(mystiko.notes).not.toBe(undefined);
  expect(mystiko.withdraws).not.toBe(undefined);
  expect(mystiko.signers).not.toBe(undefined);
  expect(mystiko.signers?.metaMask).not.toBe(undefined);
  expect(mystiko.pullers?.eventPuller).not.toBe(undefined);
  expect(mystiko.logger).not.toBe(undefined);

  await mystiko.initialize({
    isTestnet: true,
    dbFile: 'test_file.db',
    conf: 'tests/config/config.test.json',
  });
  expect(mystiko.db).not.toBe(undefined);
  await mystiko.initialize({ isTestnet: false, conf: 'tests/config/config.test.json' });
  expect(mystiko.db).not.toBe(undefined);
  await mystiko.initialize({});
  expect(mystiko.db).not.toBe(undefined);
});
