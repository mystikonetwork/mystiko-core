import { Logger } from 'loglevel';
import { v4 as uuid } from 'uuid';
import { MystikoConfig } from '@mystikonetwork/config';
import { MystikoDatabase } from '@mystikonetwork/database';
import { MystikoProtocol } from '@mystikonetwork/protocol';
import { logger as rootLogger } from '@mystikonetwork/utils';

export class MystikoHandler {
  protected readonly config: MystikoConfig;

  protected readonly db: MystikoDatabase;

  protected readonly protocol: MystikoProtocol;

  protected readonly logger: Logger;

  constructor(config: MystikoConfig, db: MystikoDatabase, protocol: MystikoProtocol) {
    this.config = config;
    this.db = db;
    this.protocol = protocol;
    this.logger = rootLogger.getLogger(this.constructor.name);
  }

  public static generateId(): string {
    return uuid();
  }

  public static now(): string {
    return new Date().toISOString();
  }
}
