export class TimeoutError extends Error {}

export function promiseWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise((resolve) => {
    setTimeout(resolve, timeoutMs);
  }).then(() => Promise.reject(new TimeoutError(`timeout after ${timeoutMs} ms`)));
  return Promise.race([promise, timeoutPromise]);
}
