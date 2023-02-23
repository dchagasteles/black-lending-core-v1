import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { ContractId, EthereumAddress } from "../helpers/types"

const deployWrapperToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments: { deploy }, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

  await deploy(ContractId.CollateralWrapperToken, {
    from: deployer,
    args: [],
    log: true,
  });

};

export default deployWrapperToken
deployWrapperToken.tags = [ContractId.CollateralWrapperToken]
