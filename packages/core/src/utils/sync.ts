import { Contract } from '@mystikonetwork/database';

export type SyncTask = {
  contractAddress: string;
  startBlock: number;
  endBlock: number;
};

export function splitSyncTasks(contracts: Contract[], targetBlock: number, batchSize: number): SyncTask[][] {
  const taskGroups: SyncTask[][] = [];
  contracts.forEach((contract) => {
    const tasks: SyncTask[] = [];
    for (let i = contract.syncedBlockNumber + 1; i <= targetBlock; i += batchSize) {
      tasks.push({
        contractAddress: contract.contractAddress,
        startBlock: i,
        endBlock: Math.min(i + batchSize - 1, targetBlock),
      });
    }
    if (tasks.length > 0) {
      taskGroups.push(tasks);
    }
  });
  const tranposedTaskGroups: SyncTask[][] = [];
  for (let i = 0; i < taskGroups.length; i += 1) {
    const tasks = taskGroups[i];
    for (let j = 0; j < tasks.length; j += 1) {
      const task = tasks[j];
      if (!tranposedTaskGroups[j]) {
        tranposedTaskGroups[j] = [];
      }
      tranposedTaskGroups[j].push(task);
    }
  }
  return tranposedTaskGroups;
}
