import { initBaseContractFactory } from './contract/base';
import { initTestTokenContractFactory } from './contract/token';
import { initTBridgeContractFactory } from './contract/tbridge';
import { initPoolContractFactory, togglePoolSanctionCheck } from './contract/commitment';
import { initDepositContractFactory, toggleDepositSanctionCheck } from './contract/depsit';
import { LOGRED } from './common/constant';
import { loadConfig } from './config/config';

let ethers: any;

// deploy mystiko contract and config contract
async function toggleSaction(taskArgs: any) {
  const c = loadConfig(taskArgs);
  const parameter = taskArgs.param;

  if (parameter !== 'true' && parameter !== 'false') {
    console.error(LOGRED, 'wrong parameter');
    return;
  }

  const checkDisable = parameter === 'true';

  // @ts-ignore
  const poolAddress = c.pairSrcPoolCfg.address;
  await togglePoolSanctionCheck(poolAddress, checkDisable);

  const depositAddress = c.pairSrcDepositCfg.address;
  await toggleDepositSanctionCheck(depositAddress, checkDisable);
}

export async function update(taskArgs: any, hre: any) {
  ethers = hre.ethers;
  await initBaseContractFactory(ethers);
  await initTestTokenContractFactory(ethers);
  await initTBridgeContractFactory(ethers);
  await initPoolContractFactory(ethers);
  await initDepositContractFactory(ethers);

  if (taskArgs.func === 'toggleSaction') {
    await toggleSaction(taskArgs);
  } else {
    console.error(LOGRED, 'wrong step');
  }
}
