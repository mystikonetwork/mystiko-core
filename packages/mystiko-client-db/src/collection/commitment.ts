import { RxCollection } from 'rxdb';
import { CommitmentType } from '../schema';
import { CommitmentMethods } from '../document';

export type CommitmentCollectionMethods = {};

export type CommitmentCollection = RxCollection<
  CommitmentType,
  CommitmentMethods,
  CommitmentCollectionMethods
>;

export const commitmentCollectionMethods: CommitmentCollectionMethods = {};
