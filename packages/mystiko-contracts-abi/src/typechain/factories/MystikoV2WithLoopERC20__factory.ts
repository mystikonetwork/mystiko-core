/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from 'ethers';
import { Provider, TransactionRequest } from '@ethersproject/providers';
import type { MystikoV2WithLoopERC20, MystikoV2WithLoopERC20Interface } from '../MystikoV2WithLoopERC20';

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
            name: 'rollupFee',
            type: 'uint256',
          },
        ],
        internalType: 'struct IMystikoLoop.DepositRequest',
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
];

const _bytecode =
  '0x608060405234801561001057600080fd5b506040516113fc3803806113fc83398101604081905261002f91610087565b60038054336001600160a01b0319918216179091556000805482166001600160a01b0394851617905560048054909116919092161790556100ba565b80516001600160a01b038116811461008257600080fd5b919050565b6000806040838503121561009a57600080fd5b6100a38361006b565b91506100b16020840161006b565b90509250929050565b611333806100c96000396000f3fe60806040526004361061010e5760003560e01c80637cbf0ff6116100a5578063c9230c5d11610074578063ec18d3e211610059578063ec18d3e21461033f578063ed6ea33a1461035f578063f6afe88f1461039057600080fd5b8063c9230c5d1461030a578063e19abef81461031f57600080fd5b80637cbf0ff61461028d5780639937e147146102ad57806399383f78146102c3578063c2d41601146102e357600080fd5b80633fe3347a116100e15780633fe3347a146101c5578063414a37ba1461020b578063570ca7351461024d5780636afdf0481461026d57600080fd5b806306394c9b14610113578063176de7a8146101355780632421e1551461016057806338d52e0f1461018d575b600080fd5b34801561011f57600080fd5b5061013361012e366004610f3c565b6103a3565b005b34801561014157600080fd5b5061014a61043f565b60405161015791906111a4565b60405180910390f35b34801561016c57600080fd5b5060408051808201909152600481526306c6f6f760e41b602082015261014a565b34801561019957600080fd5b506004546101ad906001600160a01b031681565b6040516001600160a01b039091168152602001610157565b3480156101d157600080fd5b5060408051808201909152600581527f6572633230000000000000000000000000000000000000000000000000000000602082015261014a565b34801561021757600080fd5b5061023f7f30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f000000181565b604051908152602001610157565b34801561025957600080fd5b506003546101ad906001600160a01b031681565b34801561027957600080fd5b506000546101ad906001600160a01b031681565b34801561029957600080fd5b506101336102a83660046110d6565b6104d0565b3480156102b957600080fd5b5061023f60025481565b3480156102cf57600080fd5b506101336102de366004610f65565b61058d565b3480156102ef57600080fd5b506102f861062e565b60405160ff9091168152602001610157565b34801561031657600080fd5b5061014a6106b6565b34801561032b57600080fd5b5061013361033a366004610f3c565b610706565b34801561034b57600080fd5b506001546101ad906001600160a01b031681565b34801561036b57600080fd5b5060035461038090600160a01b900460ff1681565b6040519015158152602001610157565b61013361039e366004611016565b61079d565b6003546001600160a01b031633146104105760405162461bcd60e51b815260206004820152602560248201527f4f6e6c79206f70657261746f722063616e2063616c6c20746869732066756e636044820152643a34b7b71760d91b60648201526084015b60405180910390fd5b6003805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b0392909216919091179055565b6060600460009054906101000a90046001600160a01b03166001600160a01b03166395d89b416040518163ffffffff1660e01b815260040160006040518083038186803b15801561048f57600080fd5b505afa1580156104a3573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f191682016040526104cb9190810190610f9f565b905090565b6003546001600160a01b031633146105385760405162461bcd60e51b815260206004820152602560248201527f4f6e6c79206f70657261746f722063616e2063616c6c20746869732066756e636044820152643a34b7b71760d91b6064820152608401610407565b600081116105885760405162461bcd60e51b815260206004820152601a60248201527f696e76616c6964206d696e696d616c20726f6c6c7570206665650000000000006044820152606401610407565b600255565b6003546001600160a01b031633146105f55760405162461bcd60e51b815260206004820152602560248201527f4f6e6c79206f70657261746f722063616e2063616c6c20746869732066756e636044820152643a34b7b71760d91b6064820152608401610407565b60038054911515600160a01b027fffffffffffffffffffffff00ffffffffffffffffffffffffffffffffffffffff909216919091179055565b6000600460009054906101000a90046001600160a01b03166001600160a01b031663313ce5676040518163ffffffff1660e01b815260040160206040518083038186803b15801561067e57600080fd5b505afa158015610692573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906104cb9190611108565b6060600460009054906101000a90046001600160a01b03166001600160a01b03166306fdde036040518163ffffffff1660e01b815260040160006040518083038186803b15801561048f57600080fd5b6003546001600160a01b0316331461076e5760405162461bcd60e51b815260206004820152602560248201527f4f6e6c79206f70657261746f722063616e2063616c6c20746869732066756e636044820152643a34b7b71760d91b6064820152608401610407565b6001805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b0392909216919091179055565b600354600160a01b900460ff16156107f75760405162461bcd60e51b815260206004820152601560248201527f6465706f73697473206172652064697361626c656400000000000000000000006044820152606401610407565b80516108455760405162461bcd60e51b815260206004820152601f60248201527f616d6f756e742073686f756c642062652067726561746572207468616e2030006044820152606401610407565b6002548160a00151101561089b5760405162461bcd60e51b815260206004820152601260248201527f726f6c6c75702066656520746f6f2066657700000000000000000000000000006044820152606401610407565b60006108b4826040015183600001518460600151610929565b9050808260200151146109095760405162461bcd60e51b815260206004820152601960248201527f636f6d6d69746d656e74206861736820696e636f7272656374000000000000006044820152606401610407565b610925826000015183602001518460a001518560800151610aed565b5050565b60007f30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f000000184106109a65760405162461bcd60e51b8152602060048201526024808201527f686173684b2073686f756c64206265206c657373207468616e204649454c445f60448201526353495a4560e01b6064820152608401610407565b7f30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f00000018310610a3b5760405162461bcd60e51b815260206004820152602660248201527f72616e646f6d532073686f756c64206265206c657373207468616e204649454c60448201527f445f53495a4500000000000000000000000000000000000000000000000000006064820152608401610407565b60005460408051606081018252868152602081018690526fffffffffffffffffffffffffffffffff85168183015290516304b98e1d60e31b81526001600160a01b03909216916325cc70e891610a9391600401611173565b60206040518083038186803b158015610aab57600080fd5b505afa158015610abf573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610ae391906110ef565b90505b9392505050565b600154610b0e906001600160a01b0316610b078487611284565b6000610c0c565b6040805160a0810182528581526020810185905260008183015260608101849052608081018390526001549151630c987d1360e01b815290916001600160a01b031690630c987d13903490610b679085906004016111b7565b6020604051808303818588803b158015610b8057600080fd5b505af1158015610b94573d6000803e3d6000fd5b50505050506040513d601f19601f82011682018060405250810190610bb99190610f82565b610c055760405162461bcd60e51b815260206004820152601260248201527f63616c6c20656e7175657565206572726f7200000000000000000000000000006044820152606401610407565b5050505050565b803414610c5b5760405162461bcd60e51b815260206004820152601360248201527f62726964676520666565206d69736d61746368000000000000000000000000006044820152606401610407565b600454610c73906001600160a01b0316338585610c78565b505050565b604080516001600160a01b0385811660248301528416604482015260648082018490528251808303909101815260849091019091526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff166323b872dd60e01b179052610ce7908590610ced565b50505050565b6000610d42826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b0316610dd29092919063ffffffff16565b805190915015610c735780806020019051810190610d609190610f82565b610c735760405162461bcd60e51b815260206004820152602a60248201527f5361666545524332303a204552433230206f7065726174696f6e20646964206e60448201527f6f742073756363656564000000000000000000000000000000000000000000006064820152608401610407565b6060610ae38484600085856001600160a01b0385163b610e345760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e74726163740000006044820152606401610407565b600080866001600160a01b03168587604051610e509190611157565b60006040518083038185875af1925050503d8060008114610e8d576040519150601f19603f3d011682016040523d82523d6000602084013e610e92565b606091505b5091509150610ea2828286610ead565b979650505050505050565b60608315610ebc575081610ae6565b825115610ecc5782518084602001fd5b8160405162461bcd60e51b815260040161040791906111a4565b600082601f830112610ef757600080fd5b8135610f0a610f058261125c565b61122b565b818152846020838601011115610f1f57600080fd5b816020850160208301376000918101602001919091529392505050565b600060208284031215610f4e57600080fd5b81356001600160a01b0381168114610ae657600080fd5b600060208284031215610f7757600080fd5b8135610ae6816112ec565b600060208284031215610f9457600080fd5b8151610ae6816112ec565b600060208284031215610fb157600080fd5b815167ffffffffffffffff811115610fc857600080fd5b8201601f81018413610fd957600080fd5b8051610fe7610f058261125c565b818152856020838501011115610ffc57600080fd5b61100d8260208301602086016112aa565b95945050505050565b60006020828403121561102857600080fd5b813567ffffffffffffffff8082111561104057600080fd5b9083019060c0828603121561105457600080fd5b61105c611202565b82358152602083013560208201526040830135604082015260608301356fffffffffffffffffffffffffffffffff8116811461109757600080fd5b60608201526080830135828111156110ae57600080fd5b6110ba87828601610ee6565b60808301525060a083013560a082015280935050505092915050565b6000602082840312156110e857600080fd5b5035919050565b60006020828403121561110157600080fd5b5051919050565b60006020828403121561111a57600080fd5b815160ff81168114610ae657600080fd5b600081518084526111438160208601602086016112aa565b601f01601f19169290920160200192915050565b600082516111698184602087016112aa565b9190910192915050565b60608101818360005b600381101561119b57815183526020928301929091019060010161117c565b50505092915050565b602081526000610ae6602083018461112b565b60208152815160208201526020820151604082015260408201516060820152606082015160808201526000608083015160a0808401526111fa60c084018261112b565b949350505050565b60405160c0810167ffffffffffffffff81118282101715611225576112256112d6565b60405290565b604051601f8201601f1916810167ffffffffffffffff81118282101715611254576112546112d6565b604052919050565b600067ffffffffffffffff821115611276576112766112d6565b50601f01601f191660200190565b600082198211156112a557634e487b7160e01b600052601160045260246000fd5b500190565b60005b838110156112c55781810151838201526020016112ad565b83811115610ce75750506000910152565b634e487b7160e01b600052604160045260246000fd5b80151581146112fa57600080fd5b5056fea2646970667358221220f1d75cba9b6346583550c94a48694c7dd024a59ca775dfc0cd3aa8b7f77db24464736f6c63430008070033';

type MystikoV2WithLoopERC20ConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: MystikoV2WithLoopERC20ConstructorParams,
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class MystikoV2WithLoopERC20__factory extends ContractFactory {
  constructor(...args: MystikoV2WithLoopERC20ConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = 'MystikoV2WithLoopERC20';
  }

  deploy(
    _hasher3: string,
    _token: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<MystikoV2WithLoopERC20> {
    return super.deploy(_hasher3, _token, overrides || {}) as Promise<MystikoV2WithLoopERC20>;
  }
  getDeployTransaction(
    _hasher3: string,
    _token: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): TransactionRequest {
    return super.getDeployTransaction(_hasher3, _token, overrides || {});
  }
  attach(address: string): MystikoV2WithLoopERC20 {
    return super.attach(address) as MystikoV2WithLoopERC20;
  }
  connect(signer: Signer): MystikoV2WithLoopERC20__factory {
    return super.connect(signer) as MystikoV2WithLoopERC20__factory;
  }
  static readonly contractName: 'MystikoV2WithLoopERC20';
  public readonly contractName: 'MystikoV2WithLoopERC20';
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MystikoV2WithLoopERC20Interface {
    return new utils.Interface(_abi) as MystikoV2WithLoopERC20Interface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): MystikoV2WithLoopERC20 {
    return new Contract(address, _abi, signerOrProvider) as MystikoV2WithLoopERC20;
  }
}
