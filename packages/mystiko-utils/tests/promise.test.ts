import { promiseWithTimeout, TimeoutError } from '../src';

test('test promiseWithTimeout', async () => {
  let timer: NodeJS.Timer | undefined;
  const promise = new Promise((resolve) => {
    timer = setTimeout(resolve, 3000);
  });
  await expect(promiseWithTimeout(promise, 100)).rejects.toThrow(new TimeoutError('timeout after 100 ms'));
  if (timer) {
    clearTimeout(timer);
  }
});
