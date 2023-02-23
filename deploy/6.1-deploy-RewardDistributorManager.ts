import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { ContractId } from "../helpers/types"
import { deployAndInitUUPSProxy } from '../helpers/contracts';


const deployRewardDistributorManager: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments: { deploy, get }, getNamedAccounts } = hre;
    const { deployer, blackSmithTeam } = await getNamedAccounts();

    const managerTx = await deploy(ContractId.RewardDistributorManager, {
        from: deployer,
        args: [],
        log: true,
        deterministicDeployment: true
    });

    if (process.env.WITH_PROXY) await deployAndInitUUPSProxy(
        ContractId.RewardDistributorManagerProxy,
        managerTx.address
    )
}

export default deployRewardDistributorManager
deployRewardDistributorManager.tags = [`${ContractId.RewardDistributorManager}`]