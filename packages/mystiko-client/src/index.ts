import { isBrowser } from 'browser-or-node';
import browserMystiko from './browser';
import nodeMystiko from './node';
import { Mystiko } from './mystiko';

const mystiko: Mystiko = isBrowser ? browserMystiko : nodeMystiko;

export default mystiko;
export * from './mystiko';
export * from './database';
export * from './chain';
export * from './handler';
export * from './model';
export * from './puller';
export * from './version';
