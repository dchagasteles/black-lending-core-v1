import { deployments, ethers, waffle, getNamedAccounts } from "hardhat";
import { Signer, Contract, BigNumber } from "ethers"
import { ContractId, EthereumAddress } from "../helpers/types"
import { Vault } from '../types/Vault'
import { 
    CollateralWrapperToken,
    DebtToken,
    IPriceOracleAggregator,
    JumpRateModelV2,
    LendingPair,
    LendingPairFactory,
    MockFlashBorrower,
    MockLendingPair,
    MockPriceOracle,
    MockToken,
    MockVault, PriceOracleAggregator, RewardDistributor, RewardDistributorFactory, RewardDistributorManager, UUPSProxy, VaultFactory, VaultStorageLayoutTester, WrapperToken,
    FeeWithdrawal,
    MockUniswapV2Router02,
    MockVaultUser,
    MockBalancerVault,
    MockAaveLendingPool,
    MockLiquidationHelper,
} from "../types";
import { LendingPairHelper } from "../types/LendingPairHelper";
import { MockChainlinkUSDAdapter } from "../types/MockChainlinkUSDAdapter";

export const deployContract = async<ContractType extends Contract>(
    contractName: string,
    args: any[],
    libraries?: {}
) => {
    const contract = (await (await ethers.getContractFactory(contractName, {
        libraries: {
            ...libraries
        }
    })).deploy(
        ...args
      )) as ContractType;
    
    return contract
}

export const deployAndInitUUPSProxy = async(
    id: string,
    implementation: string
) => {
    const { deployer } = await getNamedAccounts();

    const tx = await deployments.deploy(id, {
        contract: ContractId.UUPSProxy,
        from: deployer,
        args: [],
        log: true,

    })
  
      // initialize proxy
    const uups = await ethers.getContractAt(
        ContractId.UUPSProxy,
        tx.address
    ) as UUPSProxy

    if (tx.newlyDeployed) {
        await (await uups.initializeProxy(implementation)).wait()
        console.log(`Successfully Initialized ${id} proxy`)
    }
}

export const deployVault = async() => {
    return await deployContract<Vault>(ContractId.Vault, [])
}

export const getVaultDeployment = async(): Promise<Vault> =>{
    if (!(await deployments.getOrNull(ContractId.Vault))) {
        // deploy Mock
        return await deployVault();
    }
    return (await ethers.getContractAt(
        ContractId.Vault,
        (await deployments.get(ContractId.Vault)).address
    )) as Vault
}

export const getCollateralWrapperDeployment = async(): Promise<WrapperToken> =>{
    if (!(await deployments.getOrNull(ContractId.CollateralWrapperToken))) {
        // deploy Mock
        return await deployCollateralWrapperToken();
    }
    return (await ethers.getContractAt(
        ContractId.CollateralWrapperToken,
        (await deployments.get(ContractId.CollateralWrapperToken)).address
    )) as WrapperToken
}

export const getBorrowWrapperDeployment = async(): Promise<WrapperToken> =>{
    if (!(await deployments.getOrNull(ContractId.WrapperToken))) {
        // deploy Mock
        return await deployWrappedToken();
    }
    return (await ethers.getContractAt(
        ContractId.WrapperToken,
        (await deployments.get(ContractId.WrapperToken)).address
    )) as WrapperToken
}

export const getDebtTokenDeployment = async(): Promise<DebtToken> =>{
    if (!(await deployments.getOrNull(ContractId.DebtToken))) {
        // deploy Mock
        return await deployDebtToken();
    }
    return (await ethers.getContractAt(
        ContractId.DebtToken,
        (await deployments.get(ContractId.DebtToken)).address
    )) as DebtToken
}

export const getLendingPairHelperDeployment = async(vault?: EthereumAddress): Promise<LendingPairHelper> =>{
    if (vault && !(await deployments.getOrNull(ContractId.LendingPairHelper))) {
        // deploy Mock
        return await deployLendingPairHelper(vault);
    }
    return (await ethers.getContractAt(
        ContractId.LendingPairHelper,
        (await deployments.get(ContractId.LendingPairHelper)).address
    )) as LendingPairHelper
}

export const getLendingPairDeployment = async(
    params: any
): Promise<LendingPair> =>{
    if (!(await deployments.getOrNull(ContractId.LendingPair))) { 
        // deploy mock
        return await deployLendingPair(
            params.vault,
            params.priceOracleAggregator,
            params.feeWithdrawal,
            params.feeShare,
        )
    }
    return (await ethers.getContractAt(
        ContractId.LendingPair,
        (await deployments.get(ContractId.LendingPair)).address
    )) as LendingPair
}

export const getLendingPairFactoryDeployment = async(params?: any): Promise<LendingPairFactory> =>{
    if (!(await deployments.getOrNull(ContractId.LendingPairFactory))) { 
        // deploy mock
        return await deployLendingPairFactory(
            params.admin,
            params.pairLogic,
            params.collateralWrapperLogic,
            params.debtTokenLogic,
            params.borrowAssetWrapperLogic,
            params.rewardDistributorManager
        );
    }

    return (await ethers.getContractAt(
        ContractId.LendingPairFactory,
        (await deployments.get(ContractId.LendingPairFactory)).address
    )) as LendingPairFactory
}

export const getInterestRateModelDeployment = async(
    owner: EthereumAddress
): Promise<JumpRateModelV2> =>{
    if (!(await deployments.getOrNull(ContractId.JumpRateModelV2))) {
        // deploy mock
        return await deployInterestRateModel(
            "30000000000000000",
            "52222222222200000",
            "70",
            "1000000000000000000",
            owner
        );
    }
    return (await ethers.getContractAt(
        ContractId.JumpRateModelV2,
        (await deployments.get(ContractId.JumpRateModelV2)).address
    )) as JumpRateModelV2
}

export const getPriceOracleAggregatorDeployment = async(
    admin?: EthereumAddress
): Promise<IPriceOracleAggregator> =>{
    if (admin && !(await deployments.getOrNull(ContractId.PriceOracleAggregator))) {
        // deploy mock
        return await deployPriceOracleAggregator(admin);
    }
    return (await ethers.getContractAt(
        ContractId.PriceOracleAggregator,
        (await deployments.get(ContractId.PriceOracleAggregator)).address
    )) as IPriceOracleAggregator
}

export const getVaultFactoryDeployment = async(params: any): Promise<VaultFactory> =>{
    if (!(await deployments.getOrNull(ContractId.VaultFactory))) {
        // deploy mock
        return await deployContract<VaultFactory>(
            ContractId.VaultFactory, [
                params.team,
                params.vault
            ]
        )
    }
    return (await ethers.getContractAt(
        ContractId.VaultFactory,
        (await deployments.get(ContractId.VaultFactory)).address
    )) as VaultFactory
}

export const getRewardDistributorDeployment = async(params: any): Promise<RewardDistributor> => {
    if (!(await deployments.getOrNull(ContractId.RewardDistributor))) {
        // deploy mock
        return await deployContract<RewardDistributor>(ContractId.RewardDistributor, [params.manager])
    }
    return (await ethers.getContractAt(
        ContractId.RewardDistributor,
        (await deployments.get(ContractId.RewardDistributor)).address
    )) as RewardDistributor
}

export const getRewardDistributorFactoryDeployment = async(params: any): Promise<RewardDistributorFactory> => {
    if (!(await deployments.getOrNull(ContractId.RewardDistributorFactory))) {
        // deploy mock
        return await deployContract<RewardDistributorFactory>(
            ContractId.RewardDistributorFactory, 
            [
                params.owner,
                params.manager
            ]
        )
    }
    return (await ethers.getContractAt(
        ContractId.RewardDistributorFactory,
        (await deployments.get(ContractId.RewardDistributorFactory)).address
    )) as RewardDistributorFactory
}

export const getRewardDistributorManagerDeployment = async(): Promise<RewardDistributorManager> => {
    if (!(await deployments.getOrNull(ContractId.RewardDistributorManager))) {
        // deploy mock
        return await deployContract<RewardDistributorManager>(ContractId.RewardDistributorManager, [])
    }
    return (await ethers.getContractAt(
        ContractId.RewardDistributorManager,
        (await deployments.get(ContractId.RewardDistributorManager)).address
    )) as RewardDistributorManager
}

export const getFeeWithdrawalDeployment = async(params: any): Promise<FeeWithdrawal> => {
    if (!(await deployments.getOrNull(ContractId.FeeWithdrawal))) {
        // deploy mock
        return await deployFeeWithdrawal(
            params.vault,
            params.receiver,
            params.warpToken,
            params.weth
        );
    }
    return (await ethers.getContractAt(
        ContractId.FeeWithdrawal,
        (await deployments.get(ContractId.FeeWithdrawal)).address
    )) as FeeWithdrawal
}

// export const getPriceOracleAggregatorProxy = async(): Promise<PriceOracleAggregator> => {
//     return (await ethers.getContractAt(
//         ContractId.PriceOracleAggregator,
//         (await deployments.get(ContractId.PriceOracleAggregatorProxy)).address
//     )) as PriceOracleAggregator
// }

export const getVaultProxy = async(): Promise<Vault> => {
    return (await ethers.getContractAt(
        ContractId.Vault,
        (await deployments.get(ContractId.VaultProxy)).address
    )) as Vault
}

export const getFeeWithdrawalProxy = async(): Promise<FeeWithdrawal> => {
    return (await ethers.getContractAt(
        ContractId.FeeWithdrawal,
        (await deployments.get(ContractId.FeeWithdrawalProxy)).address
    )) as FeeWithdrawal
}

export const deployMockToken = async(decimals ?: number) => {
    return await deployContract<MockToken>(ContractId.MockToken, [decimals || 18])
}

export const deployUUPSProxy = async () => {
    return await deployContract<UUPSProxy>(ContractId.UUPSProxy, [])
}

export const deployMockFlashBorrower = async () => {
    return await deployContract<MockFlashBorrower>(ContractId.MockFlashBorrower, [])
}

export const deployMockLendingPair = async () => {
    return await deployContract<MockLendingPair>(ContractId.MockLendingPair, [])
}

export const deployProxiedVault = async(vaultAddress ?: EthereumAddress) => {
    const UUPSProxy = await deployUUPSProxy();
    const pVaultAddress = vaultAddress || (await deployVault()).address
    // initialize proxy
    await UUPSProxy.initializeProxy(pVaultAddress)
    return (await ethers.getContractAt(ContractId.Vault, UUPSProxy.address)) as Vault
}

export const deployWrappedToken = async() => {
    return await deployContract<WrapperToken>(
        ContractId.WrapperToken,
        []
    )
}

export const deployDebtToken = async() => {
    return await deployContract<DebtToken>(
        ContractId.DebtToken,
        []
    )
}

export const deployCollateralWrapperToken = async() => {
    return await deployContract<CollateralWrapperToken>(
        ContractId.CollateralWrapperToken,
        []
    )
}

export const deployMockPriceOracle = async(price: BigNumber) => {
    return await deployContract<MockPriceOracle>(
        ContractId.MockPriceOracle,
        [price.toString()]
    )
}

export const deployInterestRateModel = async (
    baseRatePerYear: string,
    multiplierPerYear: string,
    jumpMultiplierPerYear: string,
    kink: string,
    owner: EthereumAddress
) => {
    return await deployContract<JumpRateModelV2>(
        ContractId.JumpRateModelV2,
        [
            baseRatePerYear,
            multiplierPerYear,
            jumpMultiplierPerYear,
            kink,
            owner,
            BigNumber.from(5).mul(BigNumber.from(10).pow(13)),
            2102400 // blocks per year
        ]
    )
}

export const deployMockVault =  async() => {
    return await deployContract<MockVault>(ContractId.MockVault, [])
}

export const deployLendingPairHelper = async(vault: EthereumAddress) => {
    return await deployContract<LendingPairHelper>(ContractId.LendingPairHelper, [vault])
}

export const deployPriceOracleAggregator = async(admin: EthereumAddress) => {
    return await deployContract<PriceOracleAggregator>(ContractId.PriceOracleAggregator, [admin])
}

export const deployMockChainlinkUSDAdapter = async() => {
    return await deployContract<MockChainlinkUSDAdapter>(ContractId.MockChainlinkUSDAdapter, [])
}

export const deployVaultStorageLayoutTester = async() => {
    return await deployContract<VaultStorageLayoutTester>(ContractId.VaultStorageLayoutTester, [])
}

export const deployLendingPairFactory = async(
    admin: EthereumAddress,
    pairLogic: EthereumAddress,
    collateralWrapperLogic: EthereumAddress,
    debtTokenLogic: EthereumAddress,
    borrowAssetWrapperLogic: EthereumAddress,
    rewardDistributorManager: EthereumAddress,
) => {
    return await deployContract<LendingPairFactory>(ContractId.LendingPairFactory, [
        admin,
        pairLogic,
        collateralWrapperLogic,
        debtTokenLogic,
        borrowAssetWrapperLogic,
        rewardDistributorManager
    ])
}

export const deployMockDistributorManager = async() => {
    return await deployContract<LendingPairFactory>(ContractId.MockDistributorManager, [])
}

export const deployFeeWithdrawal = async (
    vault: EthereumAddress,
    receiver: EthereumAddress,
    warpToken: EthereumAddress,
    weth: EthereumAddress,
) => {
    return await deployContract<FeeWithdrawal>(
        ContractId.FeeWithdrawal,
        [vault, receiver, warpToken, weth]
    );
}

export const deployLendingPair = async (
    vault: EthereumAddress,
    oracle: EthereumAddress,
    feewithdrawalAddr: EthereumAddress,
    feeShare: BigNumber
) => {
    return await deployContract<LendingPair>(
        ContractId.LendingPair, [
            vault, oracle, feewithdrawalAddr, feeShare
        ], 
        {
            // DataTypes: (await deployContract<DataTypes>('DataTypes', [])).address,
            // SafeERC20: (await deployContract<SafeERC20>('SafeERC20', [])).address
        }
    );
}

export const deployMockUniswapV2Router02 = async () => {
    return await deployContract<MockUniswapV2Router02>(
        ContractId.MockUniswapV2Router02,
        []
    )
}

export const deployMockVaultUser = async () => {
    return await deployContract<MockVaultUser>(
        ContractId.MockVaultUser,
        []
    )
}

/////////// For liquidation Helper
export const deployMockBalancerVault = async() => {
    return await deployContract<MockBalancerVault>(ContractId.MockBalancerVault, [])
}


export const deployMockAaveLendingPool = async(premium: number) => {
    return await deployContract<MockAaveLendingPool>(ContractId.MockAaveLendingPool, [premium])
}

export const deployMockLiquidationHelper = async(balancerVault: EthereumAddress, warpVault: EthereumAddress, pool: EthereumAddress, ) => {
    return await deployContract<MockLiquidationHelper>(ContractId.MockLiquidationHelper, [balancerVault, warpVault, pool])
}