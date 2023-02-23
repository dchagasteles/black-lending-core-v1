import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ContractId } from "../helpers/types";

const deployLiquidationHelper: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy, get },
    getNamedAccounts,
    getChainId,
  } = hre;

  // only work on mainnet
  const chainId = await getChainId();
  if (chainId !== "1") return;

  const { deployer } = await getNamedAccounts();

  // mainnet Aavae & Balancer contract addresses
  const AaveV2LendingPoolAddressProvider = "0xb53c1a33016b2dc2ff3653530bff1848a515c8c5";
  const BalancerV2Vault = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";
  const warpVault = await get(ContractId.Vault);

  await deploy(ContractId.LiquidationHelper, {
    from: deployer,
    args: [AaveV2LendingPoolAddressProvider, BalancerV2Vault, warpVault.address],
    log: true,
    deterministicDeployment: true,
  });
};

export default deployLiquidationHelper;
deployLiquidationHelper.tags = [`${ContractId.LiquidationHelper}`];
