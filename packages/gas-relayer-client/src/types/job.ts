export type WaitingJobRequest = {
  registerUrl: string;
  jobId: string;
  options?: WaitingJobOptions;
};

export type WaitingJobOptions = {
  timeoutMs: number;
  intervalMs?: number;
};
