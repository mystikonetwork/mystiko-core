/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from 'ethers';
import { Provider, TransactionRequest } from '@ethersproject/providers';
import type { Rollup1Verifier, Rollup1VerifierInterface } from '../Rollup1Verifier';

const _abi = [
  {
    inputs: [
      {
        components: [
          {
            components: [
              {
                internalType: 'uint256',
                name: 'X',
                type: 'uint256',
              },
              {
                internalType: 'uint256',
                name: 'Y',
                type: 'uint256',
              },
            ],
            internalType: 'struct Rollup1Pairing.G1Point',
            name: 'a',
            type: 'tuple',
          },
          {
            components: [
              {
                internalType: 'uint256[2]',
                name: 'X',
                type: 'uint256[2]',
              },
              {
                internalType: 'uint256[2]',
                name: 'Y',
                type: 'uint256[2]',
              },
            ],
            internalType: 'struct Rollup1Pairing.G2Point',
            name: 'b',
            type: 'tuple',
          },
          {
            components: [
              {
                internalType: 'uint256',
                name: 'X',
                type: 'uint256',
              },
              {
                internalType: 'uint256',
                name: 'Y',
                type: 'uint256',
              },
            ],
            internalType: 'struct Rollup1Pairing.G1Point',
            name: 'c',
            type: 'tuple',
          },
        ],
        internalType: 'struct Rollup1Verifier.Proof',
        name: 'proof',
        type: 'tuple',
      },
      {
        internalType: 'uint256[]',
        name: 'input',
        type: 'uint256[]',
      },
    ],
    name: 'verifyTx',
    outputs: [
      {
        internalType: 'bool',
        name: 'r',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

const _bytecode =
  '0x608060405234801561001057600080fd5b5061115e806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063c941764714610030575b600080fd5b61004361003e366004610f4f565b610057565b604051901515815260200160405180910390f35b600081516004146100ae5760405162461bcd60e51b815260206004820152601460248201527f696e76616c696420696e707574206c656e677468000000000000000000000000604482015260640160405180910390fd5b6100b882846100ce565b6100c4575060016100c8565b5060005b92915050565b60007f30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001816100fa610251565b905080608001515185516001610110919061105b565b1461011a57600080fd5b604080518082019091526000808252602082018190525b86518110156101c8578387828151811061014d5761014d6110fc565b60200260200101511061015f57600080fd5b6101b4826101af8560800151846001610178919061105b565b81518110610188576101886110fc565b60200260200101518a85815181106101a2576101a26110fc565b6020026020010151610751565b6107b5565b9150806101c0816110a9565b915050610131565b506101f18183608001516000815181106101e4576101e46110fc565b60200260200101516107b5565b9050610235856000015186602001516102098461080f565b856040015161021b8a6040015161080f565b6060880151885161022b9061080f565b89602001516108ae565b61024557600193505050506100c8565b50600095945050505050565b610259610d19565b6040805180820182527f0c4dd0ffbf5c0fdfb5a643f136a855cc8a2bcbae3d492f5dd5eb55f6a52f011981527f1fef20c8903873d5291e18da782fa848cac11d1f608ebb462ad9f6eef0ae00bd6020808301919091529083528151608080820184527f0ce31200f558b0b967d1e46c87b19359d114ed91ca42a6b03da22cadaf9a20c18285019081527f222e74ebfd2f71a21ff6daf32d81a2531cd5034295cb7b6576d35d34a13a0213606080850191909152908352845180860186527f158aaf2b35114932d2a9e43691006c03534238d9c96e6f8f98fbc67a3a1679d381527f121b8bf8d7f71a4ea7b92606499fa8b069f0555db10f9698afdc3d1ed0f8b2a9818601528385015285840192909252835180820185527f2ef542277ceaba03403474f9dd470f33623c1f1ad9d763dcc8ab2a42b5dc7ade8186019081527f13321cd86c90515779531491bef7dd4893e82d5cdc89c5b649392d9d53e1ffd2828501528152845180860186527f12f0901e6c11352616e3767cb9daa861732d04e18eba8b1d02971034d99b99da81527f105a2141c628aaa34a646fe0acbb703e1f6dbeca6c46ec15fb54d71d9cb87c70818601528185015285850152835190810184527f0b16d0bf4a4f184c217eac98caffc091e6ffa86afaae21f577d7ca8b88e5f31e8185019081527f1a45e7a18cf51f1216e9d1a3183485369f113df91650f17e12ef6edbe6260754828401528152835180850185527f220803acaa74db55bc7a519941ac10afbd31ffad8347527697db2de6fee9186181527f04908f78ce131c4442fb9f0e66faaff84eff93eeb7ae745d99ff3ebaa385d9588185015281840152908401528151600580825260c08201909352919082015b60408051808201909152600080825260208201528152602001906001900390816104d457505060808201908152604080518082019091527f264999f6cb4c4a2cdf07866877d69ea94c1d5b0053366451afdfab2c80ba033181527f0986e2b51c59176e19b5ce0ed76cedd88ff1d0007dc15ffdc3ac5b326f4fda6b602082015290518051600090610567576105676110fc565b602002602001018190525060405180604001604052807f260d2dd6ef29cf3d79a117e7cd05d7a5068e04238b1bfe4e37c3097256abf98081526020017f1dd243eefc411f2bf0c39b6ca1e3fe41a5db0f2e133e6286de898bb2bf34174581525081608001516001815181106105de576105de6110fc565b602002602001018190525060405180604001604052807f1e7473cdc5977cc5ff5890e207368596fc592b30bf16a0c6c7ad4df545b3ffd981526020017f1459b5314ec612a40dbeffdade8b176803d811f3b8f65ad174d2c4c0881e081c8152508160800151600281518110610655576106556110fc565b602002602001018190525060405180604001604052807f228673df42305c669af4389f09c3b55cb38a32d6eecc4596960af693b9a9d4f381526020017f2ffc4e1cbb82834a819891f5da241d67930e5ede57cd3b2e7b2adfd444b650d081525081608001516003815181106106cc576106cc6110fc565b602002602001018190525060405180604001604052807f2de57a284b8716de7fd08472c865bbf1f85de0406d53d959d0a9ae499486974a81526020017f0d8e181a6e462bd7dc59cc31baef1e3619a321181fa8637f4f93a4907d3a5f4d8152508160800151600481518110610743576107436110fc565b602002602001018190525090565b604080518082019091526000808252602082015261076d610d6a565b835181526020808501519082015260408101839052600060608360808460076107d05a03fa90508080156107a0576107a2565bfe5b50806107ad57600080fd5b505092915050565b60408051808201909152600080825260208201526107d1610d88565b8351815260208085015181830152835160408301528301516060808301919091526000908360c08460066107d05a03fa90508080156107a0576107a2565b604080518082019091526000808252602082015281517f30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd479015801561085657506020830151155b156108765750506040805180820190915260008082526020820152919050565b60405180604001604052808460000151815260200182856020015161089b91906110c4565b6108a59084611092565b90529392505050565b60408051600480825260a08201909252600091829190816020015b60408051808201909152600080825260208201528152602001906001900390816108c957505060408051600480825260a0820190925291925060009190602082015b610913610da6565b81526020019060019003908161090b5790505090508a8260008151811061093c5761093c6110fc565b6020026020010181905250888260018151811061095b5761095b6110fc565b6020026020010181905250868260028151811061097a5761097a6110fc565b60200260200101819052508482600381518110610999576109996110fc565b602002602001018190525089816000815181106109b8576109b86110fc565b602002602001018190525087816001815181106109d7576109d76110fc565b602002602001018190525085816002815181106109f6576109f66110fc565b60200260200101819052508381600381518110610a1557610a156110fc565b6020026020010181905250610a2a8282610a39565b9b9a5050505050505050505050565b60008151835114610a4957600080fd5b82516000610a58826006611073565b905060008167ffffffffffffffff811115610a7557610a75611112565b604051908082528060200260200182016040528015610a9e578160200160208202803683370190505b50905060005b83811015610cd957868181518110610abe57610abe6110fc565b60200260200101516000015182826006610ad89190611073565b610ae390600061105b565b81518110610af357610af36110fc565b602002602001018181525050868181518110610b1157610b116110fc565b60200260200101516020015182826006610b2b9190611073565b610b3690600161105b565b81518110610b4657610b466110fc565b602002602001018181525050858181518110610b6457610b646110fc565b60209081029190910181015151015182610b7f836006611073565b610b8a90600261105b565b81518110610b9a57610b9a6110fc565b602002602001018181525050858181518110610bb857610bb86110fc565b6020908102919091010151515182610bd1836006611073565b610bdc90600361105b565b81518110610bec57610bec6110fc565b602002602001018181525050858181518110610c0a57610c0a6110fc565b602002602001015160200151600160028110610c2857610c286110fc565b602002015182610c39836006611073565b610c4490600461105b565b81518110610c5457610c546110fc565b602002602001018181525050858181518110610c7257610c726110fc565b602002602001015160200151600060028110610c9057610c906110fc565b602002015182610ca1836006611073565b610cac90600561105b565b81518110610cbc57610cbc6110fc565b602090810291909101015280610cd1816110a9565b915050610aa4565b50610ce2610dcb565b6000602082602086026020860160086107d05a03fa90508080156107a0575080610d0b57600080fd5b505115159695505050505050565b6040805160e08101909152600060a0820181815260c0830191909152815260208101610d43610da6565b8152602001610d50610da6565b8152602001610d5d610da6565b8152602001606081525090565b60405180606001604052806003906020820280368337509192915050565b60405180608001604052806004906020820280368337509192915050565b6040518060400160405280610db9610de9565b8152602001610dc6610de9565b905290565b60405180602001604052806001906020820280368337509192915050565b60405180604001604052806002906020820280368337509192915050565b600082601f830112610e1857600080fd5b610e2061100f565b808385604086011115610e3257600080fd5b60005b6002811015610e54578135845260209384019390910190600101610e35565b509095945050505050565b600082601f830112610e7057600080fd5b8135602067ffffffffffffffff80831115610e8d57610e8d611112565b8260051b604051601f19603f83011681018181108482111715610eb257610eb2611112565b60405284815283810192508684018288018501891015610ed157600080fd5b600092505b85831015610ef4578035845292840192600192909201918401610ed6565b50979650505050505050565b600060408284031215610f1257600080fd5b6040516040810181811067ffffffffffffffff82111715610f3557610f35611112565b604052823581526020928301359281019290925250919050565b600080828403610120811215610f6457600080fd5b61010080821215610f7457600080fd5b610f7c611038565b610f868787610f00565b81526080603f1984011215610f9a57600080fd5b610fa261100f565b9250610fb18760408801610e07565b8352610fc08760808801610e07565b6020840152826020820152610fd88760c08801610f00565b60408201529350840135905067ffffffffffffffff811115610ff957600080fd5b61100585828601610e5f565b9150509250929050565b6040805190810167ffffffffffffffff8111828210171561103257611032611112565b60405290565b6040516060810167ffffffffffffffff8111828210171561103257611032611112565b6000821982111561106e5761106e6110e6565b500190565b600081600019048311821515161561108d5761108d6110e6565b500290565b6000828210156110a4576110a46110e6565b500390565b60006000198214156110bd576110bd6110e6565b5060010190565b6000826110e157634e487b7160e01b600052601260045260246000fd5b500690565b634e487b7160e01b600052601160045260246000fd5b634e487b7160e01b600052603260045260246000fd5b634e487b7160e01b600052604160045260246000fdfea2646970667358221220fe505678a4080fe6daa34f7ec3028a75f9ad425efbdb58a235b2210b5e0c2d5964736f6c63430008070033';

type Rollup1VerifierConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: Rollup1VerifierConstructorParams,
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class Rollup1Verifier__factory extends ContractFactory {
  constructor(...args: Rollup1VerifierConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = 'Rollup1Verifier';
  }

  deploy(overrides?: Overrides & { from?: string | Promise<string> }): Promise<Rollup1Verifier> {
    return super.deploy(overrides || {}) as Promise<Rollup1Verifier>;
  }
  getDeployTransaction(overrides?: Overrides & { from?: string | Promise<string> }): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): Rollup1Verifier {
    return super.attach(address) as Rollup1Verifier;
  }
  connect(signer: Signer): Rollup1Verifier__factory {
    return super.connect(signer) as Rollup1Verifier__factory;
  }
  static readonly contractName: 'Rollup1Verifier';
  public readonly contractName: 'Rollup1Verifier';
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): Rollup1VerifierInterface {
    return new utils.Interface(_abi) as Rollup1VerifierInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): Rollup1Verifier {
    return new Contract(address, _abi, signerOrProvider) as Rollup1Verifier;
  }
}