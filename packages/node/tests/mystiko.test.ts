import mystiko from '../src';

test('test initialize', async () => {
  await mystiko.initialize({ dbInMemory: true });
  await mystiko.db?.destroy();
});
