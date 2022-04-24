import { MystikoTBridgeProxy__factory } from '@mystikonetwork/contracts-abi';
import { BridgeConfig } from '../config/bridge';
import { OperatorConfig } from '../config/operator';
import { LOGRED } from '../common/constant';
import { BridgeProxyConfig } from '../config/bridgeProxy';

let MystikoTBridgeProxy: MystikoTBridgeProxy__factory;

export async function initTBridgeContractFactory(ethers: any) {
  MystikoTBridgeProxy = await ethers.getContractFactory('MystikoTBridgeProxy');
}

async function deployTBridgeProxy() {
  console.log('deploy MystikoTBridgeProxy');
  const proxy = await MystikoTBridgeProxy.deploy();
  await proxy.deployed();
  return proxy.address;
}

async function addExecutorWhitelist(addr: string, executors: string[]) {
  console.log('add add executor whitelist');
  const proxy = await MystikoTBridgeProxy.attach(addr);

  try {
    const all = [];
    for (let i = 0; i < executors.length; i += 1) {
      const add = proxy.addExecutorWhitelist(executors[i]);
      all.push(add);
    }
    await Promise.all(all);
  } catch (err: any) {
    console.error(LOGRED, err);
    process.exit(1);
  }
}

export async function getOrDeployTBridgeProxy(
  bridgeCfg: BridgeConfig,
  bridgeProxyCfg: BridgeProxyConfig | undefined,
  operatorCfg: OperatorConfig,
  chainNetwork: string,
) {
  if (bridgeCfg.name === 'loop') {
    return '';
  }

  if (bridgeCfg.name === 'tbridge') {
    if (bridgeProxyCfg === undefined) {
      console.log('tbridge proxy not exist, deploy');

      const addBridgeCfg = bridgeCfg.addBridgeProxyConfig(chainNetwork, '');
      const bridgeProxyAddress = await deployTBridgeProxy();
      console.log('bridgeProxy address is ', bridgeProxyAddress);
      addBridgeCfg.address = bridgeProxyAddress;
      await addExecutorWhitelist(bridgeProxyAddress, operatorCfg.executors);
      return bridgeProxyAddress;
    }
    return bridgeProxyCfg.address;
  }

  if (bridgeProxyCfg === undefined || bridgeProxyCfg.address === undefined || bridgeProxyCfg.address === '') {
    console.error(LOGRED, 'bridge proxy address not configure');
    process.exit(-1);
  }

  return bridgeProxyCfg.address;
}
