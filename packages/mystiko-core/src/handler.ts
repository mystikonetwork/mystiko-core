import { Logger } from 'loglevel';
import { v4 as uuid } from 'uuid';
import { MystikoDatabase } from '@mystikonetwork/database';
import { MystikoProtocol } from '@mystikonetwork/protocol';
import { logger as rootLogger } from '@mystikonetwork/utils';

export class MystikoHandler {
  protected readonly db: MystikoDatabase;

  protected readonly protocol: MystikoProtocol;

  protected readonly logger: Logger;

  constructor(db: MystikoDatabase, protocol: MystikoProtocol) {
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
