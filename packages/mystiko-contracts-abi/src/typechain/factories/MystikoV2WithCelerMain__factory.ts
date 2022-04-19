/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from 'ethers';
import { Provider, TransactionRequest } from '@ethersproject/providers';
import type { MystikoV2WithCelerMain, MystikoV2WithCelerMainInterface } from '../MystikoV2WithCelerMain';

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
    inputs: [
      {
        internalType: 'address',
        name: '_sender',
        type: 'address',
      },
      {
        internalType: 'uint64',
        name: '_srcChainId',
        type: 'uint64',
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
    name: 'executeMessage',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
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
  '0x6080604052600080546001600160a81b0319167340c57923924b5c5c5455c48d93317139addac8fb1790553480156200003757600080fd5b506040516200279a3803806200279a8339810160408190526200005a916200008e565b600a80546001600160a01b03199081163317909155600180546001600160a01b0390931692909116919091179055620000c0565b600060208284031215620000a157600080fd5b81516001600160a01b0381168114620000b957600080fd5b9392505050565b6126ca80620000d06000396000f3fe6080604052600436106101cd5760003560e01c8063897b0637116100f7578063a564ac1611610095578063d1c1a68011610064578063d1c1a68014610574578063e19abef814610594578063ec18d3e2146105b4578063ed6ea33a146105d457600080fd5b8063a564ac16146104e7578063b4318ead146104fd578063c0868f2b1461051d578063cdfceeba1461053357600080fd5b80639b215a26116100d15780639b215a26146104785780639b2cb5d81461048e5780639c649fdf146104a4578063a3bc64f2146104c757600080fd5b8063897b06371461042557806399383f78146104455780639a03636c1461046557600080fd5b806334c33e831161016f57806353af27d51161013e57806353af27d5146103a5578063570ca735146103c55780635e10b2b7146103e55780636afdf0481461040557600080fd5b806334c33e83146103045780633fe3347a14610324578063414a37ba14610351578063521ff0571461038557600080fd5b806319e75d6e116101ab57806319e75d6e1461023d57806321e32d551461025d5780632421e155146102955780632cd26d45146102e457600080fd5b806306394c9b146101d257806306462865146101f4578063153dc4501461021d575b600080fd5b3480156101de57600080fd5b506101f26101ed366004612212565b6105f5565b005b34801561020057600080fd5b5061020a60085481565b6040519081526020015b60405180910390f35b34801561022957600080fd5b506101f26102383660046123ca565b610672565b34801561024957600080fd5b506101f26102583660046123ca565b610727565b34801561026957600080fd5b5060035461027d906001600160a01b031681565b6040516001600160a01b039091168152602001610214565b3480156102a157600080fd5b5060408051808201909152600581527f63656c657200000000000000000000000000000000000000000000000000000060208201525b6040516102149190612561565b3480156102f057600080fd5b5060045461027d906001600160a01b031681565b34801561031057600080fd5b506101f261031f366004612212565b610782565b34801561033057600080fd5b5060408051808201909152600481526336b0b4b760e11b60208201526102d7565b34801561035d57600080fd5b5061020a7f30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f000000181565b34801561039157600080fd5b506101f26103a03660046123ca565b6107fa565b3480156103b157600080fd5b5060005461027d906001600160a01b031681565b3480156103d157600080fd5b50600a5461027d906001600160a01b031681565b3480156103f157600080fd5b506101f26104003660046123ca565b6108a5565b34801561041157600080fd5b5060015461027d906001600160a01b031681565b34801561043157600080fd5b506101f26104403660046123ca565b610950565b34801561045157600080fd5b506101f26104603660046122d2565b6109ab565b6101f261047336600461230c565b610a1f565b34801561048457600080fd5b5061020a60095481565b34801561049a57600080fd5b5061020a60055481565b6104b76104b236600461222d565b610d54565b6040519015158152602001610214565b3480156104d357600080fd5b506101f26104e2366004612212565b610e0d565b3480156104f357600080fd5b5061020a60075481565b34801561050957600080fd5b506101f26105183660046122d2565b610e85565b34801561052957600080fd5b5061020a60065481565b34801561053f57600080fd5b5060025461055b90600160a01b900467ffffffffffffffff1681565b60405167ffffffffffffffff9091168152602001610214565b34801561058057600080fd5b506101f261058f3660046123fc565b610ef9565b3480156105a057600080fd5b506101f26105af366004612212565b610fb3565b3480156105c057600080fd5b5060025461027d906001600160a01b031681565b3480156105e057600080fd5b50600a546104b790600160a01b900460ff1681565b600a546001600160a01b031633146106505760405162461bcd60e51b815260206004820152602560248201526000805160206126758339815191526044820152643a34b7b71760d91b60648201526084015b60405180910390fd5b600a80546001600160a01b0319166001600160a01b0392909216919091179055565b600a546001600160a01b031633146106c85760405162461bcd60e51b815260206004820152602560248201526000805160206126758339815191526044820152643a34b7b71760d91b6064820152608401610647565b600081116107225760405162461bcd60e51b815260206004820152602160248201527f696e76616c69642070656572206d696e696d616c206578656375746f722066656044820152606560f81b6064820152608401610647565b600855565b600a546001600160a01b0316331461077d5760405162461bcd60e51b815260206004820152602560248201526000805160206126758339815191526044820152643a34b7b71760d91b6064820152608401610647565b600655565b600a546001600160a01b031633146107d85760405162461bcd60e51b815260206004820152602560248201526000805160206126758339815191526044820152643a34b7b71760d91b6064820152608401610647565b600080546001600160a01b0319166001600160a01b0392909216919091179055565b600a546001600160a01b031633146108505760405162461bcd60e51b815260206004820152602560248201526000805160206126758339815191526044820152643a34b7b71760d91b6064820152608401610647565b600081116108a05760405162461bcd60e51b815260206004820152601f60248201527f696e76616c69642070656572206d696e696d616c20726f6c6c757020666565006044820152606401610647565b600955565b600a546001600160a01b031633146108fb5760405162461bcd60e51b815260206004820152602560248201526000805160206126758339815191526044820152643a34b7b71760d91b6064820152608401610647565b6000811161094b5760405162461bcd60e51b815260206004820152601c60248201527f696e76616c6964206d696e696d616c206578656375746f7220666565000000006044820152606401610647565b600755565b600a546001600160a01b031633146109a65760405162461bcd60e51b815260206004820152602560248201526000805160206126758339815191526044820152643a34b7b71760d91b6064820152608401610647565b600555565b600a546001600160a01b03163314610a015760405162461bcd60e51b815260206004820152602560248201526000805160206126758339815191526044820152643a34b7b71760d91b6064820152608401610647565b600a8054911515600160a01b0260ff60a01b19909216919091179055565b600a54600160a01b900460ff1615610a795760405162461bcd60e51b815260206004820152601560248201527f6465706f73697473206172652064697361626c656400000000000000000000006044820152606401610647565b60055481511015610acc5760405162461bcd60e51b815260206004820152600e60248201527f616d6f756e7420746f6f206665770000000000000000000000000000000000006044820152606401610647565b6006548160a001511015610b225760405162461bcd60e51b815260206004820152601260248201527f6272696467652066656520746f6f2066657700000000000000000000000000006044820152606401610647565b6008548160c001511015610b785760405162461bcd60e51b815260206004820152601460248201527f6578656375746f722066656520746f6f206665770000000000000000000000006044820152606401610647565b6009548160e001511015610bce5760405162461bcd60e51b815260206004820152601260248201527f726f6c6c75702066656520746f6f2066657700000000000000000000000000006044820152606401610647565b6000610be782604001518360000151846060015161102b565b905080826020015114610c3c5760405162461bcd60e51b815260206004820152601960248201527f636f6d6d69746d656e74206861736820696e636f7272656374000000000000006044820152606401610647565b610c45336111ed565b15610c925760405162461bcd60e51b815260206004820152601260248201527f73616e6374696f6e6564206164647265737300000000000000000000000000006044820152606401610647565b60025460e083015160c08401518451610ccd936001600160a01b03169291610cb9916125fb565b610cc391906125fb565b8460a0015161128e565b6040805160a081018252835181526020808501519082015260c08401519181019190915260e08301516060820152608080840151908201526000610d108261138f565b9050610d208460a00151826113fe565b60208401516040517fd106eb38b3368b7c294e36fae5513fdefe880be5abfad529b37b044f2fdd2dbe90600090a250505050565b6004546000906001600160a01b03163314610db15760405162461bcd60e51b815260206004820152601e60248201527f6d73672073656e646572206973206e6f74206272696467652070726f787900006044820152606401610647565b6000610df285858080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525061148192505050565b9050610e0086888584611549565b5060019695505050505050565b600a546001600160a01b03163314610e635760405162461bcd60e51b815260206004820152602560248201526000805160206126758339815191526044820152643a34b7b71760d91b6064820152608401610647565b600480546001600160a01b0319166001600160a01b0392909216919091179055565b600a546001600160a01b03163314610edb5760405162461bcd60e51b815260206004820152602560248201526000805160206126758339815191526044820152643a34b7b71760d91b6064820152608401610647565b60008054911515600160a01b0260ff60a01b19909216919091179055565b600a546001600160a01b03163314610f4f5760405162461bcd60e51b815260206004820152602560248201526000805160206126758339815191526044820152643a34b7b71760d91b6064820152608401610647565b6002805467ffffffffffffffff909316600160a01b027fffffffff0000000000000000ffffffffffffffffffffffffffffffffffffffff90931692909217909155600380546001600160a01b039092166001600160a01b0319909216919091179055565b600a546001600160a01b031633146110095760405162461bcd60e51b815260206004820152602560248201526000805160206126758339815191526044820152643a34b7b71760d91b6064820152608401610647565b600280546001600160a01b0319166001600160a01b0392909216919091179055565b60007f30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f000000184106110a85760405162461bcd60e51b8152602060048201526024808201527f686173684b2073686f756c64206265206c657373207468616e204649454c445f60448201526353495a4560e01b6064820152608401610647565b7f30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001831061113d5760405162461bcd60e51b815260206004820152602660248201527f72616e646f6d532073686f756c64206265206c657373207468616e204649454c60448201527f445f53495a4500000000000000000000000000000000000000000000000000006064820152608401610647565b60015460408051606081018252868152602081018690526fffffffffffffffffffffffffffffffff85168183015290516304b98e1d60e31b81526001600160a01b03909216916325cc70e89161119591600401612530565b60206040518083038186803b1580156111ad57600080fd5b505afa1580156111c1573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906111e591906123e3565b949350505050565b60008054600160a01b900460ff161561120857506000919050565b60005460405163df592f7d60e01b81526001600160a01b03848116600483015290911690819063df592f7d9060240160206040518083038186803b15801561124f57600080fd5b505afa158015611263573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061128791906122ef565b9392505050565b61129881836125fb565b34146112e65760405162461bcd60e51b815260206004820152601260248201527f696e73756666696369656e7420746f6b656e00000000000000000000000000006044820152606401610647565b6000836001600160a01b03168360405160006040518083038185875af1925050503d8060008114611333576040519150601f19603f3d011682016040523d82523d6000602084013e611338565b606091505b50509050806113895760405162461bcd60e51b815260206004820152601660248201527f616d6f756e74207472616e73666572206661696c6564000000000000000000006044820152606401610647565b50505050565b60608061139f836000015161177f565b6113ac846020015161177f565b6113b9856040015161177f565b6113c6866060015161177f565b6113d38760800151611817565b6040516020016113e795949392919061248a565b60408051601f198184030181529190529392505050565b60048054600354600254604051634f9e72ad60e11b81526001600160a01b0393841694639f3ce55a94889461144b94911692600160a01b90910467ffffffffffffffff16918891016124f5565b6000604051808303818588803b15801561146457600080fd5b505af1158015611478573d6000803e3d6000fd5b50505050505050565b6114b36040518060a0016040528060008152602001600081526020016000815260200160008152602001606081525090565b6114e56040518060a0016040528060008152602001600081526020016000815260200160008152602001606081525090565b60006114f1848261184e565b9083529050611500848261184e565b60208401919091529050611514848261184e565b60408401919091529050611528848261184e565b6060840191909152905061153c848261197f565b5060808301525092915050565b6003546001600160a01b038481169116146115a65760405162461bcd60e51b815260206004820152601e60248201527f66726f6d2070726f78792061646472657373206e6f74206d61746368656400006044820152606401610647565b60025467ffffffffffffffff858116600160a01b909204161461160b5760405162461bcd60e51b815260206004820152601960248201527f66726f6d20636861696e206964206e6f74206d617463686564000000000000006044820152606401610647565b80516116595760405162461bcd60e51b815260206004820152601f60248201527f616d6f756e742073686f756c642062652067726561746572207468616e2030006044820152606401610647565b600754816040015110156116af5760405162461bcd60e51b815260206004820152601460248201527f6578656375746f722066656520746f6f206665770000000000000000000000006044820152606401610647565b6002546040516378d60cd760e01b81526001600160a01b03909116906378d60cd7906116e19084908690600401612574565b602060405180830381600087803b1580156116fb57600080fd5b505af115801561170f573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061173391906122ef565b6113895760405162461bcd60e51b815260206004820152601260248201527f63616c6c20656e7175657565206572726f7200000000000000000000000000006044820152606401610647565b60606001600160ff1b038211156117d85760405162461bcd60e51b815260206004820152601b60248201527f56616c756520657863656564732075696e743235352072616e676500000000006044820152606401610647565b60405160208082526000601f5b828210156118075785811a8260208601015360019190910190600019016117e5565b5050506040818101905292915050565b805160609061182581611a8c565b8360405160200161183792919061245b565b604051602081830303815290604052915050919050565b600080835183602061186091906125fb565b1115801561187757506118748360206125fb565b83105b6118cf5760405162461bcd60e51b815260206004820152602360248201527f4e65787455696e743235352c206f66667365742065786365656473206d6178696044820152626d756d60e81b6064820152608401610647565b600060405160206000600182038760208a0101515b838310156119045780821a838601536001830192506001820391506118e4565b50505081016040525190506001600160ff1b038111156119665760405162461bcd60e51b815260206004820152601760248201527f56616c75652065786365656473207468652072616e67650000000000000000006044820152606401610647565b806119728560206125fb565b92509250505b9250929050565b606060008061198e8585611b5b565b86519095509091506119a082866125fb565b111580156119b657506119b381856125fb565b84105b611a0e5760405162461bcd60e51b8152602060048201526024808201527f4e65787456617242797465732c206f66667365742065786365656473206d6178604482015263696d756d60e01b6064820152608401610647565b606081158015611a2957604051915060208201604052611a73565b6040519150601f8316801560200281840101848101888315602002848c0101015b81831015611a62578051835260209283019201611a4a565b5050848452601f01601f1916604052505b5080611a7f83876125fb565b9350935050509250929050565b606060fd8267ffffffffffffffff161015611ac157604080516001815260f884901b6020820152602181019091525b92915050565b61ffff8267ffffffffffffffff1611611b1157611ae160fd60f81b611d61565b611aea83611d88565b604051602001611afb92919061245b565b6040516020818303038152906040529050919050565b63ffffffff8267ffffffffffffffff1611611b3c57611b33607f60f91b611d61565b611aea83611dcb565b611b4d6001600160f81b0319611d61565b611aea83611e0e565b919050565b6000806000611b6a8585611e51565b94509050600060fd60f81b6001600160f81b031983161415611c0357611b908686611ed9565b955061ffff16905060fd8110801590611bab575061ffff8111155b611bf75760405162461bcd60e51b815260206004820152601f60248201527f4e65787455696e7431362c2076616c7565206f7574736964652072616e6765006044820152606401610647565b92508391506119789050565b607f60f91b6001600160f81b031983161415611c8e57611c238686611f92565b955063ffffffff16905061ffff81118015611c42575063ffffffff8111155b611bf75760405162461bcd60e51b815260206004820181905260248201527f4e65787456617255696e742c2076616c7565206f7574736964652072616e67656044820152606401610647565b6001600160f81b03198083161415611d0b57611caa8686612064565b955067ffffffffffffffff16905063ffffffff8111611bf75760405162461bcd60e51b815260206004820181905260248201527f4e65787456617255696e742c2076616c7565206f7574736964652072616e67656044820152606401610647565b5060f881901c60fd8110611bf75760405162461bcd60e51b815260206004820181905260248201527f4e65787456617255696e742c2076616c7565206f7574736964652072616e67656044820152606401610647565b60408051600181526001600160f81b03198316602082015260218101909152606090611abb565b6040516002808252606091906000601f5b82821015611dbb5785811a826020860101536001919091019060001901611d99565b5050506022810160405292915050565b6040516004808252606091906000601f5b82821015611dfe5785811a826020860101536001919091019060001901611ddc565b5050506024810160405292915050565b6040516008808252606091906000601f5b82821015611e415785811a826020860101536001919091019060001901611e1f565b5050506028810160405292915050565b6000808351836001611e6391906125fb565b11158015611e7a5750611e778360016125fb565b83105b611ec65760405162461bcd60e51b815260206004820181905260248201527f4e657874427974652c204f66667365742065786365656473206d6178696d756d6044820152606401610647565b83830160200151806119728560016125fb565b6000808351836002611eeb91906125fb565b11158015611f025750611eff8360026125fb565b83105b611f595760405162461bcd60e51b815260206004820152602260248201527f4e65787455696e7431362c206f66667365742065786365656473206d6178696d604482015261756d60f01b6064820152608401610647565b6000604051846020870101518060011a82538060001a60018301535060028101604052601e8103519150508084600261197291906125fb565b6000808351836004611fa491906125fb565b11158015611fbb5750611fb88360046125fb565b83105b6120125760405162461bcd60e51b815260206004820152602260248201527f4e65787455696e7433322c206f66667365742065786365656473206d6178696d604482015261756d60f01b6064820152608401610647565b600060405160046000600182038760208a0101515b838310156120475780821a83860153600183019250600182039150612027565b5050508181016040526020039003519050806119728560046125fb565b600080835183600861207691906125fb565b1115801561208d575061208a8360086125fb565b83105b6120e45760405162461bcd60e51b815260206004820152602260248201527f4e65787455696e7436342c206f66667365742065786365656473206d6178696d604482015261756d60f01b6064820152608401610647565b600060405160086000600182038760208a0101515b838310156121195780821a838601536001830192506001820391506120f9565b5050508181016040526020039003519050806119728560086125fb565b80356001600160a01b0381168114611b5657600080fd5b600082601f83011261215e57600080fd5b813567ffffffffffffffff808211156121795761217961264d565b604051601f8301601f19908116603f011681019082821181831017156121a1576121a161264d565b816040528381528660208588010111156121ba57600080fd5b836020870160208301376000602085830101528094505050505092915050565b80356fffffffffffffffffffffffffffffffff81168114611b5657600080fd5b803567ffffffffffffffff81168114611b5657600080fd5b60006020828403121561222457600080fd5b61128782612136565b60008060008060006080868803121561224557600080fd5b61224e86612136565b945061225c602087016121fa565b9350604086013567ffffffffffffffff8082111561227957600080fd5b818801915088601f83011261228d57600080fd5b81358181111561229c57600080fd5b8960208285010111156122ae57600080fd5b6020830195508094505050506122c660608701612136565b90509295509295909350565b6000602082840312156122e457600080fd5b813561128781612663565b60006020828403121561230157600080fd5b815161128781612663565b60006020828403121561231e57600080fd5b813567ffffffffffffffff8082111561233657600080fd5b90830190610100828603121561234b57600080fd5b6123536125d1565b823581526020830135602082015260408301356040820152612377606084016121da565b606082015260808301358281111561238e57600080fd5b61239a8782860161214d565b60808301525060a083013560a082015260c083013560c082015260e083013560e082015280935050505092915050565b6000602082840312156123dc57600080fd5b5035919050565b6000602082840312156123f557600080fd5b5051919050565b6000806040838503121561240f57600080fd5b612418836121fa565b915061242660208401612136565b90509250929050565b60008151808452612447816020860160208601612621565b601f01601f19169290920160200192915050565b6000835161246d818460208801612621565b835190830190612481818360208801612621565b01949350505050565b6000865161249c818460208b01612621565b8651908301906124b0818360208b01612621565b86519101906124c3818360208a01612621565b85519101906124d6818360208901612621565b84519101906124e9818360208801612621565b01979650505050505050565b6001600160a01b038416815267ffffffffffffffff83166020820152606060408201526000612527606083018461242f565b95945050505050565b60608101818360005b6003811015612558578151835260209283019290910190600101612539565b50505092915050565b602081526000611287602083018461242f565b60408152825160408201526020830151606082015260408301516080820152606083015160a08201526000608084015160a060c08401526125b860e084018261242f565b9150506001600160a01b03831660208301529392505050565b604051610100810167ffffffffffffffff811182821017156125f5576125f561264d565b60405290565b6000821982111561261c57634e487b7160e01b600052601160045260246000fd5b500190565b60005b8381101561263c578181015183820152602001612624565b838111156113895750506000910152565b634e487b7160e01b600052604160045260246000fd5b801515811461267157600080fd5b5056fe4f6e6c79206f70657261746f722063616e2063616c6c20746869732066756e63a2646970667358221220d256fb1506fdc1a3c4d5881a8a29b87bb4183d5d3992964e0777a40cc26bd15264736f6c63430008070033';

type MystikoV2WithCelerMainConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: MystikoV2WithCelerMainConstructorParams,
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class MystikoV2WithCelerMain__factory extends ContractFactory {
  constructor(...args: MystikoV2WithCelerMainConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = 'MystikoV2WithCelerMain';
  }

  deploy(
    _hasher3: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<MystikoV2WithCelerMain> {
    return super.deploy(_hasher3, overrides || {}) as Promise<MystikoV2WithCelerMain>;
  }
  getDeployTransaction(
    _hasher3: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): TransactionRequest {
    return super.getDeployTransaction(_hasher3, overrides || {});
  }
  attach(address: string): MystikoV2WithCelerMain {
    return super.attach(address) as MystikoV2WithCelerMain;
  }
  connect(signer: Signer): MystikoV2WithCelerMain__factory {
    return super.connect(signer) as MystikoV2WithCelerMain__factory;
  }
  static readonly contractName: 'MystikoV2WithCelerMain';
  public readonly contractName: 'MystikoV2WithCelerMain';
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MystikoV2WithCelerMainInterface {
    return new utils.Interface(_abi) as MystikoV2WithCelerMainInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): MystikoV2WithCelerMain {
    return new Contract(address, _abi, signerOrProvider) as MystikoV2WithCelerMain;
  }
}
