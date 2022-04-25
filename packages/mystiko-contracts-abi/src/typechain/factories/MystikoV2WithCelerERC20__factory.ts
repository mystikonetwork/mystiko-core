/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from 'ethers';
import { Provider, TransactionRequest } from '@ethersproject/providers';
import type { MystikoV2WithCelerERC20, MystikoV2WithCelerERC20Interface } from '../MystikoV2WithCelerERC20';

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
    name: 'setPeerContract',
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
  '0x6080604052600080546001600160a81b0319167340c57923924b5c5c5455c48d93317139addac8fb1790553480156200003757600080fd5b5060405162002d0738038062002d078339810160408190526200005a91620000b4565b600a8054336001600160a01b0319918216179091556001805482166001600160a01b03948516179055600b805490911691909216179055620000ec565b80516001600160a01b0381168114620000af57600080fd5b919050565b60008060408385031215620000c857600080fd5b620000d38362000097565b9150620000e36020840162000097565b90509250929050565b612c0b80620000fc6000396000f3fe6080604052600436106102195760003560e01c8063897b06371161011d578063b4318ead116100b0578063c9230c5d1161007f578063e19abef811610064578063e19abef81461066e578063ec18d3e21461068e578063ed6ea33a146106ae57600080fd5b8063c9230c5d14610618578063cdfceeba1461062d57600080fd5b8063b4318ead1461059b578063babc2044146105bb578063c0868f2b146105db578063c2d41601146105f157600080fd5b80639b2cb5d8116100ec5780639b2cb5d81461052c5780639c649fdf14610542578063a3bc64f214610565578063a564ac161461058557600080fd5b8063897b0637146104c357806399383f78146104e35780639a03636c146105035780639b215a261461051657600080fd5b806334c33e83116101b0578063521ff0571161017f578063570ca73511610164578063570ca735146104635780635e10b2b7146104835780636afdf048146104a357600080fd5b8063521ff0571461042357806353af27d51461044357600080fd5b806334c33e831461036957806338d52e0f146103895780633fe3347a146103a9578063414a37ba146103ef57600080fd5b806319e75d6e116101ec57806319e75d6e146102ab57806321e32d55146102cb5780632421e155146103035780632cd26d451461034957600080fd5b806306394c9b1461021e5780630646286514610240578063153dc45014610269578063176de7a814610289575b600080fd5b34801561022a57600080fd5b5061023e61023936600461264d565b6106cf565b005b34801561024c57600080fd5b5061025660085481565b6040519081526020015b60405180910390f35b34801561027557600080fd5b5061023e61028436600461287c565b61074c565b34801561029557600080fd5b5061029e610801565b6040516102609190612a49565b3480156102b757600080fd5b5061023e6102c636600461287c565b610887565b3480156102d757600080fd5b506003546102eb906001600160a01b031681565b6040516001600160a01b039091168152602001610260565b34801561030f57600080fd5b5060408051808201909152600581527f63656c6572000000000000000000000000000000000000000000000000000000602082015261029e565b34801561035557600080fd5b506004546102eb906001600160a01b031681565b34801561037557600080fd5b5061023e61038436600461264d565b6108e2565b34801561039557600080fd5b50600b546102eb906001600160a01b031681565b3480156103b557600080fd5b5060408051808201909152600581527f6572633230000000000000000000000000000000000000000000000000000000602082015261029e565b3480156103fb57600080fd5b506102567f30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f000000181565b34801561042f57600080fd5b5061023e61043e36600461287c565b61095a565b34801561044f57600080fd5b506000546102eb906001600160a01b031681565b34801561046f57600080fd5b50600a546102eb906001600160a01b031681565b34801561048f57600080fd5b5061023e61049e36600461287c565b610a05565b3480156104af57600080fd5b506001546102eb906001600160a01b031681565b3480156104cf57600080fd5b5061023e6104de36600461287c565b610ab0565b3480156104ef57600080fd5b5061023e6104fe36600461270d565b610b0b565b61023e6105113660046127be565b610b7f565b34801561052257600080fd5b5061025660095481565b34801561053857600080fd5b5061025660055481565b610555610550366004612668565b610eb4565b6040519015158152602001610260565b34801561057157600080fd5b5061023e61058036600461264d565b610f6d565b34801561059157600080fd5b5061025660075481565b3480156105a757600080fd5b5061023e6105b636600461270d565b610fe5565b3480156105c757600080fd5b5061023e6105d63660046128ae565b611059565b3480156105e757600080fd5b5061025660065481565b3480156105fd57600080fd5b50610606611113565b60405160ff9091168152602001610260565b34801561062457600080fd5b5061029e611190565b34801561063957600080fd5b5060025461065590600160a01b900467ffffffffffffffff1681565b60405167ffffffffffffffff9091168152602001610260565b34801561067a57600080fd5b5061023e61068936600461264d565b6111d5565b34801561069a57600080fd5b506002546102eb906001600160a01b031681565b3480156106ba57600080fd5b50600a5461055590600160a01b900460ff1681565b600a546001600160a01b0316331461072a5760405162461bcd60e51b81526020600482015260256024820152600080516020612bb68339815191526044820152643a34b7b71760d91b60648201526084015b60405180910390fd5b600a80546001600160a01b0319166001600160a01b0392909216919091179055565b600a546001600160a01b031633146107a25760405162461bcd60e51b81526020600482015260256024820152600080516020612bb68339815191526044820152643a34b7b71760d91b6064820152608401610721565b600081116107fc5760405162461bcd60e51b815260206004820152602160248201527f696e76616c69642070656572206d696e696d616c206578656375746f722066656044820152606560f81b6064820152608401610721565b600855565b600b54604080516395d89b4160e01b815290516060926001600160a01b0316916395d89b41916004808301926000929190829003018186803b15801561084657600080fd5b505afa15801561085a573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f191682016040526108829190810190612747565b905090565b600a546001600160a01b031633146108dd5760405162461bcd60e51b81526020600482015260256024820152600080516020612bb68339815191526044820152643a34b7b71760d91b6064820152608401610721565b600655565b600a546001600160a01b031633146109385760405162461bcd60e51b81526020600482015260256024820152600080516020612bb68339815191526044820152643a34b7b71760d91b6064820152608401610721565b600080546001600160a01b0319166001600160a01b0392909216919091179055565b600a546001600160a01b031633146109b05760405162461bcd60e51b81526020600482015260256024820152600080516020612bb68339815191526044820152643a34b7b71760d91b6064820152608401610721565b60008111610a005760405162461bcd60e51b815260206004820152601f60248201527f696e76616c69642070656572206d696e696d616c20726f6c6c757020666565006044820152606401610721565b600955565b600a546001600160a01b03163314610a5b5760405162461bcd60e51b81526020600482015260256024820152600080516020612bb68339815191526044820152643a34b7b71760d91b6064820152608401610721565b60008111610aab5760405162461bcd60e51b815260206004820152601c60248201527f696e76616c6964206d696e696d616c206578656375746f7220666565000000006044820152606401610721565b600755565b600a546001600160a01b03163314610b065760405162461bcd60e51b81526020600482015260256024820152600080516020612bb68339815191526044820152643a34b7b71760d91b6064820152608401610721565b600555565b600a546001600160a01b03163314610b615760405162461bcd60e51b81526020600482015260256024820152600080516020612bb68339815191526044820152643a34b7b71760d91b6064820152608401610721565b600a8054911515600160a01b0260ff60a01b19909216919091179055565b600a54600160a01b900460ff1615610bd95760405162461bcd60e51b815260206004820152601560248201527f6465706f73697473206172652064697361626c656400000000000000000000006044820152606401610721565b60055481511015610c2c5760405162461bcd60e51b815260206004820152600e60248201527f616d6f756e7420746f6f206665770000000000000000000000000000000000006044820152606401610721565b6006548160a001511015610c825760405162461bcd60e51b815260206004820152601260248201527f6272696467652066656520746f6f2066657700000000000000000000000000006044820152606401610721565b6008548160c001511015610cd85760405162461bcd60e51b815260206004820152601460248201527f6578656375746f722066656520746f6f206665770000000000000000000000006044820152606401610721565b6009548160e001511015610d2e5760405162461bcd60e51b815260206004820152601260248201527f726f6c6c75702066656520746f6f2066657700000000000000000000000000006044820152606401610721565b6000610d4782604001518360000151846060015161124d565b905080826020015114610d9c5760405162461bcd60e51b815260206004820152601960248201527f636f6d6d69746d656e74206861736820696e636f7272656374000000000000006044820152606401610721565b610da533611411565b15610df25760405162461bcd60e51b815260206004820152601260248201527f73616e6374696f6e6564206164647265737300000000000000000000000000006044820152606401610721565b60025460e083015160c08401518451610e2d936001600160a01b03169291610e1991612b3c565b610e239190612b3c565b8460a001516114ab565b6040805160a081018252835181526020808501519082015260c08401519181019190915260e08301516060820152608080840151908201526000610e7082611517565b9050610e808460a0015182611586565b60208401516040517fd106eb38b3368b7c294e36fae5513fdefe880be5abfad529b37b044f2fdd2dbe90600090a250505050565b6004546000906001600160a01b03163314610f115760405162461bcd60e51b815260206004820152601e60248201527f6d73672073656e646572206973206e6f74206272696467652070726f787900006044820152606401610721565b6000610f5285858080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525061160992505050565b9050610f60868885846116d1565b5060019695505050505050565b600a546001600160a01b03163314610fc35760405162461bcd60e51b81526020600482015260256024820152600080516020612bb68339815191526044820152643a34b7b71760d91b6064820152608401610721565b600480546001600160a01b0319166001600160a01b0392909216919091179055565b600a546001600160a01b0316331461103b5760405162461bcd60e51b81526020600482015260256024820152600080516020612bb68339815191526044820152643a34b7b71760d91b6064820152608401610721565b60008054911515600160a01b0260ff60a01b19909216919091179055565b600a546001600160a01b031633146110af5760405162461bcd60e51b81526020600482015260256024820152600080516020612bb68339815191526044820152643a34b7b71760d91b6064820152608401610721565b6002805467ffffffffffffffff909316600160a01b027fffffffff0000000000000000ffffffffffffffffffffffffffffffffffffffff90931692909217909155600380546001600160a01b039092166001600160a01b0319909216919091179055565b600b546040805163313ce56760e01b815290516000926001600160a01b03169163313ce567916004808301926020929190829003018186803b15801561115857600080fd5b505afa15801561116c573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061088291906128e1565b600b54604080516306fdde0360e01b815290516060926001600160a01b0316916306fdde03916004808301926000929190829003018186803b15801561084657600080fd5b600a546001600160a01b0316331461122b5760405162461bcd60e51b81526020600482015260256024820152600080516020612bb68339815191526044820152643a34b7b71760d91b6064820152608401610721565b600280546001600160a01b0319166001600160a01b0392909216919091179055565b60007f30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f000000184106112ca5760405162461bcd60e51b8152602060048201526024808201527f686173684b2073686f756c64206265206c657373207468616e204649454c445f60448201526353495a4560e01b6064820152608401610721565b7f30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001831061135f5760405162461bcd60e51b815260206004820152602660248201527f72616e646f6d532073686f756c64206265206c657373207468616e204649454c60448201527f445f53495a4500000000000000000000000000000000000000000000000000006064820152608401610721565b60015460408051606081018252868152602081018690526fffffffffffffffffffffffffffffffff85168183015290516304b98e1d60e31b81526001600160a01b03909216916325cc70e8916113b791600401612a18565b60206040518083038186803b1580156113cf57600080fd5b505afa1580156113e3573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906114079190612895565b90505b9392505050565b60008054600160a01b900460ff161561142c57506000919050565b60005460405163df592f7d60e01b81526001600160a01b03848116600483015290911690819063df592f7d9060240160206040518083038186803b15801561147357600080fd5b505afa158015611487573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061140a919061272a565b8034146114fa5760405162461bcd60e51b815260206004820152601360248201527f62726964676520666565206d69736d61746368000000000000000000000000006044820152606401610721565b600b54611512906001600160a01b031633858561190d565b505050565b606080611527836000015161197c565b611534846020015161197c565b611541856040015161197c565b61154e866060015161197c565b61155b8760800151611a14565b60405160200161156f95949392919061297b565b60408051601f198184030181529190529392505050565b60048054600354600254604051634f9e72ad60e11b81526001600160a01b0393841694639f3ce55a9488946115d394911692600160a01b90910467ffffffffffffffff16918891016129e6565b6000604051808303818588803b1580156115ec57600080fd5b505af1158015611600573d6000803e3d6000fd5b50505050505050565b61163b6040518060a0016040528060008152602001600081526020016000815260200160008152602001606081525090565b61166d6040518060a0016040528060008152602001600081526020016000815260200160008152602001606081525090565b60006116798482611a4b565b90835290506116888482611a4b565b6020840191909152905061169c8482611a4b565b604084019190915290506116b08482611a4b565b606084019190915290506116c48482611b7c565b5060808301525092915050565b6003546001600160a01b0384811691161461172e5760405162461bcd60e51b815260206004820152601e60248201527f66726f6d2070726f78792061646472657373206e6f74206d61746368656400006044820152606401610721565b60025467ffffffffffffffff858116600160a01b90920416146117935760405162461bcd60e51b815260206004820152601960248201527f66726f6d20636861696e206964206e6f74206d617463686564000000000000006044820152606401610721565b80516117e15760405162461bcd60e51b815260206004820152601f60248201527f616d6f756e742073686f756c642062652067726561746572207468616e2030006044820152606401610721565b600754816040015110156118375760405162461bcd60e51b815260206004820152601460248201527f6578656375746f722066656520746f6f206665770000000000000000000000006044820152606401610721565b6002546040516378d60cd760e01b81526001600160a01b03909116906378d60cd7906118699084908690600401612a5c565b602060405180830381600087803b15801561188357600080fd5b505af1158015611897573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906118bb919061272a565b6119075760405162461bcd60e51b815260206004820152601260248201527f63616c6c20656e7175657565206572726f7200000000000000000000000000006044820152606401610721565b50505050565b604080516001600160a01b0385811660248301528416604482015260648082018490528251808303909101815260849091019091526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff166323b872dd60e01b179052611907908590611c89565b60606001600160ff1b038211156119d55760405162461bcd60e51b815260206004820152601b60248201527f56616c756520657863656564732075696e743235352072616e676500000000006044820152606401610721565b60405160208082526000601f5b82821015611a045785811a8260208601015360019190910190600019016119e2565b5050506040818101905292915050565b8051606090611a2281611d6e565b83604051602001611a3492919061294c565b604051602081830303815290604052915050919050565b6000808351836020611a5d9190612b3c565b11158015611a745750611a71836020612b3c565b83105b611acc5760405162461bcd60e51b815260206004820152602360248201527f4e65787455696e743235352c206f66667365742065786365656473206d6178696044820152626d756d60e81b6064820152608401610721565b600060405160206000600182038760208a0101515b83831015611b015780821a83860153600183019250600182039150611ae1565b50505081016040525190506001600160ff1b03811115611b635760405162461bcd60e51b815260206004820152601760248201527f56616c75652065786365656473207468652072616e67650000000000000000006044820152606401610721565b80611b6f856020612b3c565b92509250505b9250929050565b6060600080611b8b8585611e3d565b8651909550909150611b9d8286612b3c565b11158015611bb35750611bb08185612b3c565b84105b611c0b5760405162461bcd60e51b8152602060048201526024808201527f4e65787456617242797465732c206f66667365742065786365656473206d6178604482015263696d756d60e01b6064820152608401610721565b606081158015611c2657604051915060208201604052611c70565b6040519150601f8316801560200281840101848101888315602002848c0101015b81831015611c5f578051835260209283019201611c47565b5050848452601f01601f1916604052505b5080611c7c8387612b3c565b9350935050509250929050565b6000611cde826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b03166120439092919063ffffffff16565b8051909150156115125780806020019051810190611cfc919061272a565b6115125760405162461bcd60e51b815260206004820152602a60248201527f5361666545524332303a204552433230206f7065726174696f6e20646964206e60448201527f6f742073756363656564000000000000000000000000000000000000000000006064820152608401610721565b606060fd8267ffffffffffffffff161015611da357604080516001815260f884901b6020820152602181019091525b92915050565b61ffff8267ffffffffffffffff1611611df357611dc360fd60f81b612052565b611dcc83612079565b604051602001611ddd92919061294c565b6040516020818303038152906040529050919050565b63ffffffff8267ffffffffffffffff1611611e1e57611e15607f60f91b612052565b611dcc836120bc565b611e2f6001600160f81b0319612052565b611dcc836120ff565b919050565b6000806000611e4c8585612142565b94509050600060fd60f81b6001600160f81b031983161415611ee557611e7286866121ca565b955061ffff16905060fd8110801590611e8d575061ffff8111155b611ed95760405162461bcd60e51b815260206004820152601f60248201527f4e65787455696e7431362c2076616c7565206f7574736964652072616e6765006044820152606401610721565b9250839150611b759050565b607f60f91b6001600160f81b031983161415611f7057611f058686612283565b955063ffffffff16905061ffff81118015611f24575063ffffffff8111155b611ed95760405162461bcd60e51b815260206004820181905260248201527f4e65787456617255696e742c2076616c7565206f7574736964652072616e67656044820152606401610721565b6001600160f81b03198083161415611fed57611f8c8686612355565b955067ffffffffffffffff16905063ffffffff8111611ed95760405162461bcd60e51b815260206004820181905260248201527f4e65787456617255696e742c2076616c7565206f7574736964652072616e67656044820152606401610721565b5060f881901c60fd8110611ed95760405162461bcd60e51b815260206004820181905260248201527f4e65787456617255696e742c2076616c7565206f7574736964652072616e67656044820152606401610721565b60606114078484600085612427565b60408051600181526001600160f81b03198316602082015260218101909152606090611d9d565b6040516002808252606091906000601f5b828210156120ac5785811a82602086010153600191909101906000190161208a565b5050506022810160405292915050565b6040516004808252606091906000601f5b828210156120ef5785811a8260208601015360019190910190600019016120cd565b5050506024810160405292915050565b6040516008808252606091906000601f5b828210156121325785811a826020860101536001919091019060001901612110565b5050506028810160405292915050565b60008083518360016121549190612b3c565b1115801561216b5750612168836001612b3c565b83105b6121b75760405162461bcd60e51b815260206004820181905260248201527f4e657874427974652c204f66667365742065786365656473206d6178696d756d6044820152606401610721565b8383016020015180611b6f856001612b3c565b60008083518360026121dc9190612b3c565b111580156121f357506121f0836002612b3c565b83105b61224a5760405162461bcd60e51b815260206004820152602260248201527f4e65787455696e7431362c206f66667365742065786365656473206d6178696d604482015261756d60f01b6064820152608401610721565b6000604051846020870101518060011a82538060001a60018301535060028101604052601e81035191505080846002611b6f9190612b3c565b60008083518360046122959190612b3c565b111580156122ac57506122a9836004612b3c565b83105b6123035760405162461bcd60e51b815260206004820152602260248201527f4e65787455696e7433322c206f66667365742065786365656473206d6178696d604482015261756d60f01b6064820152608401610721565b600060405160046000600182038760208a0101515b838310156123385780821a83860153600183019250600182039150612318565b505050818101604052602003900351905080611b6f856004612b3c565b60008083518360086123679190612b3c565b1115801561237e575061237b836008612b3c565b83105b6123d55760405162461bcd60e51b815260206004820152602260248201527f4e65787455696e7436342c206f66667365742065786365656473206d6178696d604482015261756d60f01b6064820152608401610721565b600060405160086000600182038760208a0101515b8383101561240a5780821a838601536001830192506001820391506123ea565b505050818101604052602003900351905080611b6f856008612b3c565b60608247101561249f5760405162461bcd60e51b815260206004820152602660248201527f416464726573733a20696e73756666696369656e742062616c616e636520666f60448201527f722063616c6c00000000000000000000000000000000000000000000000000006064820152608401610721565b6001600160a01b0385163b6124f65760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e74726163740000006044820152606401610721565b600080866001600160a01b031685876040516125129190612930565b60006040518083038185875af1925050503d806000811461254f576040519150601f19603f3d011682016040523d82523d6000602084013e612554565b606091505b509150915061256482828661256f565b979650505050505050565b6060831561257e57508161140a565b82511561258e5782518084602001fd5b8160405162461bcd60e51b81526004016107219190612a49565b80356001600160a01b0381168114611e3857600080fd5b600082601f8301126125d057600080fd5b81356125e36125de82612b14565b612ae3565b8181528460208386010111156125f857600080fd5b816020850160208301376000918101602001919091529392505050565b80356fffffffffffffffffffffffffffffffff81168114611e3857600080fd5b803567ffffffffffffffff81168114611e3857600080fd5b60006020828403121561265f57600080fd5b61140a826125a8565b60008060008060006080868803121561268057600080fd5b612689866125a8565b945061269760208701612635565b9350604086013567ffffffffffffffff808211156126b457600080fd5b818801915088601f8301126126c857600080fd5b8135818111156126d757600080fd5b8960208285010111156126e957600080fd5b602083019550809450505050612701606087016125a8565b90509295509295909350565b60006020828403121561271f57600080fd5b813561140a81612ba4565b60006020828403121561273c57600080fd5b815161140a81612ba4565b60006020828403121561275957600080fd5b815167ffffffffffffffff81111561277057600080fd5b8201601f8101841361278157600080fd5b805161278f6125de82612b14565b8181528560208385010111156127a457600080fd5b6127b5826020830160208601612b62565b95945050505050565b6000602082840312156127d057600080fd5b813567ffffffffffffffff808211156127e857600080fd5b9083019061010082860312156127fd57600080fd5b612805612ab9565b82358152602083013560208201526040830135604082015261282960608401612615565b606082015260808301358281111561284057600080fd5b61284c878286016125bf565b60808301525060a083013560a082015260c083013560c082015260e083013560e082015280935050505092915050565b60006020828403121561288e57600080fd5b5035919050565b6000602082840312156128a757600080fd5b5051919050565b600080604083850312156128c157600080fd5b6128ca83612635565b91506128d8602084016125a8565b90509250929050565b6000602082840312156128f357600080fd5b815160ff8116811461140a57600080fd5b6000815180845261291c816020860160208601612b62565b601f01601f19169290920160200192915050565b60008251612942818460208701612b62565b9190910192915050565b6000835161295e818460208801612b62565b835190830190612972818360208801612b62565b01949350505050565b6000865161298d818460208b01612b62565b8651908301906129a1818360208b01612b62565b86519101906129b4818360208a01612b62565b85519101906129c7818360208901612b62565b84519101906129da818360208801612b62565b01979650505050505050565b6001600160a01b038416815267ffffffffffffffff831660208201526060604082015260006127b56060830184612904565b60608101818360005b6003811015612a40578151835260209283019290910190600101612a21565b50505092915050565b60208152600061140a6020830184612904565b60408152825160408201526020830151606082015260408301516080820152606083015160a08201526000608084015160a060c0840152612aa060e0840182612904565b9150506001600160a01b03831660208301529392505050565b604051610100810167ffffffffffffffff81118282101715612add57612add612b8e565b60405290565b604051601f8201601f1916810167ffffffffffffffff81118282101715612b0c57612b0c612b8e565b604052919050565b600067ffffffffffffffff821115612b2e57612b2e612b8e565b50601f01601f191660200190565b60008219821115612b5d57634e487b7160e01b600052601160045260246000fd5b500190565b60005b83811015612b7d578181015183820152602001612b65565b838111156119075750506000910152565b634e487b7160e01b600052604160045260246000fd5b8015158114612bb257600080fd5b5056fe4f6e6c79206f70657261746f722063616e2063616c6c20746869732066756e63a2646970667358221220a3176eb8f25c0added6aebc1c835347811ed0d03c8223f04bc45a88da8ebd83864736f6c63430008070033';

type MystikoV2WithCelerERC20ConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: MystikoV2WithCelerERC20ConstructorParams,
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class MystikoV2WithCelerERC20__factory extends ContractFactory {
  constructor(...args: MystikoV2WithCelerERC20ConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = 'MystikoV2WithCelerERC20';
  }

  deploy(
    _hasher3: string,
    _token: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<MystikoV2WithCelerERC20> {
    return super.deploy(_hasher3, _token, overrides || {}) as Promise<MystikoV2WithCelerERC20>;
  }
  getDeployTransaction(
    _hasher3: string,
    _token: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): TransactionRequest {
    return super.getDeployTransaction(_hasher3, _token, overrides || {});
  }
  attach(address: string): MystikoV2WithCelerERC20 {
    return super.attach(address) as MystikoV2WithCelerERC20;
  }
  connect(signer: Signer): MystikoV2WithCelerERC20__factory {
    return super.connect(signer) as MystikoV2WithCelerERC20__factory;
  }
  static readonly contractName: 'MystikoV2WithCelerERC20';
  public readonly contractName: 'MystikoV2WithCelerERC20';
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MystikoV2WithCelerERC20Interface {
    return new utils.Interface(_abi) as MystikoV2WithCelerERC20Interface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): MystikoV2WithCelerERC20 {
    return new Contract(address, _abi, signerOrProvider) as MystikoV2WithCelerERC20;
  }
}
