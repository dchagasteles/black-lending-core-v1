import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { ContractId, EthereumAddress } from "../helpers/types"

const deployDebtToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments: { deploy }, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

  await deploy(ContractId.DebtToken, {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: true
  });

};

export default deployDebtToken
deployDebtToken.tags = [ContractId.DebtToken]
