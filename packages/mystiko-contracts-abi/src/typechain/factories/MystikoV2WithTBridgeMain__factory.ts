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
    name: 'toggleSanctionCheck',
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
  '0x6080604052600080546001600160a81b0319167340c57923924b5c5c5455c48d93317139addac8fb1790553480156200003757600080fd5b50604051620027a7380380620027a78339810160408190526200005a916200008e565b600a80546001600160a01b03199081163317909155600180546001600160a01b0390931692909116919091179055620000c0565b600060208284031215620000a157600080fd5b81516001600160a01b0381168114620000b957600080fd5b9392505050565b6126d780620000d06000396000f3fe6080604052600436106101cd5760003560e01c806382d21cd8116100f7578063a564ac1611610095578063d1c1a68011610064578063d1c1a68014610581578063e19abef8146105a1578063ec18d3e2146105c1578063ed6ea33a146105e157600080fd5b8063a564ac16146104f4578063b4318ead1461050a578063c0868f2b1461052a578063cdfceeba1461054057600080fd5b80639a03636c116100d15780639a03636c146104955780639b215a26146104a85780639b2cb5d8146104be578063a3bc64f2146104d457600080fd5b806382d21cd814610425578063897b06371461045557806399383f781461047557600080fd5b806334c33e831161016f57806353af27d51161013e57806353af27d5146103a5578063570ca735146103c55780635e10b2b7146103e55780636afdf0481461040557600080fd5b806334c33e83146103045780633fe3347a14610324578063414a37ba14610351578063521ff0571461038557600080fd5b806319e75d6e116101ab57806319e75d6e1461023d57806321e32d551461025d5780632421e155146102955780632cd26d45146102e457600080fd5b806306394c9b146101d257806306462865146101f4578063153dc4501461021d575b600080fd5b3480156101de57600080fd5b506101f26101ed36600461221f565b610602565b005b34801561020057600080fd5b5061020a60085481565b6040519081526020015b60405180910390f35b34801561022957600080fd5b506101f2610238366004612332565b61067f565b34801561024957600080fd5b506101f2610258366004612332565b610734565b34801561026957600080fd5b5060035461027d906001600160a01b031681565b6040516001600160a01b039091168152602001610214565b3480156102a157600080fd5b5060408051808201909152600781527f746272696467650000000000000000000000000000000000000000000000000060208201525b604051610214919061256e565b3480156102f057600080fd5b5060045461027d906001600160a01b031681565b34801561031057600080fd5b506101f261031f36600461221f565b61078f565b34801561033057600080fd5b5060408051808201909152600481526336b0b4b760e11b60208201526102d7565b34801561035d57600080fd5b5061020a7f30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f000000181565b34801561039157600080fd5b506101f26103a0366004612332565b610807565b3480156103b157600080fd5b5060005461027d906001600160a01b031681565b3480156103d157600080fd5b50600a5461027d906001600160a01b031681565b3480156103f157600080fd5b506101f2610400366004612332565b6108b2565b34801561041157600080fd5b5060015461027d906001600160a01b031681565b34801561043157600080fd5b50610445610440366004612397565b61095d565b6040519015158152602001610214565b34801561046157600080fd5b506101f2610470366004612332565b610a16565b34801561048157600080fd5b506101f261049036600461223a565b610a71565b6101f26104a3366004612274565b610ae5565b3480156104b457600080fd5b5061020a60095481565b3480156104ca57600080fd5b5061020a60055481565b3480156104e057600080fd5b506101f26104ef36600461221f565b610e1a565b34801561050057600080fd5b5061020a60075481565b34801561051657600080fd5b506101f261052536600461223a565b610e92565b34801561053657600080fd5b5061020a60065481565b34801561054c57600080fd5b5060025461056890600160a01b900467ffffffffffffffff1681565b60405167ffffffffffffffff9091168152602001610214565b34801561058d57600080fd5b506101f261059c366004612364565b610f06565b3480156105ad57600080fd5b506101f26105bc36600461221f565b610fc0565b3480156105cd57600080fd5b5060025461027d906001600160a01b031681565b3480156105ed57600080fd5b50600a5461044590600160a01b900460ff1681565b600a546001600160a01b0316331461065d5760405162461bcd60e51b815260206004820152602560248201526000805160206126828339815191526044820152643a34b7b71760d91b60648201526084015b60405180910390fd5b600a80546001600160a01b0319166001600160a01b0392909216919091179055565b600a546001600160a01b031633146106d55760405162461bcd60e51b815260206004820152602560248201526000805160206126828339815191526044820152643a34b7b71760d91b6064820152608401610654565b6000811161072f5760405162461bcd60e51b815260206004820152602160248201527f696e76616c69642070656572206d696e696d616c206578656375746f722066656044820152606560f81b6064820152608401610654565b600855565b600a546001600160a01b0316331461078a5760405162461bcd60e51b815260206004820152602560248201526000805160206126828339815191526044820152643a34b7b71760d91b6064820152608401610654565b600655565b600a546001600160a01b031633146107e55760405162461bcd60e51b815260206004820152602560248201526000805160206126828339815191526044820152643a34b7b71760d91b6064820152608401610654565b600080546001600160a01b0319166001600160a01b0392909216919091179055565b600a546001600160a01b0316331461085d5760405162461bcd60e51b815260206004820152602560248201526000805160206126828339815191526044820152643a34b7b71760d91b6064820152608401610654565b600081116108ad5760405162461bcd60e51b815260206004820152601f60248201527f696e76616c69642070656572206d696e696d616c20726f6c6c757020666565006044820152606401610654565b600955565b600a546001600160a01b031633146109085760405162461bcd60e51b815260206004820152602560248201526000805160206126828339815191526044820152643a34b7b71760d91b6064820152608401610654565b600081116109585760405162461bcd60e51b815260206004820152601c60248201527f696e76616c6964206d696e696d616c206578656375746f7220666565000000006044820152606401610654565b600755565b6004546000906001600160a01b031633146109ba5760405162461bcd60e51b815260206004820152601e60248201527f6d73672073656e646572206973206e6f74206272696467652070726f787900006044820152606401610654565b60006109fb85858080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525061103892505050565b9050610a0987878584611100565b5060019695505050505050565b600a546001600160a01b03163314610a6c5760405162461bcd60e51b815260206004820152602560248201526000805160206126828339815191526044820152643a34b7b71760d91b6064820152608401610654565b600555565b600a546001600160a01b03163314610ac75760405162461bcd60e51b815260206004820152602560248201526000805160206126828339815191526044820152643a34b7b71760d91b6064820152608401610654565b600a8054911515600160a01b0260ff60a01b19909216919091179055565b600a54600160a01b900460ff1615610b3f5760405162461bcd60e51b815260206004820152601560248201527f6465706f73697473206172652064697361626c656400000000000000000000006044820152606401610654565b60055481511015610b925760405162461bcd60e51b815260206004820152600e60248201527f616d6f756e7420746f6f206665770000000000000000000000000000000000006044820152606401610654565b6006548160a001511015610be85760405162461bcd60e51b815260206004820152601260248201527f6272696467652066656520746f6f2066657700000000000000000000000000006044820152606401610654565b6008548160c001511015610c3e5760405162461bcd60e51b815260206004820152601460248201527f6578656375746f722066656520746f6f206665770000000000000000000000006044820152606401610654565b6009548160e001511015610c945760405162461bcd60e51b815260206004820152601260248201527f726f6c6c75702066656520746f6f2066657700000000000000000000000000006044820152606401610654565b6000610cad82604001518360000151846060015161133c565b905080826020015114610d025760405162461bcd60e51b815260206004820152601960248201527f636f6d6d69746d656e74206861736820696e636f7272656374000000000000006044820152606401610654565b610d0b336114fe565b15610d585760405162461bcd60e51b815260206004820152601260248201527f73616e6374696f6e6564206164647265737300000000000000000000000000006044820152606401610654565b60025460e083015160c08401518451610d93936001600160a01b03169291610d7f91612608565b610d899190612608565b8460a0015161159f565b6040805160a081018252835181526020808501519082015260c08401519181019190915260e08301516060820152608080840151908201526000610dd68261169a565b9050610de68460a0015182611709565b60208401516040517fd106eb38b3368b7c294e36fae5513fdefe880be5abfad529b37b044f2fdd2dbe90600090a250505050565b600a546001600160a01b03163314610e705760405162461bcd60e51b815260206004820152602560248201526000805160206126828339815191526044820152643a34b7b71760d91b6064820152608401610654565b600480546001600160a01b0319166001600160a01b0392909216919091179055565b600a546001600160a01b03163314610ee85760405162461bcd60e51b815260206004820152602560248201526000805160206126828339815191526044820152643a34b7b71760d91b6064820152608401610654565b60008054911515600160a01b0260ff60a01b19909216919091179055565b600a546001600160a01b03163314610f5c5760405162461bcd60e51b815260206004820152602560248201526000805160206126828339815191526044820152643a34b7b71760d91b6064820152608401610654565b6002805467ffffffffffffffff909316600160a01b027fffffffff0000000000000000ffffffffffffffffffffffffffffffffffffffff90931692909217909155600380546001600160a01b039092166001600160a01b0319909216919091179055565b600a546001600160a01b031633146110165760405162461bcd60e51b815260206004820152602560248201526000805160206126828339815191526044820152643a34b7b71760d91b6064820152608401610654565b600280546001600160a01b0319166001600160a01b0392909216919091179055565b61106a6040518060a0016040528060008152602001600081526020016000815260200160008152602001606081525090565b61109c6040518060a0016040528060008152602001600081526020016000815260200160008152602001606081525090565b60006110a8848261178c565b90835290506110b7848261178c565b602084019190915290506110cb848261178c565b604084019190915290506110df848261178c565b606084019190915290506110f384826118bd565b5060808301525092915050565b6003546001600160a01b0384811691161461115d5760405162461bcd60e51b815260206004820152601e60248201527f66726f6d2070726f78792061646472657373206e6f74206d61746368656400006044820152606401610654565b60025467ffffffffffffffff858116600160a01b90920416146111c25760405162461bcd60e51b815260206004820152601960248201527f66726f6d20636861696e206964206e6f74206d617463686564000000000000006044820152606401610654565b80516112105760405162461bcd60e51b815260206004820152601f60248201527f616d6f756e742073686f756c642062652067726561746572207468616e2030006044820152606401610654565b600754816040015110156112665760405162461bcd60e51b815260206004820152601460248201527f6578656375746f722066656520746f6f206665770000000000000000000000006044820152606401610654565b6002546040516378d60cd760e01b81526001600160a01b03909116906378d60cd7906112989084908690600401612581565b602060405180830381600087803b1580156112b257600080fd5b505af11580156112c6573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906112ea9190612257565b6113365760405162461bcd60e51b815260206004820152601260248201527f63616c6c20656e7175657565206572726f7200000000000000000000000000006044820152606401610654565b50505050565b60007f30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f000000184106113b95760405162461bcd60e51b8152602060048201526024808201527f686173684b2073686f756c64206265206c657373207468616e204649454c445f60448201526353495a4560e01b6064820152608401610654565b7f30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001831061144e5760405162461bcd60e51b815260206004820152602660248201527f72616e646f6d532073686f756c64206265206c657373207468616e204649454c60448201527f445f53495a4500000000000000000000000000000000000000000000000000006064820152608401610654565b60015460408051606081018252868152602081018690526fffffffffffffffffffffffffffffffff85168183015290516304b98e1d60e31b81526001600160a01b03909216916325cc70e8916114a69160040161253d565b60206040518083038186803b1580156114be57600080fd5b505afa1580156114d2573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906114f6919061234b565b949350505050565b60008054600160a01b900460ff161561151957506000919050565b60005460405163df592f7d60e01b81526001600160a01b03848116600483015290911690819063df592f7d9060240160206040518083038186803b15801561156057600080fd5b505afa158015611574573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906115989190612257565b9392505050565b6115a98183612608565b34146115f75760405162461bcd60e51b815260206004820152601260248201527f696e73756666696369656e7420746f6b656e00000000000000000000000000006044820152606401610654565b6000836001600160a01b03168360405160006040518083038185875af1925050503d8060008114611644576040519150601f19603f3d011682016040523d82523d6000602084013e611649565b606091505b50509050806113365760405162461bcd60e51b815260206004820152601660248201527f616d6f756e74207472616e73666572206661696c6564000000000000000000006044820152606401610654565b6060806116aa83600001516119ca565b6116b784602001516119ca565b6116c485604001516119ca565b6116d186606001516119ca565b6116de8760800151611a62565b6040516020016116f2959493929190612497565b60408051601f198184030181529190529392505050565b6004805460035460025460405163c81739cd60e01b81526001600160a01b039384169463c81739cd94889461175694911692600160a01b90910467ffffffffffffffff1691889101612502565b6000604051808303818588803b15801561176f57600080fd5b505af1158015611783573d6000803e3d6000fd5b50505050505050565b600080835183602061179e9190612608565b111580156117b557506117b2836020612608565b83105b61180d5760405162461bcd60e51b815260206004820152602360248201527f4e65787455696e743235352c206f66667365742065786365656473206d6178696044820152626d756d60e81b6064820152608401610654565b600060405160206000600182038760208a0101515b838310156118425780821a83860153600183019250600182039150611822565b50505081016040525190506001600160ff1b038111156118a45760405162461bcd60e51b815260206004820152601760248201527f56616c75652065786365656473207468652072616e67650000000000000000006044820152606401610654565b806118b0856020612608565b92509250505b9250929050565b60606000806118cc8585611a99565b86519095509091506118de8286612608565b111580156118f457506118f18185612608565b84105b61194c5760405162461bcd60e51b8152602060048201526024808201527f4e65787456617242797465732c206f66667365742065786365656473206d6178604482015263696d756d60e01b6064820152608401610654565b606081158015611967576040519150602082016040526119b1565b6040519150601f8316801560200281840101848101888315602002848c0101015b818310156119a0578051835260209283019201611988565b5050848452601f01601f1916604052505b50806119bd8387612608565b9350935050509250929050565b60606001600160ff1b03821115611a235760405162461bcd60e51b815260206004820152601b60248201527f56616c756520657863656564732075696e743235352072616e676500000000006044820152606401610654565b60405160208082526000601f5b82821015611a525785811a826020860101536001919091019060001901611a30565b5050506040818101905292915050565b8051606090611a7081611c9f565b83604051602001611a82929190612468565b604051602081830303815290604052915050919050565b6000806000611aa88585611d6e565b94509050600060fd60f81b6001600160f81b031983161415611b4157611ace8686611df6565b955061ffff16905060fd8110801590611ae9575061ffff8111155b611b355760405162461bcd60e51b815260206004820152601f60248201527f4e65787455696e7431362c2076616c7565206f7574736964652072616e6765006044820152606401610654565b92508391506118b69050565b607f60f91b6001600160f81b031983161415611bcc57611b618686611eaf565b955063ffffffff16905061ffff81118015611b80575063ffffffff8111155b611b355760405162461bcd60e51b815260206004820181905260248201527f4e65787456617255696e742c2076616c7565206f7574736964652072616e67656044820152606401610654565b6001600160f81b03198083161415611c4957611be88686611f81565b955067ffffffffffffffff16905063ffffffff8111611b355760405162461bcd60e51b815260206004820181905260248201527f4e65787456617255696e742c2076616c7565206f7574736964652072616e67656044820152606401610654565b5060f881901c60fd8110611b355760405162461bcd60e51b815260206004820181905260248201527f4e65787456617255696e742c2076616c7565206f7574736964652072616e67656044820152606401610654565b606060fd8267ffffffffffffffff161015611cd457604080516001815260f884901b6020820152602181019091525b92915050565b61ffff8267ffffffffffffffff1611611d2457611cf460fd60f81b612053565b611cfd8361207a565b604051602001611d0e929190612468565b6040516020818303038152906040529050919050565b63ffffffff8267ffffffffffffffff1611611d4f57611d46607f60f91b612053565b611cfd836120bd565b611d606001600160f81b0319612053565b611cfd83612100565b919050565b6000808351836001611d809190612608565b11158015611d975750611d94836001612608565b83105b611de35760405162461bcd60e51b815260206004820181905260248201527f4e657874427974652c204f66667365742065786365656473206d6178696d756d6044820152606401610654565b83830160200151806118b0856001612608565b6000808351836002611e089190612608565b11158015611e1f5750611e1c836002612608565b83105b611e765760405162461bcd60e51b815260206004820152602260248201527f4e65787455696e7431362c206f66667365742065786365656473206d6178696d604482015261756d60f01b6064820152608401610654565b6000604051846020870101518060011a82538060001a60018301535060028101604052601e810351915050808460026118b09190612608565b6000808351836004611ec19190612608565b11158015611ed85750611ed5836004612608565b83105b611f2f5760405162461bcd60e51b815260206004820152602260248201527f4e65787455696e7433322c206f66667365742065786365656473206d6178696d604482015261756d60f01b6064820152608401610654565b600060405160046000600182038760208a0101515b83831015611f645780821a83860153600183019250600182039150611f44565b5050508181016040526020039003519050806118b0856004612608565b6000808351836008611f939190612608565b11158015611faa5750611fa7836008612608565b83105b6120015760405162461bcd60e51b815260206004820152602260248201527f4e65787455696e7436342c206f66667365742065786365656473206d6178696d604482015261756d60f01b6064820152608401610654565b600060405160086000600182038760208a0101515b838310156120365780821a83860153600183019250600182039150612016565b5050508181016040526020039003519050806118b0856008612608565b60408051600181526001600160f81b03198316602082015260218101909152606090611cce565b6040516002808252606091906000601f5b828210156120ad5785811a82602086010153600191909101906000190161208b565b5050506022810160405292915050565b6040516004808252606091906000601f5b828210156120f05785811a8260208601015360019190910190600019016120ce565b5050506024810160405292915050565b6040516008808252606091906000601f5b828210156121335785811a826020860101536001919091019060001901612111565b5050506028810160405292915050565b80356001600160a01b0381168114611d6957600080fd5b600082601f83011261216b57600080fd5b813567ffffffffffffffff808211156121865761218661265a565b604051601f8301601f19908116603f011681019082821181831017156121ae576121ae61265a565b816040528381528660208588010111156121c757600080fd5b836020870160208301376000602085830101528094505050505092915050565b80356fffffffffffffffffffffffffffffffff81168114611d6957600080fd5b803567ffffffffffffffff81168114611d6957600080fd5b60006020828403121561223157600080fd5b61159882612143565b60006020828403121561224c57600080fd5b813561159881612670565b60006020828403121561226957600080fd5b815161159881612670565b60006020828403121561228657600080fd5b813567ffffffffffffffff8082111561229e57600080fd5b9083019061010082860312156122b357600080fd5b6122bb6125de565b8235815260208301356020820152604083013560408201526122df606084016121e7565b60608201526080830135828111156122f657600080fd5b6123028782860161215a565b60808301525060a083013560a082015260c083013560c082015260e083013560e082015280935050505092915050565b60006020828403121561234457600080fd5b5035919050565b60006020828403121561235d57600080fd5b5051919050565b6000806040838503121561237757600080fd5b61238083612207565b915061238e60208401612143565b90509250929050565b6000806000806000608086880312156123af57600080fd5b6123b886612207565b94506123c660208701612143565b9350604086013567ffffffffffffffff808211156123e357600080fd5b818801915088601f8301126123f757600080fd5b81358181111561240657600080fd5b89602082850101111561241857600080fd5b60208301955080945050505061243060608701612143565b90509295509295909350565b6000815180845261245481602086016020860161262e565b601f01601f19169290920160200192915050565b6000835161247a81846020880161262e565b83519083019061248e81836020880161262e565b01949350505050565b600086516124a9818460208b0161262e565b8651908301906124bd818360208b0161262e565b86519101906124d0818360208a0161262e565b85519101906124e381836020890161262e565b84519101906124f681836020880161262e565b01979650505050505050565b6001600160a01b038416815267ffffffffffffffff83166020820152606060408201526000612534606083018461243c565b95945050505050565b60608101818360005b6003811015612565578151835260209283019290910190600101612546565b50505092915050565b602081526000611598602083018461243c565b60408152825160408201526020830151606082015260408301516080820152606083015160a08201526000608084015160a060c08401526125c560e084018261243c565b9150506001600160a01b03831660208301529392505050565b604051610100810167ffffffffffffffff811182821017156126025761260261265a565b60405290565b6000821982111561262957634e487b7160e01b600052601160045260246000fd5b500190565b60005b83811015612649578181015183820152602001612631565b838111156113365750506000910152565b634e487b7160e01b600052604160045260246000fd5b801515811461267e57600080fd5b5056fe4f6e6c79206f70657261746f722063616e2063616c6c20746869732066756e63a2646970667358221220b45d3620de270b0096d9bdffcee63f992e282738686012b9a3dd2c31575c203964736f6c63430008070033';

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
