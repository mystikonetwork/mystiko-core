export enum CommitmentStatus {
  SRC_SUCCEEDED = 'srcSucceeded',
  QUEUED = 'queued',
  INCLUDED = 'included',
  SPENT = 'spent',
  FAILED = 'failed',
}

export enum DepositStatus {
  INIT = 'init',
  ASSET_APPROVING = 'assetApproving',
  ASSET_APPROVED = 'assetApproved',
  SRC_PENDING = 'srcPending',
  SRC_SUCCEEDED = 'srcSucceeded',
  QUEUED = 'queued',
  INCLUDED = 'included',
  FAILED = 'failed',
}

export enum TransactionEnum {
  TRANSFER = 'transfer',
  WITHDRAW = 'withdraw',
}

export enum TransactionStatus {
  INIT = 'init',
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

export enum CircuitEnum {
  TRANSACTION1X0 = 'transaction1x0',
  TRANSACTION1X1 = 'transaction1x1',
  TRANSACTION1X2 = 'transaction1x2',
  TRANSACTION2X0 = 'transaction2x0',
  TRANSACTION2X1 = 'transaction2x1',
  TRANSACTION2X2 = 'transaction2x2',
}
