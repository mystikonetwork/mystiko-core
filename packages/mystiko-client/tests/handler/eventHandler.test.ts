import { MystikoConfig, readFromFile } from '@mystiko/config';
import { EventHandler, createDatabase, MystikoDatabase } from '../../src';

let db: MystikoDatabase;
let config: MystikoConfig;
let eventHandler: EventHandler;

beforeEach(async () => {
  db = await createDatabase('test.db');
  config = await readFromFile('tests/config/config.test.json');
  eventHandler = new EventHandler(db, config);
});

test('test addEvent', async () => {
  let event = await eventHandler.addEvent({
    chainId: 1,
    contractAddress: '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879',
    transactionHash: '0x714a4ca5465bfe9e0a4290429672acfc453c9e26a9e2a42921dbcc886e562be8',
    topic: 'Deposit',
    argumentData: {
      leaf: '0x14B84B9F09A74ED809ADE2FEA8BD9B5B6D5BB96E18FD163E8682E7B670605133',
      leafIndex: 1,
      amount: '414250000000000',
    },
  });
  expect(event.chainId).toBe(1);
  expect(event.contractAddress).toBe('0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879');
  expect(event.transactionHash).toBe('0x714a4ca5465bfe9e0a4290429672acfc453c9e26a9e2a42921dbcc886e562be8');
  expect(event.topic).toBe('Deposit');
  expect(event.argumentData).toStrictEqual({
    leaf: '0x14B84B9F09A74ED809ADE2FEA8BD9B5B6D5BB96E18FD163E8682E7B670605133',
    leafIndex: 1,
    amount: '414250000000000',
  });
  event = await eventHandler.addEvent({
    chainId: 1,
    contractAddress: '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879',
    transactionHash: '0x714a4ca5465bfe9e0a4290429672acfc453c9e26a9e2a42921dbcc886e562be8',
    topic: 'Deposit',
    argumentData: {
      leaf: '0x14B84B9F09A74ED809ADE2FEA8BD9B5B6D5BB96E18FD163E8682E7B670605133',
      leafIndex: 3,
      amount: '414250000000000',
    },
  });
  expect(event.argumentData).toStrictEqual({
    leaf: '0x14B84B9F09A74ED809ADE2FEA8BD9B5B6D5BB96E18FD163E8682E7B670605133',
    leafIndex: 3,
    amount: '414250000000000',
  });
  let event1 = eventHandler.getEvent(
    1,
    '0x714a4ca5465bfe9e0a4290429672acfc453c9e26a9e2a42921dbcc886e562be8',
    'Deposit',
  );
  expect(event1?.id).toBe(1);
  event1 = eventHandler.getEvent(
    1,
    '0x714a4ca5465bfe9e0a4290429672acfc453c9e26a9e2a42921dbcc886e562be8',
    'Withdraw',
  );
  expect(event1).toBe(undefined);
});

test('test getEvents', async () => {
  const rawEvents = [
    {
      chainId: 1,
      contractAddress: '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879',
      transactionHash: '0x714a4ca5465bfe9e0a4290429672acfc453c9e26a9e2a42921dbcc886e562be8',
      topic: 'Deposit',
      argumentData: {
        leaf: '0x14B84B9F09A74ED809ADE2FEA8BD9B5B6D5BB96E18FD163E8682E7B670605133',
        leafIndex: 1,
        amount: '414250000000000',
      },
    },
    {
      chainId: 1,
      contractAddress: '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879',
      transactionHash: '0x570b6950f8682c6a2fff20bc0d074ac0e4de48dd0821b25ff97fab86a1100e5b',
      topic: 'Deposit',
      argumentData: {
        leaf: '0x14B84B9F09A74ED809ADE2FEA8BD9B5B6D5BB96E18FD163E8682E7B670605133',
        leafIndex: 1,
        amount: '414250000000000',
      },
    },
    {
      chainId: 56,
      contractAddress: '0x2ac75a8f7db08037aa1ba23781da626647c7632f',
      transactionHash: '0x48334e8ecf86d3d689dcd9c490f2b781daed348859aceacde349b6bc68b2ca24',
      topic: 'Deposit',
      argumentData: {
        leaf: '0xf279e6a1f5e320cca91135676d9cb6e44ca8a08c0b88342bcdb1144f6511b568',
        leafIndex: 1,
        amount: '414250000000000',
      },
    },
  ];
  await eventHandler.addEvents(rawEvents);
  let events = eventHandler.getEvents();
  expect(events.length).toBe(3);
  events = eventHandler.getEvents({ filterFunc: (event) => event.chainId === 56 });
  expect(events.length).toBe(1);
  expect(events[0].transactionHash).toBe(
    '0x48334e8ecf86d3d689dcd9c490f2b781daed348859aceacde349b6bc68b2ca24',
  );
  events = eventHandler.getEvents({ sortBy: 'chainId' });
  expect(events[0].chainId).toBe(1);
  events = eventHandler.getEvents({ sortBy: 'chainId', desc: true });
  expect(events[0].chainId).toBe(56);
  events = eventHandler.getEvents({ offset: 2, limit: 10 });
  expect(events.length).toBe(1);
});

test('test removeEvents', async () => {
  const rawEvents = [
    {
      chainId: 1,
      contractAddress: '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879',
      transactionHash: '0x714a4ca5465bfe9e0a4290429672acfc453c9e26a9e2a42921dbcc886e562be8',
      topic: 'Deposit',
      argumentData: {
        leaf: '0x14B84B9F09A74ED809ADE2FEA8BD9B5B6D5BB96E18FD163E8682E7B670605133',
        leafIndex: 1,
        amount: '414250000000000',
      },
    },
    {
      chainId: 1,
      contractAddress: '0x7Acfe657cC3eA9066CD748fbEa241cfA138DC879',
      transactionHash: '0x570b6950f8682c6a2fff20bc0d074ac0e4de48dd0821b25ff97fab86a1100e5b',
      topic: 'Deposit',
      argumentData: {
        leaf: '0x14B84B9F09A74ED809ADE2FEA8BD9B5B6D5BB96E18FD163E8682E7B670605133',
        leafIndex: 1,
        amount: '414250000000000',
      },
    },
    {
      chainId: 56,
      contractAddress: '0x2ac75a8f7db08037aa1ba23781da626647c7632f',
      transactionHash: '0x48334e8ecf86d3d689dcd9c490f2b781daed348859aceacde349b6bc68b2ca24',
      topic: 'Deposit',
      argumentData: {
        leaf: '0xf279e6a1f5e320cca91135676d9cb6e44ca8a08c0b88342bcdb1144f6511b568',
        leafIndex: 1,
        amount: '414250000000000',
      },
    },
  ];
  await eventHandler.addEvents(rawEvents);
  await eventHandler.removeEvents((event) => event.chainId === 56);
  expect(eventHandler.getEvents().length).toBe(2);
  await eventHandler.removeEvents();
  expect(eventHandler.getEvents().length).toBe(0);
});
