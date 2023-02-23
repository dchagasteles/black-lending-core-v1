import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { ContractId, EthereumAddress } from "../helpers/types"
import { BigNumber } from '@ethersproject/bignumber';

const deployJumpRateModelV2: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments: { deploy }, getNamedAccounts } = hre;
  const { deployer, blackSmithTeam } = await getNamedAccounts();
  
  // do not deploy in production
  // if (!process.env.DEPLOY_DEV_ENV) return
  const testEnvParams = [
    "30000000000000000",
    "52222222222200000",
    "70",
    "1000000000000000000",
    deployer,
    BigNumber.from(5).mul(BigNumber.from(10).pow(13)).toString(),
    2102400 // blocks per year
  ]

  await deploy(ContractId.JumpRateModelV2, {
    from: deployer,
    args: [
      ...testEnvParams
    ],
    log: true,
    deterministicDeployment: true
  });

};

export default deployJumpRateModelV2
deployJumpRateModelV2.tags = [ContractId.JumpRateModelV2]
