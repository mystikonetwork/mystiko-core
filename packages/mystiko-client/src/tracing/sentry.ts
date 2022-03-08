import { Tracer } from './default';

export default class SentryTracer implements Tracer {
  private readonly sentry: any;

  constructor(sentry: any) {
    this.sentry = sentry;
  }

  public traceError(error: any): void {
    this.sentry.captureException(error);
  }

  public traceMessage(message: string): void {
    this.sentry.captureMessage(message);
  }
}
