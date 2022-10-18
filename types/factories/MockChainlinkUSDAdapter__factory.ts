/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";

import type { MockChainlinkUSDAdapter } from "../MockChainlinkUSDAdapter";

export class MockChainlinkUSDAdapter__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<MockChainlinkUSDAdapter> {
    return super.deploy(overrides || {}) as Promise<MockChainlinkUSDAdapter>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): MockChainlinkUSDAdapter {
    return super.attach(address) as MockChainlinkUSDAdapter;
  }
  connect(signer: Signer): MockChainlinkUSDAdapter__factory {
    return super.connect(signer) as MockChainlinkUSDAdapter__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): MockChainlinkUSDAdapter {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as MockChainlinkUSDAdapter;
  }
}

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newPrice",
        type: "uint256",
      },
    ],
    name: "PriceUpdated",
    type: "event",
  },
  {
    inputs: [],
    name: "latestAnswer",
    outputs: [
      {
        internalType: "int256",
        name: "price",
        type: "int256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "viewPriceInUSD",
    outputs: [
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
];

const _bytecode =
  "0x6080604052348015600f57600080fd5b5060988061001e6000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c806350d25bcd146037578063f55fa17f146037575b600080fd5b603d6051565b604051604891906059565b60405180910390f35b6305f5e10090565b9081526020019056fea2646970667358221220c25a9a9d36e5b282784cfbb1b9d12c29ae1894140329f6ad3f5dd821eb6804f964736f6c63430008010033";