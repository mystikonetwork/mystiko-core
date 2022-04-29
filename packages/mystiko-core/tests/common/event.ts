import { MystikoConfig } from '@mystikonetwork/config';
import { CommitmentPool, MystikoContractFactory } from '@mystikonetwork/contracts-abi';
import { DefaultProviderFactory, readJsonFile } from '@mystikonetwork/utils';
import { ethers } from 'ethers';
import fs from 'fs';

export type ContractEvents = {
  [key: string]: ethers.Event[];
};

export type ChainEvents = {
  [key: string]: ContractEvents;
};

export type AllEvents = {
  [key: number]: ChainEvents;
};

export async function loadEvents(fileName: string): Promise<AllEvents> {
  const data = await readJsonFile(fileName);
  Object.keys(data).forEach((chainId) => {
    Object.keys(data[chainId]).forEach((contractAddress) => {
      Object.keys(data[chainId][contractAddress]).forEach((topic) => {
        data[chainId][contractAddress][topic] = data[chainId][contractAddress][topic].map((event: any) => {
          const { args } = event;
          const newArgs: any[] = [];
          args.forEach((arg: any) => {
            if (arg.type === 'BigNumber') {
              newArgs.push(ethers.BigNumber.from(arg.hex));
            } else {
              newArgs.push(arg);
            }
          });
          event.args = newArgs;
          return event;
        });
      });
    });
  });
  return Promise.resolve(data as AllEvents);
}

export async function generateEvents(fileName: string) {
  const config = await MystikoConfig.createFromFile('tests/files/config.test.json');
  const providerFactory = new DefaultProviderFactory();
  const events: AllEvents = {};
  const promises: Promise<any>[] = [];
  const { chains } = config;
  for (let i = 0; i < chains.length; i += 1) {
    const chainConfig = chains[i];
    const provider = providerFactory.createProvider(chainConfig.providers.map((p) => ({ url: p.url })));
    const { poolContracts } = chainConfig;
    events[chainConfig.chainId] = {};
    for (let j = 0; j < poolContracts.length; j += 1) {
      const poolContract = poolContracts[j];
      events[chainConfig.chainId][poolContract.address] = {};
      const contract = MystikoContractFactory.connect<CommitmentPool>(
        'CommitmentPool',
        poolContract.address,
        provider,
      );
      promises.push(
        contract
          .queryFilter(contract.filters.CommitmentQueued(), poolContract.startBlock + 1)
          .then((rawEvents) => {
            events[chainConfig.chainId][poolContract.address][
              JSON.stringify(contract.filters.CommitmentQueued().topics)
            ] = rawEvents;
          }),
      );
      promises.push(
        contract
          .queryFilter(contract.filters.CommitmentIncluded(), poolContract.startBlock + 1)
          .then((rawEvents) => {
            events[chainConfig.chainId][poolContract.address][
              JSON.stringify(contract.filters.CommitmentIncluded().topics)
            ] = rawEvents;
          }),
      );
      promises.push(
        contract
          .queryFilter(contract.filters.CommitmentSpent(), poolContract.startBlock + 1)
          .then((rawEvents) => {
            events[chainConfig.chainId][poolContract.address][
              JSON.stringify(contract.filters.CommitmentSpent().topics)
            ] = rawEvents;
          }),
      );
    }
  }
  await Promise.all(promises);
  fs.writeFileSync(fileName, JSON.stringify(events, null, 2));
}
