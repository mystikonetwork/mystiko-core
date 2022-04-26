import { Logger } from 'loglevel';
import { v4 as uuid } from 'uuid';
import { MystikoConfig } from '@mystikonetwork/config';
import { MystikoDatabase } from '@mystikonetwork/database';
import { MystikoProtocol } from '@mystikonetwork/protocol';
import { logger as rootLogger } from '@mystikonetwork/utils';
import { MystikoContextInterface } from '../interface';

export class MystikoHandler {
  protected readonly context: MystikoContextInterface;

  protected readonly logger: Logger;

  constructor(context: MystikoContextInterface) {
    this.context = context;
    this.logger = rootLogger.getLogger(this.constructor.name);
  }

  public get config(): MystikoConfig {
    return this.context.config;
  }

  public get db(): MystikoDatabase {
    return this.context.db;
  }

  public get protocol(): MystikoProtocol {
    return this.context.protocol;
  }

  public static generateId(): string {
    return uuid();
  }

  public static now(): string {
    return new Date().toISOString();
  }
}
