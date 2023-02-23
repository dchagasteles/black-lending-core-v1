import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { ContractId } from "../helpers/types"

const deployLendingPairFactory: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments: { deploy, get }, getNamedAccounts } = hre;
    const { deployer, blackSmithTeam } = await getNamedAccounts();

    const lendingPairImplementation = await get(ContractId.LendingPair)
    const debtTokenImplementation = await get(ContractId.DebtToken)
    const collateralWrapperImplementation = await get(ContractId.CollateralWrapperToken)
    const borrowWrapperImpl = await get(ContractId.WrapperToken)
    const rewardDistributorManager = !!process.env.WITH_PROXY ? await get(ContractId.RewardDistributorManagerProxy): await get(ContractId.RewardDistributorManager)

    await deploy(ContractId.LendingPairFactory, {
      from: deployer,
      args: [
        blackSmithTeam,
        lendingPairImplementation.address,
        collateralWrapperImplementation.address,
        debtTokenImplementation.address,
        borrowWrapperImpl.address,
        rewardDistributorManager.address
      ],
      log: true,
      deterministicDeployment: true
    });
}

export default deployLendingPairFactory
deployLendingPairFactory.tags = [ContractId.LendingPairFactory]
deployLendingPairFactory.dependencies = [
  ContractId.LendingPair,
  ContractId.DebtToken,
  ContractId.CollateralWrapperToken,
  ContractId.WrapperToken,
  ContractId.RewardDistributorManager
]
