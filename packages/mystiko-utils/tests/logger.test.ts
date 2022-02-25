import { initLogger, logger } from '../src';

test('test basic', () => {
  logger.setLevel('info');
  logger.info('logger should be working');
  initLogger();
  logger.info('logger should be still working');
});
