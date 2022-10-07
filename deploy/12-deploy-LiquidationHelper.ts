import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { ContractId } from "../helpers/types";

const deployLiquidationHelper: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy, get },
    getNamedAccounts,
    getChainId,
  } = hre;

  let AaveV2LendingPoolAddressProvider;
  let BalancerV2Vault;

  const chainId = await getChainId();
  if (chainId === "1") {
    AaveV2LendingPoolAddressProvider = "0xb53c1a33016b2dc2ff3653530bff1848a515c8c5";
    BalancerV2Vault = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";
  } else if (chainId === "42") {
    AaveV2LendingPoolAddressProvider = "0xd69C16706F6Fa8d3A8329B0b48C208745740fD86"; // mock
    BalancerV2Vault = "0xac3e94cc094d20c801935b40b7efa0f93e3ec4c4"; // mock
  } else {
    return;
  }

  const useProxy = !!process.env.WITH_PROXY;
  const warpVault = useProxy ? await get(ContractId.VaultProxy) : await get(ContractId.Vault);

  const { deployer } = await getNamedAccounts();

  console.log(AaveV2LendingPoolAddressProvider, BalancerV2Vault, warpVault.address);

  await deploy(ContractId.LiquidationHelper, {
    from: deployer,
    args: [AaveV2LendingPoolAddressProvider, BalancerV2Vault, warpVault.address],
    log: true,
    deterministicDeployment: true,
  });
};

export default deployLiquidationHelper;
deployLiquidationHelper.tags = [`${ContractId.LiquidationHelper}`];
