import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { 
    defaultLendingPairInitVars,
    deployTestTokensAndMock,
    makeLendingPairTestSuiteVars,
    setupLendingPair
} from '../test/lib';

const tag = `DEV_ENVIRONMENT`

const deployDevEnvironment: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // do not deploy in production
    if (!process.env.DEPLOY_DEV_ENV) return
    
    const { deployments: { deploy, get }, getNamedAccounts, ethers } = hre;
    const { deployer, blackSmithTeam } = await getNamedAccounts();
    const [ admin, bob, frank ] = await ethers.getSigners()

    const testEnvVars = await deployTestTokensAndMock()
    const vars = await makeLendingPairTestSuiteVars(testEnvVars);

    await setupLendingPair(
        vars.LendingPair,
        testEnvVars.CollateralAsset,
        testEnvVars.BorrowAsset,
        vars.BorrowWrapperToken,
        vars.CollateralWrapperToken,
        vars.DebtToken,
        vars.RewardDistributorManager
    )

    // initialize lending pair
    await vars.LendingPair.initialize(
        "Test",
        "TST",
        testEnvVars.BorrowAsset.address,
        testEnvVars.CollateralAsset.address,
        {
         ...defaultLendingPairInitVars,
          wrappedBorrowAsset: vars.BorrowWrapperToken.address,
          debtToken: vars.DebtToken.address
        },
        vars.CollateralWrapperToken.address,
        vars.InterestRateModel.address,
        admin.address
    );

    console.log("\n\n\n")
    console.log("========================= dev environment deploy ================================")
    console.log(`Vault: ${vars.Vault.address}`)
    console.log(`VaultFactory: ${vars.VaultFactory.address}`)
    console.log(`LendingPairFactory: ${vars.LendingPairFactory.address}`)
    console.log(`LendingPairHelper: ${vars.LendingPairHelper.address}`)
    console.log(`LendingPair: ${vars.LendingPair.address}`)
    console.log(`   DebtToken: ${vars.DebtToken.address}`)
    console.log(`   CollateralToken: ${testEnvVars.CollateralAsset.address}`)
    console.log(`   BorrowToken: ${testEnvVars.BorrowAsset.address}`)
    console.log(`   CollateralWrapperToken: ${vars.CollateralWrapperToken.address}`)
    console.log(`   BorrowWrapperToken: ${vars.BorrowWrapperToken.address}`)
    console.log(`   PriceOracleAggregator: ${vars.PriceOracleAggregator.address}`)
    console.log(`   InterestRateModel: ${vars.InterestRateModel.address}`)
    console.log("=================================================================================")
    console.log("\n")

}

export default deployDevEnvironment
deployDevEnvironment.tags = [`${tag}`]
deployDevEnvironment.runAtTheEnd = true;