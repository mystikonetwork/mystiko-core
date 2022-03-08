export interface Tracer {
  traceError(error: any): void;
  traceMessage(message: string): void;
}

export class MystikoTracer implements Tracer {
  private impl?: Tracer;

  public traceError(error: any): void {
    if (this.impl) {
      this.impl.traceError(error);
    }
  }

  public traceMessage(message: string): void {
    if (this.impl) {
      this.impl.traceMessage(message);
    }
  }

  public setImpl(tracer: Tracer) {
    this.impl = tracer;
  }
}
