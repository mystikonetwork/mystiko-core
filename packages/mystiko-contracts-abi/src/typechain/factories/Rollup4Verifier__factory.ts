/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from 'ethers';
import { Provider, TransactionRequest } from '@ethersproject/providers';
import type { Rollup4Verifier, Rollup4VerifierInterface } from '../Rollup4Verifier';

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
            internalType: 'struct Rollup4Pairing.G1Point',
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
            internalType: 'struct Rollup4Pairing.G2Point',
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
            internalType: 'struct Rollup4Pairing.G1Point',
            name: 'c',
            type: 'tuple',
          },
        ],
        internalType: 'struct Rollup4Verifier.Proof',
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
  '0x608060405234801561001057600080fd5b5061115d806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063c941764714610030575b600080fd5b61004361003e366004610f4e565b610057565b604051901515815260200160405180910390f35b600081516004146100ae5760405162461bcd60e51b815260206004820152601460248201527f696e76616c696420696e707574206c656e677468000000000000000000000000604482015260640160405180910390fd5b6100b882846100ce565b6100c4575060016100c8565b5060005b92915050565b60007f30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001816100fa610251565b905080608001515185516001610110919061105a565b1461011a57600080fd5b604080518082019091526000808252602082018190525b86518110156101c8578387828151811061014d5761014d6110fb565b60200260200101511061015f57600080fd5b6101b4826101af8560800151846001610178919061105a565b81518110610188576101886110fb565b60200260200101518a85815181106101a2576101a26110fb565b6020026020010151610750565b6107b4565b9150806101c0816110a8565b915050610131565b506101f18183608001516000815181106101e4576101e46110fb565b60200260200101516107b4565b9050610235856000015186602001516102098461080e565b856040015161021b8a6040015161080e565b6060880151885161022b9061080e565b89602001516108ad565b61024557600193505050506100c8565b50600095945050505050565b610259610d18565b6040805180820182527f1580bcd09fdfda69480d5389a6bda4791a4abba58a3786cdf43cf38c4aebd2f681527f276286a69866ae2802069a78fa1105780a95e03363af6fcdfd8090c72a4cc3396020808301919091529083528151608080820184527f2d4d1b4dde7a55a6a40970f2616cd9768e11002c497d28cacc747cb724a8ad5e8285019081527f2c751a31268c5281b10bd5f539bfe696e23f59618d523bd5c22edf3bdec29a3d606080850191909152908352845180860186527f033dae0485443b344275a226a92dd1266d5356fedd97ab342e03fe80fc82d3c081527f2729405948ff151ac7b6522f280417748bce3b8b6889d62e94ddbb169b4187b2818601528385015285840192909252835180820185527f0f68be9a281ab95764a4084a051dfc86db6312ee5eeeaa4a5e45183da8bbbfb58186019081527f02c152527562832f7892b17089f3af834be76a0693b0bb616fd6daff0cb6d327828501528152845180860186527f0a677b625ca403f3300198b450dc851b92729636d9cc20f444fd775e1576972081527f106df3c4ecd4d4f3c9f1968069ee2a960767c3eaed3e927164a427d5502e930f818601528185015285850152835190810184527f184353db032b5c89e718343b308471df862708461bbabdf06f8dbf30d0713b1e8185019081527e2853319478313f0d49a60b738e9903fb9d332ca0cad2844ffa8fda48564f18828401528152835180850185527f299ca633fd54d3c70af9f5ef99a94b959015de23fdfe2ed2d1233ae2d1249f2981527f12d5a9b81c64184cedf1f155fc1dc31445a9565f9da662454e49cd015066b29f8185015281840152908401528151600580825260c08201909352919082015b60408051808201909152600080825260208201528152602001906001900390816104d357505060808201908152604080518082019091527f2de9ce78fa530c4366b1209c0cf1b0f5ec40a01aa7ea05c08a6482c237a6dc2c81527f227cb0dc9c4558e89403f157b1e19a7cc696f6bbba6f7ddb22fcfbdeb4bca8a4602082015290518051600090610566576105666110fb565b602002602001018190525060405180604001604052807f29a9a9d3f057e4bc51fba306cf731651f80d98cc7d21183c8ebf248b0cdc80cd81526020017f126ea5f4f2e8170706bde6ce6a39dd09c528d015fed8400514739aa7c76d190f81525081608001516001815181106105dd576105dd6110fb565b602002602001018190525060405180604001604052807f169156adee136df7e05239577ea15f13038e2b23b57f7a72a0acc947c602f5de81526020017f08f724c6c21a77d6c5498ec4a8e616275d8907932a7a1ae76eb55f69fad506038152508160800151600281518110610654576106546110fb565b602002602001018190525060405180604001604052807f0ddb47f9ea85238133cb90432746cfd5571de68df39c404d55652784a76b825181526020017f19ed8c55723a2306f1b944abd5f7e789e76125d8afcae603884e0e6890f2b64081525081608001516003815181106106cb576106cb6110fb565b602002602001018190525060405180604001604052807f05144bfd2254000f7b9e72b248de666eef789870e081ca50d05d86e139f52c5881526020017f1879b882bbe4680c0983b9ef4349706a5de35d0c054baf75ffb036d85b9b69648152508160800151600481518110610742576107426110fb565b602002602001018190525090565b604080518082019091526000808252602082015261076c610d69565b835181526020808501519082015260408101839052600060608360808460076107d05a03fa905080801561079f576107a1565bfe5b50806107ac57600080fd5b505092915050565b60408051808201909152600080825260208201526107d0610d87565b8351815260208085015181830152835160408301528301516060808301919091526000908360c08460066107d05a03fa905080801561079f576107a1565b604080518082019091526000808252602082015281517f30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd479015801561085557506020830151155b156108755750506040805180820190915260008082526020820152919050565b60405180604001604052808460000151815260200182856020015161089a91906110c3565b6108a49084611091565b90529392505050565b60408051600480825260a08201909252600091829190816020015b60408051808201909152600080825260208201528152602001906001900390816108c857505060408051600480825260a0820190925291925060009190602082015b610912610da5565b81526020019060019003908161090a5790505090508a8260008151811061093b5761093b6110fb565b6020026020010181905250888260018151811061095a5761095a6110fb565b60200260200101819052508682600281518110610979576109796110fb565b60200260200101819052508482600381518110610998576109986110fb565b602002602001018190525089816000815181106109b7576109b76110fb565b602002602001018190525087816001815181106109d6576109d66110fb565b602002602001018190525085816002815181106109f5576109f56110fb565b60200260200101819052508381600381518110610a1457610a146110fb565b6020026020010181905250610a298282610a38565b9b9a5050505050505050505050565b60008151835114610a4857600080fd5b82516000610a57826006611072565b905060008167ffffffffffffffff811115610a7457610a74611111565b604051908082528060200260200182016040528015610a9d578160200160208202803683370190505b50905060005b83811015610cd857868181518110610abd57610abd6110fb565b60200260200101516000015182826006610ad79190611072565b610ae290600061105a565b81518110610af257610af26110fb565b602002602001018181525050868181518110610b1057610b106110fb565b60200260200101516020015182826006610b2a9190611072565b610b3590600161105a565b81518110610b4557610b456110fb565b602002602001018181525050858181518110610b6357610b636110fb565b60209081029190910181015151015182610b7e836006611072565b610b8990600261105a565b81518110610b9957610b996110fb565b602002602001018181525050858181518110610bb757610bb76110fb565b6020908102919091010151515182610bd0836006611072565b610bdb90600361105a565b81518110610beb57610beb6110fb565b602002602001018181525050858181518110610c0957610c096110fb565b602002602001015160200151600160028110610c2757610c276110fb565b602002015182610c38836006611072565b610c4390600461105a565b81518110610c5357610c536110fb565b602002602001018181525050858181518110610c7157610c716110fb565b602002602001015160200151600060028110610c8f57610c8f6110fb565b602002015182610ca0836006611072565b610cab90600561105a565b81518110610cbb57610cbb6110fb565b602090810291909101015280610cd0816110a8565b915050610aa3565b50610ce1610dca565b6000602082602086026020860160086107d05a03fa905080801561079f575080610d0a57600080fd5b505115159695505050505050565b6040805160e08101909152600060a0820181815260c0830191909152815260208101610d42610da5565b8152602001610d4f610da5565b8152602001610d5c610da5565b8152602001606081525090565b60405180606001604052806003906020820280368337509192915050565b60405180608001604052806004906020820280368337509192915050565b6040518060400160405280610db8610de8565b8152602001610dc5610de8565b905290565b60405180602001604052806001906020820280368337509192915050565b60405180604001604052806002906020820280368337509192915050565b600082601f830112610e1757600080fd5b610e1f61100e565b808385604086011115610e3157600080fd5b60005b6002811015610e53578135845260209384019390910190600101610e34565b509095945050505050565b600082601f830112610e6f57600080fd5b8135602067ffffffffffffffff80831115610e8c57610e8c611111565b8260051b604051601f19603f83011681018181108482111715610eb157610eb1611111565b60405284815283810192508684018288018501891015610ed057600080fd5b600092505b85831015610ef3578035845292840192600192909201918401610ed5565b50979650505050505050565b600060408284031215610f1157600080fd5b6040516040810181811067ffffffffffffffff82111715610f3457610f34611111565b604052823581526020928301359281019290925250919050565b600080828403610120811215610f6357600080fd5b61010080821215610f7357600080fd5b610f7b611037565b610f858787610eff565b81526080603f1984011215610f9957600080fd5b610fa161100e565b9250610fb08760408801610e06565b8352610fbf8760808801610e06565b6020840152826020820152610fd78760c08801610eff565b60408201529350840135905067ffffffffffffffff811115610ff857600080fd5b61100485828601610e5e565b9150509250929050565b6040805190810167ffffffffffffffff8111828210171561103157611031611111565b60405290565b6040516060810167ffffffffffffffff8111828210171561103157611031611111565b6000821982111561106d5761106d6110e5565b500190565b600081600019048311821515161561108c5761108c6110e5565b500290565b6000828210156110a3576110a36110e5565b500390565b60006000198214156110bc576110bc6110e5565b5060010190565b6000826110e057634e487b7160e01b600052601260045260246000fd5b500690565b634e487b7160e01b600052601160045260246000fd5b634e487b7160e01b600052603260045260246000fd5b634e487b7160e01b600052604160045260246000fdfea2646970667358221220ca63dc0141922d1dc44c890f4801e5c84128014e71f0cc382d66297c243f9e6164736f6c63430008070033';

type Rollup4VerifierConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: Rollup4VerifierConstructorParams,
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class Rollup4Verifier__factory extends ContractFactory {
  constructor(...args: Rollup4VerifierConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = 'Rollup4Verifier';
  }

  deploy(overrides?: Overrides & { from?: string | Promise<string> }): Promise<Rollup4Verifier> {
    return super.deploy(overrides || {}) as Promise<Rollup4Verifier>;
  }
  getDeployTransaction(overrides?: Overrides & { from?: string | Promise<string> }): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): Rollup4Verifier {
    return super.attach(address) as Rollup4Verifier;
  }
  connect(signer: Signer): Rollup4Verifier__factory {
    return super.connect(signer) as Rollup4Verifier__factory;
  }
  static readonly contractName: 'Rollup4Verifier';
  public readonly contractName: 'Rollup4Verifier';
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): Rollup4VerifierInterface {
    return new utils.Interface(_abi) as Rollup4VerifierInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): Rollup4Verifier {
    return new Contract(address, _abi, signerOrProvider) as Rollup4Verifier;
  }
}