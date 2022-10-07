import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ContractId } from "../helpers/types";
import { BigNumber } from "@ethersproject/bignumber";

const deployJumpRateModelV2: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy },
    getNamedAccounts,
    getChainId,
  } = hre;
  const { deployer } = await getNamedAccounts();

  const chainId = await getChainId();
  if (chainId === "1") {
    // do not deploy in production
    return;
  }

  const testEnvParams = [
    "30000000000000000",
    "52222222222200000",
    "70",
    "1000000000000000000",
    deployer,
    BigNumber.from(5).mul(BigNumber.from(10).pow(13)).toString(),
    2102400, // blocks per year
  ];

  await deploy(ContractId.JumpRateModelV2, {
    from: deployer,
    args: [...testEnvParams],
    log: true,
    deterministicDeployment: true,
  });
};

export default deployJumpRateModelV2;
deployJumpRateModelV2.tags = [ContractId.JumpRateModelV2];
