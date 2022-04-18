/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from 'ethers';
import { Provider, TransactionRequest } from '@ethersproject/providers';
import type {
  MystikoV2WithTBridgeERC20,
  MystikoV2WithTBridgeERC20Interface,
} from '../MystikoV2WithTBridgeERC20';

const _abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_hasher3',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_token',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'commitment',
        type: 'uint256',
      },
    ],
    name: 'CommitmentCrossChain',
    type: 'event',
  },
  {
    inputs: [],
    name: 'FIELD_SIZE',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'asset',
    outputs: [
      {
        internalType: 'contract IERC20Metadata',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'assetDecimals',
    outputs: [
      {
        internalType: 'uint8',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'assetName',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'assetSymbol',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'assetType',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [],
    name: 'associatedCommitmentPool',
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
    inputs: [],
    name: 'bridgeProxyAddress',
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
    inputs: [],
    name: 'bridgeType',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
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
        name: '_fromContract',
        type: 'address',
      },
      {
        internalType: 'bytes',
        name: '_message',
        type: 'bytes',
      },
      {
        internalType: 'address',
        name: '_executor',
        type: 'address',
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
    inputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'commitment',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'hashK',
            type: 'uint256',
          },
          {
            internalType: 'uint128',
            name: 'randomS',
            type: 'uint128',
          },
          {
            internalType: 'bytes',
            name: 'encryptedNote',
            type: 'bytes',
          },
          {
            internalType: 'uint256',
            name: 'bridgeFee',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'executorFee',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'rollupFee',
            type: 'uint256',
          },
        ],
        internalType: 'struct IMystikoBridge.DepositRequest',
        name: '_request',
        type: 'tuple',
      },
    ],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'hasher3',
    outputs: [
      {
        internalType: 'contract IHasher3',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'isDepositsDisabled',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'minAmount',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'minBridgeFee',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'minExecutorFee',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'minRollupFee',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
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
    inputs: [],
    name: 'peerChainId',
    outputs: [
      {
        internalType: 'uint64',
        name: '',
        type: 'uint64',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'peerContract',
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
    inputs: [],
    name: 'peerMinExecutorFee',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'peerMinRollupFee',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'sanctionsContract',
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
        name: '_commitmentPoolAddress',
        type: 'address',
      },
    ],
    name: 'setAssociatedCommitmentPool',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_bridgeProxyAddress',
        type: 'address',
      },
    ],
    name: 'setBridgeProxyAddress',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_minAmount',
        type: 'uint256',
      },
    ],
    name: 'setMinAmount',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_minBridgeFee',
        type: 'uint256',
      },
    ],
    name: 'setMinBridgeFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_minExecutorFee',
        type: 'uint256',
      },
    ],
    name: 'setMinExecutorFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_minRollupFee',
        type: 'uint256',
      },
    ],
    name: 'setMinRollupFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_peerMinExecutorFee',
        type: 'uint256',
      },
    ],
    name: 'setPeerMinExecutorFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_peerMinRollupFee',
        type: 'uint256',
      },
    ],
    name: 'setPeerMinRollupFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint64',
        name: '_peerChainId',
        type: 'uint64',
      },
      {
        internalType: 'address',
        name: '_peerContract',
        type: 'address',
      },
    ],
    name: 'setpeerContract',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bool',
        name: '_state',
        type: 'bool',
      },
    ],
    name: 'toggleDeposits',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bool',
        name: '_check',
        type: 'bool',
      },
    ],
    name: 'updateSanctionCheck',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_sanction',
        type: 'address',
      },
    ],
    name: 'updateSanctionContractAddress',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const _bytecode =
  '0x6080604052600080546001600160a81b031916740140c57923924b5c5c5455c48d93317139addac8fb1790553480156200003857600080fd5b5060405162002e8138038062002e818339810160408190526200005b91620000b5565b600b8054336001600160a01b0319918216179091556001805482166001600160a01b03948516179055600c805490911691909216179055620000ed565b80516001600160a01b0381168114620000b057600080fd5b919050565b60008060408385031215620000c957600080fd5b620000d48362000098565b9150620000e46020840162000098565b90509250929050565b612d8480620000fd6000396000f3fe60806040526004361061024f5760003560e01c80637cbf0ff611610138578063a564ac16116100b0578063cdfceeba1161007f578063e19abef811610064578063e19abef8146106e7578063ec18d3e214610707578063ed6ea33a1461072757600080fd5b8063cdfceeba14610686578063d1c1a680146106c757600080fd5b8063a564ac161461061e578063c0868f2b14610634578063c2d416011461064a578063c9230c5d1461067157600080fd5b806399383f78116101075780639b215a26116100ec5780639b215a26146105d25780639b2cb5d8146105e8578063a3bc64f2146105fe57600080fd5b806399383f781461059f5780639a03636c146105bf57600080fd5b80637cbf0ff61461051957806382d21cd814610539578063897b0637146105695780639937e1471461058957600080fd5b806334c33e83116101cb578063521ff0571161019a578063570ca7351161017f578063570ca735146104b95780635e10b2b7146104d95780636afdf048146104f957600080fd5b8063521ff0571461047957806353af27d51461049957600080fd5b806334c33e83146103bf57806338d52e0f146103df5780633fe3347a146103ff578063414a37ba1461044557600080fd5b806319e75d6e116102225780632421e155116102075780632421e155146103395780632994d0e41461037f5780632cd26d451461039f57600080fd5b806319e75d6e146102e157806321e32d551461030157600080fd5b806306394c9b146102545780630646286514610276578063153dc4501461029f578063176de7a8146102bf575b600080fd5b34801561026057600080fd5b5061027461026f3660046127c6565b610748565b005b34801561028257600080fd5b5061028c60095481565b6040519081526020015b60405180910390f35b3480156102ab57600080fd5b506102746102ba366004612950565b6107c5565b3480156102cb57600080fd5b506102d461087a565b6040516102969190612bc2565b3480156102ed57600080fd5b506102746102fc366004612950565b610900565b34801561030d57600080fd5b50600354610321906001600160a01b031681565b6040516001600160a01b039091168152602001610296565b34801561034557600080fd5b5060408051808201909152600781527f746272696467650000000000000000000000000000000000000000000000000060208201526102d4565b34801561038b57600080fd5b5061027461039a3660046127e1565b61095b565b3480156103ab57600080fd5b50600454610321906001600160a01b031681565b3480156103cb57600080fd5b506102746103da3660046127c6565b6109cf565b3480156103eb57600080fd5b50600c54610321906001600160a01b031681565b34801561040b57600080fd5b5060408051808201909152600581527f657263323000000000000000000000000000000000000000000000000000000060208201526102d4565b34801561045157600080fd5b5061028c7f30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f000000181565b34801561048557600080fd5b50610274610494366004612950565b610a47565b3480156104a557600080fd5b50600054610321906001600160a01b031681565b3480156104c557600080fd5b50600b54610321906001600160a01b031681565b3480156104e557600080fd5b506102746104f4366004612950565b610af2565b34801561050557600080fd5b50600154610321906001600160a01b031681565b34801561052557600080fd5b50610274610534366004612950565b610b9d565b34801561054557600080fd5b506105596105543660046129b5565b610c48565b6040519015158152602001610296565b34801561057557600080fd5b50610274610584366004612950565b610d01565b34801561059557600080fd5b5061028c60085481565b3480156105ab57600080fd5b506102746105ba3660046127e1565b610d5c565b6102746105cd366004612892565b610dd0565b3480156105de57600080fd5b5061028c600a5481565b3480156105f457600080fd5b5061028c60055481565b34801561060a57600080fd5b506102746106193660046127c6565b611105565b34801561062a57600080fd5b5061028c60075481565b34801561064057600080fd5b5061028c60065481565b34801561065657600080fd5b5061065f61117d565b60405160ff9091168152602001610296565b34801561067d57600080fd5b506102d46111fa565b34801561069257600080fd5b506002546106ae90600160a01b900467ffffffffffffffff1681565b60405167ffffffffffffffff9091168152602001610296565b3480156106d357600080fd5b506102746106e2366004612982565b61123f565b3480156106f357600080fd5b506102746107023660046127c6565b6112f9565b34801561071357600080fd5b50600254610321906001600160a01b031681565b34801561073357600080fd5b50600b5461055990600160a01b900460ff1681565b600b546001600160a01b031633146107a35760405162461bcd60e51b81526020600482015260256024820152600080516020612d2f8339815191526044820152643a34b7b71760d91b60648201526084015b60405180910390fd5b600b80546001600160a01b0319166001600160a01b0392909216919091179055565b600b546001600160a01b0316331461081b5760405162461bcd60e51b81526020600482015260256024820152600080516020612d2f8339815191526044820152643a34b7b71760d91b606482015260840161079a565b600081116108755760405162461bcd60e51b815260206004820152602160248201527f696e76616c69642070656572206d696e696d616c206578656375746f722066656044820152606560f81b606482015260840161079a565b600955565b600c54604080516395d89b4160e01b815290516060926001600160a01b0316916395d89b41916004808301926000929190829003018186803b1580156108bf57600080fd5b505afa1580156108d3573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f191682016040526108fb919081019061281b565b905090565b600b546001600160a01b031633146109565760405162461bcd60e51b81526020600482015260256024820152600080516020612d2f8339815191526044820152643a34b7b71760d91b606482015260840161079a565b600655565b600b546001600160a01b031633146109b15760405162461bcd60e51b81526020600482015260256024820152600080516020612d2f8339815191526044820152643a34b7b71760d91b606482015260840161079a565b60008054911515600160a01b0260ff60a01b19909216919091179055565b600b546001600160a01b03163314610a255760405162461bcd60e51b81526020600482015260256024820152600080516020612d2f8339815191526044820152643a34b7b71760d91b606482015260840161079a565b600080546001600160a01b0319166001600160a01b0392909216919091179055565b600b546001600160a01b03163314610a9d5760405162461bcd60e51b81526020600482015260256024820152600080516020612d2f8339815191526044820152643a34b7b71760d91b606482015260840161079a565b60008111610aed5760405162461bcd60e51b815260206004820152601f60248201527f696e76616c69642070656572206d696e696d616c20726f6c6c75702066656500604482015260640161079a565b600a55565b600b546001600160a01b03163314610b485760405162461bcd60e51b81526020600482015260256024820152600080516020612d2f8339815191526044820152643a34b7b71760d91b606482015260840161079a565b60008111610b985760405162461bcd60e51b815260206004820152601c60248201527f696e76616c6964206d696e696d616c206578656375746f722066656500000000604482015260640161079a565b600755565b600b546001600160a01b03163314610bf35760405162461bcd60e51b81526020600482015260256024820152600080516020612d2f8339815191526044820152643a34b7b71760d91b606482015260840161079a565b60008111610c435760405162461bcd60e51b815260206004820152601a60248201527f696e76616c6964206d696e696d616c20726f6c6c757020666565000000000000604482015260640161079a565b600855565b6004546000906001600160a01b03163314610ca55760405162461bcd60e51b815260206004820152601e60248201527f6d73672073656e646572206973206e6f74206272696467652070726f78790000604482015260640161079a565b6000610ce685858080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525061137192505050565b9050610cf487878584611439565b5060019695505050505050565b600b546001600160a01b03163314610d575760405162461bcd60e51b81526020600482015260256024820152600080516020612d2f8339815191526044820152643a34b7b71760d91b606482015260840161079a565b600555565b600b546001600160a01b03163314610db25760405162461bcd60e51b81526020600482015260256024820152600080516020612d2f8339815191526044820152643a34b7b71760d91b606482015260840161079a565b600b8054911515600160a01b0260ff60a01b19909216919091179055565b600b54600160a01b900460ff1615610e2a5760405162461bcd60e51b815260206004820152601560248201527f6465706f73697473206172652064697361626c65640000000000000000000000604482015260640161079a565b60055481511015610e7d5760405162461bcd60e51b815260206004820152600e60248201527f616d6f756e7420746f6f20666577000000000000000000000000000000000000604482015260640161079a565b6006548160a001511015610ed35760405162461bcd60e51b815260206004820152601260248201527f6272696467652066656520746f6f206665770000000000000000000000000000604482015260640161079a565b6009548160c001511015610f295760405162461bcd60e51b815260206004820152601460248201527f6578656375746f722066656520746f6f20666577000000000000000000000000604482015260640161079a565b600a548160e001511015610f7f5760405162461bcd60e51b815260206004820152601260248201527f726f6c6c75702066656520746f6f206665770000000000000000000000000000604482015260640161079a565b6000610f988260400151836000015184606001516116cb565b905080826020015114610fed5760405162461bcd60e51b815260206004820152601960248201527f636f6d6d69746d656e74206861736820696e636f727265637400000000000000604482015260640161079a565b610ff63361188f565b156110435760405162461bcd60e51b815260206004820152601260248201527f73616e6374696f6e656420616464726573730000000000000000000000000000604482015260640161079a565b60025460e083015160c0840151845161107e936001600160a01b0316929161106a91612cb5565b6110749190612cb5565b8460a00151611928565b6040805160a081018252835181526020808501519082015260c08401519181019190915260e083015160608201526080808401519082015260006110c182611994565b90506110d18460a0015182611a03565b60208401516040517fd106eb38b3368b7c294e36fae5513fdefe880be5abfad529b37b044f2fdd2dbe90600090a250505050565b600b546001600160a01b0316331461115b5760405162461bcd60e51b81526020600482015260256024820152600080516020612d2f8339815191526044820152643a34b7b71760d91b606482015260840161079a565b600480546001600160a01b0319166001600160a01b0392909216919091179055565b600c546040805163313ce56760e01b815290516000926001600160a01b03169163313ce567916004808301926020929190829003018186803b1580156111c257600080fd5b505afa1580156111d6573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906108fb9190612a5a565b600c54604080516306fdde0360e01b815290516060926001600160a01b0316916306fdde03916004808301926000929190829003018186803b1580156108bf57600080fd5b600b546001600160a01b031633146112955760405162461bcd60e51b81526020600482015260256024820152600080516020612d2f8339815191526044820152643a34b7b71760d91b606482015260840161079a565b6002805467ffffffffffffffff909316600160a01b027fffffffff0000000000000000ffffffffffffffffffffffffffffffffffffffff90931692909217909155600380546001600160a01b039092166001600160a01b0319909216919091179055565b600b546001600160a01b0316331461134f5760405162461bcd60e51b81526020600482015260256024820152600080516020612d2f8339815191526044820152643a34b7b71760d91b606482015260840161079a565b600280546001600160a01b0319166001600160a01b0392909216919091179055565b6113a36040518060a0016040528060008152602001600081526020016000815260200160008152602001606081525090565b6113d56040518060a0016040528060008152602001600081526020016000815260200160008152602001606081525090565b60006113e18482611a86565b90835290506113f08482611a86565b602084019190915290506114048482611a86565b604084019190915290506114188482611a86565b6060840191909152905061142c8482611bb7565b5060808301525092915050565b6003546001600160a01b038481169116146114965760405162461bcd60e51b815260206004820152601e60248201527f66726f6d2070726f78792061646472657373206e6f74206d6174636865640000604482015260640161079a565b60025467ffffffffffffffff858116600160a01b90920416146114fb5760405162461bcd60e51b815260206004820152601960248201527f66726f6d20636861696e206964206e6f74206d61746368656400000000000000604482015260640161079a565b80516115495760405162461bcd60e51b815260206004820152601f60248201527f616d6f756e742073686f756c642062652067726561746572207468616e203000604482015260640161079a565b6007548160400151101561159f5760405162461bcd60e51b815260206004820152601460248201527f6578656375746f722066656520746f6f20666577000000000000000000000000604482015260640161079a565b600854816060015110156115f55760405162461bcd60e51b815260206004820152601260248201527f726f6c6c75702066656520746f6f206665770000000000000000000000000000604482015260640161079a565b6002546040516378d60cd760e01b81526001600160a01b03909116906378d60cd7906116279084908690600401612bd5565b602060405180830381600087803b15801561164157600080fd5b505af1158015611655573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061167991906127fe565b6116c55760405162461bcd60e51b815260206004820152601260248201527f63616c6c20656e7175657565206572726f720000000000000000000000000000604482015260640161079a565b50505050565b60007f30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f000000184106117485760405162461bcd60e51b8152602060048201526024808201527f686173684b2073686f756c64206265206c657373207468616e204649454c445f60448201526353495a4560e01b606482015260840161079a565b7f30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f000000183106117dd5760405162461bcd60e51b815260206004820152602660248201527f72616e646f6d532073686f756c64206265206c657373207468616e204649454c60448201527f445f53495a450000000000000000000000000000000000000000000000000000606482015260840161079a565b60015460408051606081018252868152602081018690526fffffffffffffffffffffffffffffffff85168183015290516304b98e1d60e31b81526001600160a01b03909216916325cc70e89161183591600401612b91565b60206040518083038186803b15801561184d57600080fd5b505afa158015611861573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906118859190612969565b90505b9392505050565b60008054600160a01b900460ff166118a957506001919050565b60005460405163df592f7d60e01b81526001600160a01b03848116600483015290911690819063df592f7d9060240160206040518083038186803b1580156118f057600080fd5b505afa158015611904573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061188891906127fe565b8034146119775760405162461bcd60e51b815260206004820152601360248201527f62726964676520666565206d69736d6174636800000000000000000000000000604482015260640161079a565b600c5461198f906001600160a01b0316338585611cc4565b505050565b6060806119a48360000151611d33565b6119b18460200151611d33565b6119be8560400151611d33565b6119cb8660600151611d33565b6119d88760800151611dcb565b6040516020016119ec959493929190612af4565b60408051601f198184030181529190529392505050565b6004805460035460025460405163c81739cd60e01b81526001600160a01b039384169463c81739cd948894611a5094911692600160a01b90910467ffffffffffffffff1691889101612b5f565b6000604051808303818588803b158015611a6957600080fd5b505af1158015611a7d573d6000803e3d6000fd5b50505050505050565b6000808351836020611a989190612cb5565b11158015611aaf5750611aac836020612cb5565b83105b611b075760405162461bcd60e51b815260206004820152602360248201527f4e65787455696e743235352c206f66667365742065786365656473206d6178696044820152626d756d60e81b606482015260840161079a565b600060405160206000600182038760208a0101515b83831015611b3c5780821a83860153600183019250600182039150611b1c565b50505081016040525190506001600160ff1b03811115611b9e5760405162461bcd60e51b815260206004820152601760248201527f56616c75652065786365656473207468652072616e6765000000000000000000604482015260640161079a565b80611baa856020612cb5565b92509250505b9250929050565b6060600080611bc68585611e02565b8651909550909150611bd88286612cb5565b11158015611bee5750611beb8185612cb5565b84105b611c465760405162461bcd60e51b8152602060048201526024808201527f4e65787456617242797465732c206f66667365742065786365656473206d6178604482015263696d756d60e01b606482015260840161079a565b606081158015611c6157604051915060208201604052611cab565b6040519150601f8316801560200281840101848101888315602002848c0101015b81831015611c9a578051835260209283019201611c82565b5050848452601f01601f1916604052505b5080611cb78387612cb5565b9350935050509250929050565b604080516001600160a01b0385811660248301528416604482015260648082018490528251808303909101815260849091019091526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff166323b872dd60e01b1790526116c5908590612008565b60606001600160ff1b03821115611d8c5760405162461bcd60e51b815260206004820152601b60248201527f56616c756520657863656564732075696e743235352072616e67650000000000604482015260640161079a565b60405160208082526000601f5b82821015611dbb5785811a826020860101536001919091019060001901611d99565b5050506040818101905292915050565b8051606090611dd9816120ed565b83604051602001611deb929190612ac5565b604051602081830303815290604052915050919050565b6000806000611e1185856121bc565b94509050600060fd60f81b6001600160f81b031983161415611eaa57611e378686612244565b955061ffff16905060fd8110801590611e52575061ffff8111155b611e9e5760405162461bcd60e51b815260206004820152601f60248201527f4e65787455696e7431362c2076616c7565206f7574736964652072616e676500604482015260640161079a565b9250839150611bb09050565b607f60f91b6001600160f81b031983161415611f3557611eca86866122fd565b955063ffffffff16905061ffff81118015611ee9575063ffffffff8111155b611e9e5760405162461bcd60e51b815260206004820181905260248201527f4e65787456617255696e742c2076616c7565206f7574736964652072616e6765604482015260640161079a565b6001600160f81b03198083161415611fb257611f5186866123cf565b955067ffffffffffffffff16905063ffffffff8111611e9e5760405162461bcd60e51b815260206004820181905260248201527f4e65787456617255696e742c2076616c7565206f7574736964652072616e6765604482015260640161079a565b5060f881901c60fd8110611e9e5760405162461bcd60e51b815260206004820181905260248201527f4e65787456617255696e742c2076616c7565206f7574736964652072616e6765604482015260640161079a565b600061205d826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b03166124a19092919063ffffffff16565b80519091501561198f578080602001905181019061207b91906127fe565b61198f5760405162461bcd60e51b815260206004820152602a60248201527f5361666545524332303a204552433230206f7065726174696f6e20646964206e60448201527f6f74207375636365656400000000000000000000000000000000000000000000606482015260840161079a565b606060fd8267ffffffffffffffff16101561212257604080516001815260f884901b6020820152602181019091525b92915050565b61ffff8267ffffffffffffffff16116121725761214260fd60f81b6124b0565b61214b836124d7565b60405160200161215c929190612ac5565b6040516020818303038152906040529050919050565b63ffffffff8267ffffffffffffffff161161219d57612194607f60f91b6124b0565b61214b8361251a565b6121ae6001600160f81b03196124b0565b61214b8361255d565b919050565b60008083518360016121ce9190612cb5565b111580156121e557506121e2836001612cb5565b83105b6122315760405162461bcd60e51b815260206004820181905260248201527f4e657874427974652c204f66667365742065786365656473206d6178696d756d604482015260640161079a565b8383016020015180611baa856001612cb5565b60008083518360026122569190612cb5565b1115801561226d575061226a836002612cb5565b83105b6122c45760405162461bcd60e51b815260206004820152602260248201527f4e65787455696e7431362c206f66667365742065786365656473206d6178696d604482015261756d60f01b606482015260840161079a565b6000604051846020870101518060011a82538060001a60018301535060028101604052601e81035191505080846002611baa9190612cb5565b600080835183600461230f9190612cb5565b111580156123265750612323836004612cb5565b83105b61237d5760405162461bcd60e51b815260206004820152602260248201527f4e65787455696e7433322c206f66667365742065786365656473206d6178696d604482015261756d60f01b606482015260840161079a565b600060405160046000600182038760208a0101515b838310156123b25780821a83860153600183019250600182039150612392565b505050818101604052602003900351905080611baa856004612cb5565b60008083518360086123e19190612cb5565b111580156123f857506123f5836008612cb5565b83105b61244f5760405162461bcd60e51b815260206004820152602260248201527f4e65787455696e7436342c206f66667365742065786365656473206d6178696d604482015261756d60f01b606482015260840161079a565b600060405160086000600182038760208a0101515b838310156124845780821a83860153600183019250600182039150612464565b505050818101604052602003900351905080611baa856008612cb5565b606061188584846000856125a0565b60408051600181526001600160f81b0319831660208201526021810190915260609061211c565b6040516002808252606091906000601f5b8282101561250a5785811a8260208601015360019190910190600019016124e8565b5050506022810160405292915050565b6040516004808252606091906000601f5b8282101561254d5785811a82602086010153600191909101906000190161252b565b5050506024810160405292915050565b6040516008808252606091906000601f5b828210156125905785811a82602086010153600191909101906000190161256e565b5050506028810160405292915050565b6060824710156126185760405162461bcd60e51b815260206004820152602660248201527f416464726573733a20696e73756666696369656e742062616c616e636520666f60448201527f722063616c6c0000000000000000000000000000000000000000000000000000606482015260840161079a565b6001600160a01b0385163b61266f5760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e7472616374000000604482015260640161079a565b600080866001600160a01b0316858760405161268b9190612aa9565b60006040518083038185875af1925050503d80600081146126c8576040519150601f19603f3d011682016040523d82523d6000602084013e6126cd565b606091505b50915091506126dd8282866126e8565b979650505050505050565b606083156126f7575081611888565b8251156127075782518084602001fd5b8160405162461bcd60e51b815260040161079a9190612bc2565b80356001600160a01b03811681146121b757600080fd5b600082601f83011261274957600080fd5b813561275c61275782612c8d565b612c5c565b81815284602083860101111561277157600080fd5b816020850160208301376000918101602001919091529392505050565b80356fffffffffffffffffffffffffffffffff811681146121b757600080fd5b803567ffffffffffffffff811681146121b757600080fd5b6000602082840312156127d857600080fd5b61188882612721565b6000602082840312156127f357600080fd5b813561188881612d1d565b60006020828403121561281057600080fd5b815161188881612d1d565b60006020828403121561282d57600080fd5b815167ffffffffffffffff81111561284457600080fd5b8201601f8101841361285557600080fd5b805161286361275782612c8d565b81815285602083850101111561287857600080fd5b612889826020830160208601612cdb565b95945050505050565b6000602082840312156128a457600080fd5b813567ffffffffffffffff808211156128bc57600080fd5b9083019061010082860312156128d157600080fd5b6128d9612c32565b8235815260208301356020820152604083013560408201526128fd6060840161278e565b606082015260808301358281111561291457600080fd5b61292087828601612738565b60808301525060a083013560a082015260c083013560c082015260e083013560e082015280935050505092915050565b60006020828403121561296257600080fd5b5035919050565b60006020828403121561297b57600080fd5b5051919050565b6000806040838503121561299557600080fd5b61299e836127ae565b91506129ac60208401612721565b90509250929050565b6000806000806000608086880312156129cd57600080fd5b6129d6866127ae565b94506129e460208701612721565b9350604086013567ffffffffffffffff80821115612a0157600080fd5b818801915088601f830112612a1557600080fd5b813581811115612a2457600080fd5b896020828501011115612a3657600080fd5b602083019550809450505050612a4e60608701612721565b90509295509295909350565b600060208284031215612a6c57600080fd5b815160ff8116811461188857600080fd5b60008151808452612a95816020860160208601612cdb565b601f01601f19169290920160200192915050565b60008251612abb818460208701612cdb565b9190910192915050565b60008351612ad7818460208801612cdb565b835190830190612aeb818360208801612cdb565b01949350505050565b60008651612b06818460208b01612cdb565b865190830190612b1a818360208b01612cdb565b8651910190612b2d818360208a01612cdb565b8551910190612b40818360208901612cdb565b8451910190612b53818360208801612cdb565b01979650505050505050565b6001600160a01b038416815267ffffffffffffffff831660208201526060604082015260006128896060830184612a7d565b60608101818360005b6003811015612bb9578151835260209283019290910190600101612b9a565b50505092915050565b6020815260006118886020830184612a7d565b60408152825160408201526020830151606082015260408301516080820152606083015160a08201526000608084015160a060c0840152612c1960e0840182612a7d565b9150506001600160a01b03831660208301529392505050565b604051610100810167ffffffffffffffff81118282101715612c5657612c56612d07565b60405290565b604051601f8201601f1916810167ffffffffffffffff81118282101715612c8557612c85612d07565b604052919050565b600067ffffffffffffffff821115612ca757612ca7612d07565b50601f01601f191660200190565b60008219821115612cd657634e487b7160e01b600052601160045260246000fd5b500190565b60005b83811015612cf6578181015183820152602001612cde565b838111156116c55750506000910152565b634e487b7160e01b600052604160045260246000fd5b8015158114612d2b57600080fd5b5056fe4f6e6c79206f70657261746f722063616e2063616c6c20746869732066756e63a264697066735822122052667367ba020ca25847037c738b0921a55a1743f91de888f95c5b591239e6c664736f6c63430008070033';

type MystikoV2WithTBridgeERC20ConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: MystikoV2WithTBridgeERC20ConstructorParams,
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class MystikoV2WithTBridgeERC20__factory extends ContractFactory {
  constructor(...args: MystikoV2WithTBridgeERC20ConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = 'MystikoV2WithTBridgeERC20';
  }

  deploy(
    _hasher3: string,
    _token: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<MystikoV2WithTBridgeERC20> {
    return super.deploy(_hasher3, _token, overrides || {}) as Promise<MystikoV2WithTBridgeERC20>;
  }
  getDeployTransaction(
    _hasher3: string,
    _token: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): TransactionRequest {
    return super.getDeployTransaction(_hasher3, _token, overrides || {});
  }
  attach(address: string): MystikoV2WithTBridgeERC20 {
    return super.attach(address) as MystikoV2WithTBridgeERC20;
  }
  connect(signer: Signer): MystikoV2WithTBridgeERC20__factory {
    return super.connect(signer) as MystikoV2WithTBridgeERC20__factory;
  }
  static readonly contractName: 'MystikoV2WithTBridgeERC20';
  public readonly contractName: 'MystikoV2WithTBridgeERC20';
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MystikoV2WithTBridgeERC20Interface {
    return new utils.Interface(_abi) as MystikoV2WithTBridgeERC20Interface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): MystikoV2WithTBridgeERC20 {
    return new Contract(address, _abi, signerOrProvider) as MystikoV2WithTBridgeERC20;
  }
}
