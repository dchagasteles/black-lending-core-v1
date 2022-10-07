import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
  defaultLendingPairInitVars,
  deployTestTokensAndMock,
  makeLendingPairTestSuiteVars,
  setupLendingPair,
} from "../test/lib";

const tag = `DEV_ENVIRONMENT`;

const deployDevEnvironment: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy, get },
    getNamedAccounts,
    getChainId,
    ethers,
  } = hre;

  // do not deploy in production
  if (!process.env.DEPLOY_DEV_ENV) return;

  const { deployer, blackSmithTeam } = await getNamedAccounts();
  const [admin, bob, frank] = await ethers.getSigners();

  let vars: any = { accounts: [admin, bob, frank], blackSmithTeam: { address: blackSmithTeam } };

  const testTokensAndMockVars = await deployTestTokensAndMock();
  Object.assign(vars, testTokensAndMockVars);

  const lendingPairTestSuiteVars = await makeLendingPairTestSuiteVars(vars);
  Object.assign(vars, lendingPairTestSuiteVars);

  await setupLendingPair(
    vars.LendingPair,
    vars.CollateralAsset,
    vars.BorrowAsset,
    vars.BorrowWrapperToken,
    vars.CollateralWrapperToken,
    vars.DebtToken,
    vars.RewardDistributorManager
  );

  // initialize lending pair
  await vars.LendingPair.initialize(
    {
      name: "Test",
      symbol: "TST",
      asset: vars.BorrowAsset.address,
      collateralAsset: vars.CollateralAsset.address,
      guardian: admin.address,
    },
    {
      ...defaultLendingPairInitVars,
      wrappedBorrowAsset: vars.BorrowWrapperToken.address,
      debtToken: vars.DebtToken.address,
    },
    vars.CollateralWrapperToken.address,
    vars.InterestRateModel.address,
    {
      depositCollateralLimit: 0,
      depositBorrowLimit: 0,
      totalPairDebtLimit: 0,
    }
  );

  console.log("\n\n\n");
  console.log("========================= dev environment deploy ================================");
  console.log(`Vault: ${vars.Vault.address}`);
  console.log(`VaultFactory: ${vars.VaultFactory.address}`);
  console.log(`LendingPairFactory: ${vars.LendingPairFactory.address}`);
  console.log(`LendingPairHelper: ${vars.LendingPairHelper.address}`);
  console.log(`LendingPair: ${vars.LendingPair.address}`);
  console.log(`   DebtToken: ${vars.DebtToken.address}`);
  console.log(`   CollateralToken: ${vars.CollateralAsset.address}`);
  console.log(`   BorrowToken: ${vars.BorrowAsset.address}`);
  console.log(`   CollateralWrapperToken: ${vars.CollateralWrapperToken.address}`);
  console.log(`   BorrowWrapperToken: ${vars.BorrowWrapperToken.address}`);
  console.log(`   PriceOracleAggregator: ${vars.PriceOracleAggregator.address}`);
  console.log(`   InterestRateModel: ${vars.InterestRateModel.address}`);
  console.log("=================================================================================");
  console.log("\n");
};

export default deployDevEnvironment;
deployDevEnvironment.tags = [`${tag}`];
// deployDevEnvironment.runAtTheEnd = true;
