import { withRetry } from '../soap-retry';

describe('withRetry', () => {
  const noopSleep = () => Promise.resolve();

  it('returns the result on the first successful attempt without retrying', async () => {
    const fn = jest.fn().mockResolvedValue('ok');

    const result = await withRetry(fn, { sleep: noopSleep });

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries up to maxRetries and eventually succeeds', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('transient 1'))
      .mockRejectedValueOnce(new Error('transient 2'))
      .mockResolvedValueOnce('ok');

    const result = await withRetry(fn, { maxRetries: 2, sleep: noopSleep });

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws the last error after exhausting all retries', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fails'));

    await expect(
      withRetry(fn, { maxRetries: 2, sleep: noopSleep }),
    ).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry when isRetryable returns false', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('non-retryable'));

    await expect(
      withRetry(fn, {
        maxRetries: 3,
        sleep: noopSleep,
        isRetryable: () => false,
      }),
    ).rejects.toThrow('non-retryable');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('waits with exponential backoff between attempts', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('e1'))
      .mockRejectedValueOnce(new Error('e2'))
      .mockResolvedValueOnce('ok');
    const sleep = jest.fn().mockResolvedValue(undefined);

    await withRetry(fn, { maxRetries: 2, baseDelayMs: 100, sleep });

    expect(sleep).toHaveBeenNthCalledWith(1, 100);
    expect(sleep).toHaveBeenNthCalledWith(2, 200);
  });
});
