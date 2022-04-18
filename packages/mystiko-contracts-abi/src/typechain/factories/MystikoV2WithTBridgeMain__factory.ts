/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from 'ethers';
import { Provider, TransactionRequest } from '@ethersproject/providers';
import type {
  MystikoV2WithTBridgeMain,
  MystikoV2WithTBridgeMainInterface,
} from '../MystikoV2WithTBridgeMain';

const _abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_hasher3',
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
  '0x6080604052600080546001600160a81b031916740140c57923924b5c5c5455c48d93317139addac8fb1790553480156200003857600080fd5b50604051620028f4380380620028f48339810160408190526200005b916200008f565b600b80546001600160a01b03199081163317909155600180546001600160a01b0390931692909116919091179055620000c1565b600060208284031215620000a257600080fd5b81516001600160a01b0381168114620000ba57600080fd5b9392505050565b61282380620000d16000396000f3fe6080604052600436106101e35760003560e01c80637cbf0ff611610102578063a3bc64f211610095578063d1c1a68011610064578063d1c1a680146105cd578063e19abef8146105ed578063ec18d3e21461060d578063ed6ea33a1461062d57600080fd5b8063a3bc64f214610540578063a564ac1614610560578063c0868f2b14610576578063cdfceeba1461058c57600080fd5b806399383f78116100d157806399383f78146104e15780639a03636c146105015780639b215a26146105145780639b2cb5d81461052a57600080fd5b80637cbf0ff61461045b57806382d21cd81461047b578063897b0637146104ab5780639937e147146104cb57600080fd5b806334c33e831161017a57806353af27d51161014957806353af27d5146103db578063570ca735146103fb5780635e10b2b71461041b5780636afdf0481461043b57600080fd5b806334c33e831461033a5780633fe3347a1461035a578063414a37ba14610387578063521ff057146103bb57600080fd5b806321e32d55116101b657806321e32d55146102735780632421e155146102ab5780632994d0e4146102fa5780632cd26d451461031a57600080fd5b806306394c9b146101e8578063064628651461020a578063153dc4501461023357806319e75d6e14610253575b600080fd5b3480156101f457600080fd5b5061020861020336600461236b565b61064e565b005b34801561021657600080fd5b5061022060095481565b6040519081526020015b60405180910390f35b34801561023f57600080fd5b5061020861024e36600461247e565b6106cb565b34801561025f57600080fd5b5061020861026e36600461247e565b610780565b34801561027f57600080fd5b50600354610293906001600160a01b031681565b6040516001600160a01b03909116815260200161022a565b3480156102b757600080fd5b5060408051808201909152600781527f746272696467650000000000000000000000000000000000000000000000000060208201525b60405161022a91906126ba565b34801561030657600080fd5b50610208610315366004612386565b6107db565b34801561032657600080fd5b50600454610293906001600160a01b031681565b34801561034657600080fd5b5061020861035536600461236b565b61084f565b34801561036657600080fd5b5060408051808201909152600481526336b0b4b760e11b60208201526102ed565b34801561039357600080fd5b506102207f30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f000000181565b3480156103c757600080fd5b506102086103d636600461247e565b6108c7565b3480156103e757600080fd5b50600054610293906001600160a01b031681565b34801561040757600080fd5b50600b54610293906001600160a01b031681565b34801561042757600080fd5b5061020861043636600461247e565b610972565b34801561044757600080fd5b50600154610293906001600160a01b031681565b34801561046757600080fd5b5061020861047636600461247e565b610a1d565b34801561048757600080fd5b5061049b6104963660046124e3565b610ac8565b604051901515815260200161022a565b3480156104b757600080fd5b506102086104c636600461247e565b610b81565b3480156104d757600080fd5b5061022060085481565b3480156104ed57600080fd5b506102086104fc366004612386565b610bdc565b61020861050f3660046123c0565b610c50565b34801561052057600080fd5b50610220600a5481565b34801561053657600080fd5b5061022060055481565b34801561054c57600080fd5b5061020861055b36600461236b565b610f85565b34801561056c57600080fd5b5061022060075481565b34801561058257600080fd5b5061022060065481565b34801561059857600080fd5b506002546105b490600160a01b900467ffffffffffffffff1681565b60405167ffffffffffffffff909116815260200161022a565b3480156105d957600080fd5b506102086105e83660046124b0565b610ffd565b3480156105f957600080fd5b5061020861060836600461236b565b6110b7565b34801561061957600080fd5b50600254610293906001600160a01b031681565b34801561063957600080fd5b50600b5461049b90600160a01b900460ff1681565b600b546001600160a01b031633146106a95760405162461bcd60e51b815260206004820152602560248201526000805160206127ce8339815191526044820152643a34b7b71760d91b60648201526084015b60405180910390fd5b600b80546001600160a01b0319166001600160a01b0392909216919091179055565b600b546001600160a01b031633146107215760405162461bcd60e51b815260206004820152602560248201526000805160206127ce8339815191526044820152643a34b7b71760d91b60648201526084016106a0565b6000811161077b5760405162461bcd60e51b815260206004820152602160248201527f696e76616c69642070656572206d696e696d616c206578656375746f722066656044820152606560f81b60648201526084016106a0565b600955565b600b546001600160a01b031633146107d65760405162461bcd60e51b815260206004820152602560248201526000805160206127ce8339815191526044820152643a34b7b71760d91b60648201526084016106a0565b600655565b600b546001600160a01b031633146108315760405162461bcd60e51b815260206004820152602560248201526000805160206127ce8339815191526044820152643a34b7b71760d91b60648201526084016106a0565b60008054911515600160a01b0260ff60a01b19909216919091179055565b600b546001600160a01b031633146108a55760405162461bcd60e51b815260206004820152602560248201526000805160206127ce8339815191526044820152643a34b7b71760d91b60648201526084016106a0565b600080546001600160a01b0319166001600160a01b0392909216919091179055565b600b546001600160a01b0316331461091d5760405162461bcd60e51b815260206004820152602560248201526000805160206127ce8339815191526044820152643a34b7b71760d91b60648201526084016106a0565b6000811161096d5760405162461bcd60e51b815260206004820152601f60248201527f696e76616c69642070656572206d696e696d616c20726f6c6c7570206665650060448201526064016106a0565b600a55565b600b546001600160a01b031633146109c85760405162461bcd60e51b815260206004820152602560248201526000805160206127ce8339815191526044820152643a34b7b71760d91b60648201526084016106a0565b60008111610a185760405162461bcd60e51b815260206004820152601c60248201527f696e76616c6964206d696e696d616c206578656375746f72206665650000000060448201526064016106a0565b600755565b600b546001600160a01b03163314610a735760405162461bcd60e51b815260206004820152602560248201526000805160206127ce8339815191526044820152643a34b7b71760d91b60648201526084016106a0565b60008111610ac35760405162461bcd60e51b815260206004820152601a60248201527f696e76616c6964206d696e696d616c20726f6c6c75702066656500000000000060448201526064016106a0565b600855565b6004546000906001600160a01b03163314610b255760405162461bcd60e51b815260206004820152601e60248201527f6d73672073656e646572206973206e6f74206272696467652070726f7879000060448201526064016106a0565b6000610b6685858080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525061112f92505050565b9050610b74878785846111f7565b5060019695505050505050565b600b546001600160a01b03163314610bd75760405162461bcd60e51b815260206004820152602560248201526000805160206127ce8339815191526044820152643a34b7b71760d91b60648201526084016106a0565b600555565b600b546001600160a01b03163314610c325760405162461bcd60e51b815260206004820152602560248201526000805160206127ce8339815191526044820152643a34b7b71760d91b60648201526084016106a0565b600b8054911515600160a01b0260ff60a01b19909216919091179055565b600b54600160a01b900460ff1615610caa5760405162461bcd60e51b815260206004820152601560248201527f6465706f73697473206172652064697361626c6564000000000000000000000060448201526064016106a0565b60055481511015610cfd5760405162461bcd60e51b815260206004820152600e60248201527f616d6f756e7420746f6f2066657700000000000000000000000000000000000060448201526064016106a0565b6006548160a001511015610d535760405162461bcd60e51b815260206004820152601260248201527f6272696467652066656520746f6f20666577000000000000000000000000000060448201526064016106a0565b6009548160c001511015610da95760405162461bcd60e51b815260206004820152601460248201527f6578656375746f722066656520746f6f2066657700000000000000000000000060448201526064016106a0565b600a548160e001511015610dff5760405162461bcd60e51b815260206004820152601260248201527f726f6c6c75702066656520746f6f20666577000000000000000000000000000060448201526064016106a0565b6000610e18826040015183600001518460600151611489565b905080826020015114610e6d5760405162461bcd60e51b815260206004820152601960248201527f636f6d6d69746d656e74206861736820696e636f72726563740000000000000060448201526064016106a0565b610e763361164b565b15610ec35760405162461bcd60e51b815260206004820152601260248201527f73616e6374696f6e65642061646472657373000000000000000000000000000060448201526064016106a0565b60025460e083015160c08401518451610efe936001600160a01b03169291610eea91612754565b610ef49190612754565b8460a001516116eb565b6040805160a081018252835181526020808501519082015260c08401519181019190915260e08301516060820152608080840151908201526000610f41826117e6565b9050610f518460a0015182611855565b60208401516040517fd106eb38b3368b7c294e36fae5513fdefe880be5abfad529b37b044f2fdd2dbe90600090a250505050565b600b546001600160a01b03163314610fdb5760405162461bcd60e51b815260206004820152602560248201526000805160206127ce8339815191526044820152643a34b7b71760d91b60648201526084016106a0565b600480546001600160a01b0319166001600160a01b0392909216919091179055565b600b546001600160a01b031633146110535760405162461bcd60e51b815260206004820152602560248201526000805160206127ce8339815191526044820152643a34b7b71760d91b60648201526084016106a0565b6002805467ffffffffffffffff909316600160a01b027fffffffff0000000000000000ffffffffffffffffffffffffffffffffffffffff90931692909217909155600380546001600160a01b039092166001600160a01b0319909216919091179055565b600b546001600160a01b0316331461110d5760405162461bcd60e51b815260206004820152602560248201526000805160206127ce8339815191526044820152643a34b7b71760d91b60648201526084016106a0565b600280546001600160a01b0319166001600160a01b0392909216919091179055565b6111616040518060a0016040528060008152602001600081526020016000815260200160008152602001606081525090565b6111936040518060a0016040528060008152602001600081526020016000815260200160008152602001606081525090565b600061119f84826118d8565b90835290506111ae84826118d8565b602084019190915290506111c284826118d8565b604084019190915290506111d684826118d8565b606084019190915290506111ea8482611a09565b5060808301525092915050565b6003546001600160a01b038481169116146112545760405162461bcd60e51b815260206004820152601e60248201527f66726f6d2070726f78792061646472657373206e6f74206d617463686564000060448201526064016106a0565b60025467ffffffffffffffff858116600160a01b90920416146112b95760405162461bcd60e51b815260206004820152601960248201527f66726f6d20636861696e206964206e6f74206d6174636865640000000000000060448201526064016106a0565b80516113075760405162461bcd60e51b815260206004820152601f60248201527f616d6f756e742073686f756c642062652067726561746572207468616e20300060448201526064016106a0565b6007548160400151101561135d5760405162461bcd60e51b815260206004820152601460248201527f6578656375746f722066656520746f6f2066657700000000000000000000000060448201526064016106a0565b600854816060015110156113b35760405162461bcd60e51b815260206004820152601260248201527f726f6c6c75702066656520746f6f20666577000000000000000000000000000060448201526064016106a0565b6002546040516378d60cd760e01b81526001600160a01b03909116906378d60cd7906113e590849086906004016126cd565b602060405180830381600087803b1580156113ff57600080fd5b505af1158015611413573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061143791906123a3565b6114835760405162461bcd60e51b815260206004820152601260248201527f63616c6c20656e7175657565206572726f72000000000000000000000000000060448201526064016106a0565b50505050565b60007f30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f000000184106115065760405162461bcd60e51b8152602060048201526024808201527f686173684b2073686f756c64206265206c657373207468616e204649454c445f60448201526353495a4560e01b60648201526084016106a0565b7f30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001831061159b5760405162461bcd60e51b815260206004820152602660248201527f72616e646f6d532073686f756c64206265206c657373207468616e204649454c60448201527f445f53495a45000000000000000000000000000000000000000000000000000060648201526084016106a0565b60015460408051606081018252868152602081018690526fffffffffffffffffffffffffffffffff85168183015290516304b98e1d60e31b81526001600160a01b03909216916325cc70e8916115f391600401612689565b60206040518083038186803b15801561160b57600080fd5b505afa15801561161f573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906116439190612497565b949350505050565b60008054600160a01b900460ff1661166557506001919050565b60005460405163df592f7d60e01b81526001600160a01b03848116600483015290911690819063df592f7d9060240160206040518083038186803b1580156116ac57600080fd5b505afa1580156116c0573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906116e491906123a3565b9392505050565b6116f58183612754565b34146117435760405162461bcd60e51b815260206004820152601260248201527f696e73756666696369656e7420746f6b656e000000000000000000000000000060448201526064016106a0565b6000836001600160a01b03168360405160006040518083038185875af1925050503d8060008114611790576040519150601f19603f3d011682016040523d82523d6000602084013e611795565b606091505b50509050806114835760405162461bcd60e51b815260206004820152601660248201527f616d6f756e74207472616e73666572206661696c65640000000000000000000060448201526064016106a0565b6060806117f68360000151611b16565b6118038460200151611b16565b6118108560400151611b16565b61181d8660600151611b16565b61182a8760800151611bae565b60405160200161183e9594939291906125e3565b60408051601f198184030181529190529392505050565b6004805460035460025460405163c81739cd60e01b81526001600160a01b039384169463c81739cd9488946118a294911692600160a01b90910467ffffffffffffffff169188910161264e565b6000604051808303818588803b1580156118bb57600080fd5b505af11580156118cf573d6000803e3d6000fd5b50505050505050565b60008083518360206118ea9190612754565b1115801561190157506118fe836020612754565b83105b6119595760405162461bcd60e51b815260206004820152602360248201527f4e65787455696e743235352c206f66667365742065786365656473206d6178696044820152626d756d60e81b60648201526084016106a0565b600060405160206000600182038760208a0101515b8383101561198e5780821a8386015360018301925060018203915061196e565b50505081016040525190506001600160ff1b038111156119f05760405162461bcd60e51b815260206004820152601760248201527f56616c75652065786365656473207468652072616e676500000000000000000060448201526064016106a0565b806119fc856020612754565b92509250505b9250929050565b6060600080611a188585611be5565b8651909550909150611a2a8286612754565b11158015611a405750611a3d8185612754565b84105b611a985760405162461bcd60e51b8152602060048201526024808201527f4e65787456617242797465732c206f66667365742065786365656473206d6178604482015263696d756d60e01b60648201526084016106a0565b606081158015611ab357604051915060208201604052611afd565b6040519150601f8316801560200281840101848101888315602002848c0101015b81831015611aec578051835260209283019201611ad4565b5050848452601f01601f1916604052505b5080611b098387612754565b9350935050509250929050565b60606001600160ff1b03821115611b6f5760405162461bcd60e51b815260206004820152601b60248201527f56616c756520657863656564732075696e743235352072616e6765000000000060448201526064016106a0565b60405160208082526000601f5b82821015611b9e5785811a826020860101536001919091019060001901611b7c565b5050506040818101905292915050565b8051606090611bbc81611deb565b83604051602001611bce9291906125b4565b604051602081830303815290604052915050919050565b6000806000611bf48585611eba565b94509050600060fd60f81b6001600160f81b031983161415611c8d57611c1a8686611f42565b955061ffff16905060fd8110801590611c35575061ffff8111155b611c815760405162461bcd60e51b815260206004820152601f60248201527f4e65787455696e7431362c2076616c7565206f7574736964652072616e67650060448201526064016106a0565b9250839150611a029050565b607f60f91b6001600160f81b031983161415611d1857611cad8686611ffb565b955063ffffffff16905061ffff81118015611ccc575063ffffffff8111155b611c815760405162461bcd60e51b815260206004820181905260248201527f4e65787456617255696e742c2076616c7565206f7574736964652072616e676560448201526064016106a0565b6001600160f81b03198083161415611d9557611d3486866120cd565b955067ffffffffffffffff16905063ffffffff8111611c815760405162461bcd60e51b815260206004820181905260248201527f4e65787456617255696e742c2076616c7565206f7574736964652072616e676560448201526064016106a0565b5060f881901c60fd8110611c815760405162461bcd60e51b815260206004820181905260248201527f4e65787456617255696e742c2076616c7565206f7574736964652072616e676560448201526064016106a0565b606060fd8267ffffffffffffffff161015611e2057604080516001815260f884901b6020820152602181019091525b92915050565b61ffff8267ffffffffffffffff1611611e7057611e4060fd60f81b61219f565b611e49836121c6565b604051602001611e5a9291906125b4565b6040516020818303038152906040529050919050565b63ffffffff8267ffffffffffffffff1611611e9b57611e92607f60f91b61219f565b611e4983612209565b611eac6001600160f81b031961219f565b611e498361224c565b919050565b6000808351836001611ecc9190612754565b11158015611ee35750611ee0836001612754565b83105b611f2f5760405162461bcd60e51b815260206004820181905260248201527f4e657874427974652c204f66667365742065786365656473206d6178696d756d60448201526064016106a0565b83830160200151806119fc856001612754565b6000808351836002611f549190612754565b11158015611f6b5750611f68836002612754565b83105b611fc25760405162461bcd60e51b815260206004820152602260248201527f4e65787455696e7431362c206f66667365742065786365656473206d6178696d604482015261756d60f01b60648201526084016106a0565b6000604051846020870101518060011a82538060001a60018301535060028101604052601e810351915050808460026119fc9190612754565b600080835183600461200d9190612754565b111580156120245750612021836004612754565b83105b61207b5760405162461bcd60e51b815260206004820152602260248201527f4e65787455696e7433322c206f66667365742065786365656473206d6178696d604482015261756d60f01b60648201526084016106a0565b600060405160046000600182038760208a0101515b838310156120b05780821a83860153600183019250600182039150612090565b5050508181016040526020039003519050806119fc856004612754565b60008083518360086120df9190612754565b111580156120f657506120f3836008612754565b83105b61214d5760405162461bcd60e51b815260206004820152602260248201527f4e65787455696e7436342c206f66667365742065786365656473206d6178696d604482015261756d60f01b60648201526084016106a0565b600060405160086000600182038760208a0101515b838310156121825780821a83860153600183019250600182039150612162565b5050508181016040526020039003519050806119fc856008612754565b60408051600181526001600160f81b03198316602082015260218101909152606090611e1a565b6040516002808252606091906000601f5b828210156121f95785811a8260208601015360019190910190600019016121d7565b5050506022810160405292915050565b6040516004808252606091906000601f5b8282101561223c5785811a82602086010153600191909101906000190161221a565b5050506024810160405292915050565b6040516008808252606091906000601f5b8282101561227f5785811a82602086010153600191909101906000190161225d565b5050506028810160405292915050565b80356001600160a01b0381168114611eb557600080fd5b600082601f8301126122b757600080fd5b813567ffffffffffffffff808211156122d2576122d26127a6565b604051601f8301601f19908116603f011681019082821181831017156122fa576122fa6127a6565b8160405283815286602085880101111561231357600080fd5b836020870160208301376000602085830101528094505050505092915050565b80356fffffffffffffffffffffffffffffffff81168114611eb557600080fd5b803567ffffffffffffffff81168114611eb557600080fd5b60006020828403121561237d57600080fd5b6116e48261228f565b60006020828403121561239857600080fd5b81356116e4816127bc565b6000602082840312156123b557600080fd5b81516116e4816127bc565b6000602082840312156123d257600080fd5b813567ffffffffffffffff808211156123ea57600080fd5b9083019061010082860312156123ff57600080fd5b61240761272a565b82358152602083013560208201526040830135604082015261242b60608401612333565b606082015260808301358281111561244257600080fd5b61244e878286016122a6565b60808301525060a083013560a082015260c083013560c082015260e083013560e082015280935050505092915050565b60006020828403121561249057600080fd5b5035919050565b6000602082840312156124a957600080fd5b5051919050565b600080604083850312156124c357600080fd5b6124cc83612353565b91506124da6020840161228f565b90509250929050565b6000806000806000608086880312156124fb57600080fd5b61250486612353565b94506125126020870161228f565b9350604086013567ffffffffffffffff8082111561252f57600080fd5b818801915088601f83011261254357600080fd5b81358181111561255257600080fd5b89602082850101111561256457600080fd5b60208301955080945050505061257c6060870161228f565b90509295509295909350565b600081518084526125a081602086016020860161277a565b601f01601f19169290920160200192915050565b600083516125c681846020880161277a565b8351908301906125da81836020880161277a565b01949350505050565b600086516125f5818460208b0161277a565b865190830190612609818360208b0161277a565b865191019061261c818360208a0161277a565b855191019061262f81836020890161277a565b845191019061264281836020880161277a565b01979650505050505050565b6001600160a01b038416815267ffffffffffffffff831660208201526060604082015260006126806060830184612588565b95945050505050565b60608101818360005b60038110156126b1578151835260209283019290910190600101612692565b50505092915050565b6020815260006116e46020830184612588565b60408152825160408201526020830151606082015260408301516080820152606083015160a08201526000608084015160a060c084015261271160e0840182612588565b9150506001600160a01b03831660208301529392505050565b604051610100810167ffffffffffffffff8111828210171561274e5761274e6127a6565b60405290565b6000821982111561277557634e487b7160e01b600052601160045260246000fd5b500190565b60005b8381101561279557818101518382015260200161277d565b838111156114835750506000910152565b634e487b7160e01b600052604160045260246000fd5b80151581146127ca57600080fd5b5056fe4f6e6c79206f70657261746f722063616e2063616c6c20746869732066756e63a26469706673582212207d72b26b8d891d6a571f11076d297fb2eb5694b1f52a868720b708244e06e06764736f6c63430008070033';

type MystikoV2WithTBridgeMainConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: MystikoV2WithTBridgeMainConstructorParams,
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class MystikoV2WithTBridgeMain__factory extends ContractFactory {
  constructor(...args: MystikoV2WithTBridgeMainConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = 'MystikoV2WithTBridgeMain';
  }

  deploy(
    _hasher3: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<MystikoV2WithTBridgeMain> {
    return super.deploy(_hasher3, overrides || {}) as Promise<MystikoV2WithTBridgeMain>;
  }
  getDeployTransaction(
    _hasher3: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): TransactionRequest {
    return super.getDeployTransaction(_hasher3, overrides || {});
  }
  attach(address: string): MystikoV2WithTBridgeMain {
    return super.attach(address) as MystikoV2WithTBridgeMain;
  }
  connect(signer: Signer): MystikoV2WithTBridgeMain__factory {
    return super.connect(signer) as MystikoV2WithTBridgeMain__factory;
  }
  static readonly contractName: 'MystikoV2WithTBridgeMain';
  public readonly contractName: 'MystikoV2WithTBridgeMain';
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MystikoV2WithTBridgeMainInterface {
    return new utils.Interface(_abi) as MystikoV2WithTBridgeMainInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): MystikoV2WithTBridgeMain {
    return new Contract(address, _abi, signerOrProvider) as MystikoV2WithTBridgeMain;
  }
}
