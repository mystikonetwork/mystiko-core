/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from 'ethers';
import { Provider, TransactionRequest } from '@ethersproject/providers';
import type { MystikoTBridgeProxy, MystikoTBridgeProxyInterface } from '../MystikoTBridgeProxy';

const _abi = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'toContract',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'toChainId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'fromContract',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: 'message',
        type: 'bytes',
      },
    ],
    name: 'TBridgeCrossChainMessage',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_newOperator',
        type: 'address',
      },
    ],
    name: 'changeOperator',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint64',
        name: '_fromChainId',
        type: 'uint64',
      },
      {
        internalType: 'address',
        name: '_fromContractAddress',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_toContractAddress',
        type: 'address',
      },
      {
        internalType: 'bytes',
        name: '_message',
        type: 'bytes',
      },
    ],
    name: 'crossChainSyncTx',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'operator',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_toContract',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_toChainId',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: '_message',
        type: 'bytes',
      },
    ],
    name: 'sendMessage',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_recipient',
        type: 'address',
      },
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
];

const _bytecode =
  '0x608060405234801561001057600080fd5b50600080546001600160a01b031916331790556106e6806100326000396000f3fe60806040526004361061005a5760003560e01c806351cff8d91161004357806351cff8d9146100b6578063570ca735146100c95780639f3ce55a1461010157600080fd5b806306394c9b1461005f5780634969e16b14610081575b600080fd5b34801561006b57600080fd5b5061007f61007a366004610416565b610114565b005b34801561008d57600080fd5b506100a161009c366004610525565b61019e565b60405190151581526020015b60405180910390f35b61007f6100c4366004610416565b6102c6565b3480156100d557600080fd5b506000546100e9906001600160a01b031681565b6040516001600160a01b0390911681526020016100ad565b61007f61010f366004610438565b6103b8565b6000546001600160a01b031633146101645760405162461bcd60e51b815260206004820152600e60248201526d27b7363c9037b832b930ba37b91760911b60448201526064015b60405180910390fd5b600080547fffffffffffffffffffffffff0000000000000000000000000000000000000000166001600160a01b0392909216919091179055565b600080546001600160a01b031633146101ea5760405162461bcd60e51b815260206004820152600e60248201526d27b7363c9037b832b930ba37b91760911b604482015260640161015b565b60405163bd81e18d60e01b81526001600160a01b0385169063bd81e18d9061021c90899089908890889060040161064a565b602060405180830381600087803b15801561023657600080fd5b505af115801561024a573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061026e9190610503565b6102ba5760405162461bcd60e51b815260206004820181905260248201527f63616c6c2073796e634465706f73697454782072657475726e73206572726f72604482015260640161015b565b50600195945050505050565b6000546001600160a01b031633146103115760405162461bcd60e51b815260206004820152600e60248201526d27b7363c9037b832b930ba37b91760911b604482015260640161015b565b6000816001600160a01b03164760405160006040518083038185875af1925050503d806000811461035e576040519150601f19603f3d011682016040523d82523d6000602084013e610363565b606091505b50509050806103b45760405162461bcd60e51b815260206004820152600f60248201527f7769746864726177206661696c65640000000000000000000000000000000000604482015260640161015b565b5050565b7fd80857a183b2092f9e8ac431b7677da383dab7002c167fd82e6b3172ab86e8d8838333846040516103ed94939291906105d1565b60405180910390a1505050565b80356001600160a01b038116811461041157600080fd5b919050565b60006020828403121561042857600080fd5b610431826103fa565b9392505050565b60008060006060848603121561044d57600080fd5b610456846103fa565b925060208401359150604084013567ffffffffffffffff8082111561047a57600080fd5b818601915086601f83011261048e57600080fd5b8135818111156104a0576104a061069a565b604051601f8201601f19908116603f011681019083821181831017156104c8576104c861069a565b816040528281528960208487010111156104e157600080fd5b8260208601602083013760006020848301015280955050505050509250925092565b60006020828403121561051557600080fd5b8151801515811461043157600080fd5b60008060008060006080868803121561053d57600080fd5b853567ffffffffffffffff808216821461055657600080fd5b819650610565602089016103fa565b9550610573604089016103fa565b9450606088013591508082111561058957600080fd5b818801915088601f83011261059d57600080fd5b8135818111156105ac57600080fd5b8960208285010111156105be57600080fd5b9699959850939650602001949392505050565b60006001600160a01b038087168352602086818501528186166040850152608060608501528451915081608085015260005b8281101561061f5785810182015185820160a001528101610603565b8281111561063157600060a084870101525b5050601f01601f19169190910160a00195945050505050565b67ffffffffffffffff851681526001600160a01b038416602082015260606040820152816060820152818360808301376000818301608090810191909152601f909201601f191601019392505050565b634e487b7160e01b600052604160045260246000fdfea26469706673582212205880c3bbd6d18abe8c974a1118acc0a469fd49bebc6d4f0a3c8a1ae0d997570164736f6c63430008070033';

type MystikoTBridgeProxyConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: MystikoTBridgeProxyConstructorParams,
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class MystikoTBridgeProxy__factory extends ContractFactory {
  constructor(...args: MystikoTBridgeProxyConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = 'MystikoTBridgeProxy';
  }

  deploy(overrides?: Overrides & { from?: string | Promise<string> }): Promise<MystikoTBridgeProxy> {
    return super.deploy(overrides || {}) as Promise<MystikoTBridgeProxy>;
  }
  getDeployTransaction(overrides?: Overrides & { from?: string | Promise<string> }): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): MystikoTBridgeProxy {
    return super.attach(address) as MystikoTBridgeProxy;
  }
  connect(signer: Signer): MystikoTBridgeProxy__factory {
    return super.connect(signer) as MystikoTBridgeProxy__factory;
  }
  static readonly contractName: 'MystikoTBridgeProxy';
  public readonly contractName: 'MystikoTBridgeProxy';
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MystikoTBridgeProxyInterface {
    return new utils.Interface(_abi) as MystikoTBridgeProxyInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): MystikoTBridgeProxy {
    return new Contract(address, _abi, signerOrProvider) as MystikoTBridgeProxy;
  }
}