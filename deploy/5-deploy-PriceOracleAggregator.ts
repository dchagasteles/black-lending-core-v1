import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { ContractId, EthereumAddress } from "../helpers/types"
import { deployAndInitUUPSProxy } from '../helpers/contracts';

const deployPriceOracleAggregator: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments: { deploy }, getNamedAccounts } = hre;
  const { deployer, blackSmithTeam } = await getNamedAccounts();
  
  await deploy(ContractId.PriceOracleAggregator, {
    from: deployer,
    args: [blackSmithTeam],
    log: true,
    deterministicDeployment: true
  });

};

export default deployPriceOracleAggregator
deployPriceOracleAggregator.tags = [ContractId.PriceOracleAggregator]
