import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { ContractId } from "../helpers/types"
import { UUPSProxy, Vault } from '../types';
import { deployAndInitUUPSProxy, getVaultProxy } from '../helpers/contracts';

const deployVault: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments: { deploy, get }, getNamedAccounts, ethers } = hre;
  const { deployer, blackSmithTeam } = await getNamedAccounts();
  const vaultTx = await deploy(ContractId.Vault, {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: true
  });

  // initialize vault proxy
  if (process.env.WITH_PROXY) {
    await deployAndInitUUPSProxy(
      ContractId.VaultProxy,
      vaultTx.address
    )
    // initialize vault
    const vault = await getVaultProxy()
    console.log("==== initializing vault ====")
    // @TODO update
    const tx = await vault.initialize(0, blackSmithTeam)
    console.log(`tx hash: ${tx.hash}`)
    console.log("==== finished vault initializing")
  }

};

export default deployVault
deployVault.tags = [ContractId.Vault]
