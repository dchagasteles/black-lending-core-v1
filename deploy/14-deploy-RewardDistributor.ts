import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { ContractId } from "../helpers/types"


const deployRewardDistributor: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments: { deploy, get }, getNamedAccounts } = hre;
    const { deployer, blackSmithTeam } = await getNamedAccounts();

    const managerImplementation = await get(ContractId.RewardDistributorManager)

    await deploy(ContractId.RewardDistributor, {
        from: deployer,
        args: [
            managerImplementation.address,
        ],
        log: true
    });
}

export default deployRewardDistributor
deployRewardDistributor.tags = [`${ContractId.RewardDistributor}`]
deployRewardDistributor.dependencies = [`${ContractId.RewardDistributorManager}`]