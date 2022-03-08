import { Tracer, MystikoTracer } from './default';
import SentryTracer from './sentry';

const defaultTracer = new MystikoTracer();

export { SentryTracer, Tracer, MystikoTracer };
export default defaultTracer;
