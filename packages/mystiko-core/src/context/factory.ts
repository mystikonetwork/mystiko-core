import { MystikoConfig } from '@mystikonetwork/config';
import { MystikoDatabase } from '@mystikonetwork/database';
import { MystikoProtocol } from '@mystikonetwork/protocol';
import { ContextFactory } from '../interface';
import { MystikoContext } from './impl';

export class DefaultContextFactory implements ContextFactory<MystikoContext> {
  private readonly db: MystikoDatabase;

  private readonly config: MystikoConfig;

  private readonly protocol: MystikoProtocol;

  constructor(config: MystikoConfig, db: MystikoDatabase, protocol: MystikoProtocol) {
    this.db = db;
    this.config = config;
    this.protocol = protocol;
  }

  createContext(): MystikoContext {
    return new MystikoContext(this.config, this.db, this.protocol);
  }
}
