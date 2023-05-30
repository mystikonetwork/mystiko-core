import mystiko from '../src';
import nock from 'nock';

const CONFIG_BASE_URL = 'https://static.mystiko.network/config';
const RELAYER_CONFIG_BASE_URL = 'https://static.mystiko.network/relayer_config';

test('test initialize', async () => {
  nock(CONFIG_BASE_URL).get('/production/testnet/latest.json').reply(200, { version: '1.0.0' });
  nock(RELAYER_CONFIG_BASE_URL).get('/production/testnet/latest.json').reply(200, { version: '1.0.0' });
  await mystiko.initialize({ dbInMemory: true });
  await mystiko.db?.destroy();
});
