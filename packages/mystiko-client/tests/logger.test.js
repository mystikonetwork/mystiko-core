import logger, { initLogger } from '../src/logger.js';

test('test basic', () => {
  logger.setLevel('info');
  logger.info('logger should be working');
  initLogger();
  logger.info('logger should be still working');
});
