import  hre from 'hardhat';
import { ethers } from "hardhat"
import { ContractId } from '../helpers/types';
import { expect } from "chai"

async function main() {
    const { deployments: { get,log } } = hre
    // get the proxy and vault deployments
    const vaultProxy = await get(ContractId.UUPSProxy)
    const vaultImpl = await get(ContractId.Vault)

    const proxy = await ethers.getContractAt(ContractId.UUPSProxy, vaultProxy.address)
    const vault = await ethers.getContractAt(ContractId.Vault, vaultImpl.address)
    const proxiable = await ethers.getContractAt(ContractId.UUPSProxiable, vaultProxy.address)
    
    // initialize proxy
    const receipt = await (await proxy.initializeProxy(vault.address)).wait()

    log(`Successfully InitializedProxy`)
    log(`Transaction Hash: ${receipt.transactionHash}`)
    log(`Proxy: ${proxy.address}`)
    
    // assert that uups proxy has correct implementation
    expect(await proxiable.getCodeAddress()).to.eq(vault.address)
    
    log(`Vault Implementation: ${await proxiable.getCodeAddress()} `)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

