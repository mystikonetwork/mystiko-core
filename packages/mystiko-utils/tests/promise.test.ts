import { promiseWithTimeout, TimeoutError } from '../src';

test('test promiseWithTimeout', async () => {
  const promise = new Promise((resolve) => {
    setTimeout(resolve, 3000);
  });
  await expect(promiseWithTimeout(promise, 100)).rejects.toThrow(new TimeoutError('timeout after 100 ms'));
});
