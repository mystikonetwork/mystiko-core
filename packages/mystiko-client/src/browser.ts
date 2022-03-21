import * as Sentry from '@sentry/browser';
import { BrowserTracing } from '@sentry/tracing';
import { DefaultClientTestnetConfig, DefaultClientMainnetConfig } from '@mystikonetwork/config';
import Adapter from 'lokijs/src/incremental-indexeddb-adapter';
import { Mystiko, InitOptions } from './mystiko';
import { SentryTracer } from './tracing';

export class MystikoInBrowser extends Mystiko {
  public initialize(options?: InitOptions) {
    const wrappedOptions: InitOptions = { dbAdapter: new Adapter(), ...options };
    if (!wrappedOptions.conf) {
      if (wrappedOptions.isTestnet === undefined || wrappedOptions.isTestnet === null) {
        wrappedOptions.conf = DefaultClientTestnetConfig;
      } else {
        wrappedOptions.conf = wrappedOptions.isTestnet
          ? DefaultClientTestnetConfig
          : DefaultClientMainnetConfig;
      }
    }
    Sentry.init({
      dsn:
        wrappedOptions.tracingEndpoint ||
        'https://2060c50a67ae4975bf6539bb2fb6574b@o1147711.ingest.sentry.io/6248066',
      release: wrappedOptions.tracingVersion || this.version,
      integrations: [new BrowserTracing()],
      tracesSampleRate: wrappedOptions.tracingSampleRate || 0.2,
    });
    this.tracer.setImpl(new SentryTracer(Sentry));
    return super.initialize(wrappedOptions).then((ret) => {
      this.sync?.start();
      return ret;
    });
  }
}

const mystiko = new MystikoInBrowser();
export default mystiko;
