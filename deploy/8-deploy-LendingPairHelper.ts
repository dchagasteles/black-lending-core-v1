import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { ContractId } from "../helpers/types"

const deployLendingPairHelper: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments: { deploy, get }, getNamedAccounts } = hre;
    const { deployer } = await getNamedAccounts();
    // @TODO update to vault proxy
    // check if mainnet or testsnet and use vault proxy
    // instead
    const vault = await get(ContractId.Vault)

    await deploy(ContractId.LendingPairHelper, {
        from: deployer,
        args: [
            vault.address
        ],
        log: true,
        deterministicDeployment: true
    });
}

export default deployLendingPairHelper
deployLendingPairHelper.tags = [ContractId.LendingPairHelper]