import { RxDocument } from 'rxdb';
import { NullifierType } from '../schema';

export type NullifierMethods = {};

export type Nullifier = RxDocument<NullifierType, NullifierMethods>;

export const nullifierMethods: NullifierMethods = {};
