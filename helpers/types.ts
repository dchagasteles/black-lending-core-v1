export enum ContractId {
    Vault = 'Vault',
    MockToken = 'MockToken',
    LendingPair = 'LendingPair',
    LendingPairFactory = 'LendingPairFactory',
    Control = 'Control',
    WrapperToken = 'BorrowWrapperToken',
    UUPSProxy = 'UUPSProxy',
    MockFlashBorrower = 'MockFlashBorrower',
    MockLendingPair = 'MockLendingPair',
    UUPSProxiable = 'UUPSProxiable',
    MockPriceOracle  = 'MockPriceOracle',
    JumpRateModelV2 = 'JumpRateModelV2',
    PriceOracleAggregator = 'PriceOracleAggregator',
    MockVault = 'MockVault',
    DataTypes = 'DataTypes',
    LendingPairHelper = 'LendingPairHelper',
    DebtToken = 'DebtToken',
    CollateralWrapperToken = 'CollateralWrapperToken',
    MockChainlinkUSDAdapter = 'MockChainlinkUSDAdapter',
    VaultStorageLayoutTester = 'VaultStorageLayoutTester',
    SafeERC20 = 'SafeERC20',
    VaultFactory = 'VaultFactory',
    RewardDistributorManager = 'RewardDistributorManager',
    RewardDistributor = 'RewardDistributor',
    RewardDistributorFactory = 'RewardDistributorFactory',
    MockDistributorManager = 'MockRewardDistributorManager',
    FeeWithdrawal = 'FeeWithdrawal',
    MockUniswapV2Router02 = 'MockUniswapV2Router02',
    VaultProxy = 'VaultProxy',
    FeeWithdrawalProxy = 'FeeWithdrawalProxy',
    // PriceOracleAggregatorProxy = 'PriceOracleAggregatorProxy',
    RewardDistributorManagerProxy = 'RewardDistributorManagerProxy',
    MockVaultUser = 'MockVaultUser',
    LiquidationHelper = 'LiquidationHelper',
    MockBalancerVault = 'MockBalancerVault',
    MockAaveLendingPool = 'MockAaveLendingPool',
    MockLiquidationHelper = 'MockLiquidationHelper'
}

export enum LendingPairWarpActions {
    BORROW_ASSET_DEPOSIT = 1,
    REPAY = 2,
    BORROW = 3,
    REDEEM = 4,
    WITHDRAW_COLLATERAL = 5,

    COLLATERAL_DEPOSIT = 10,
    VAULT_DEPOSIT = 11,
    VAULT_WITHDRAW = 12,
    VAULT_TRANSFER = 13,
    VAULT_APPROVE_CONTRACT = 14
}

export interface IAssetDetails {
    name: string,
    version: string,
    address: EthereumAddress,
    chainId: number
}

export interface IApproveMessageData {
    nonce: number,
    approve: boolean,
    user: EthereumAddress,
    contract: EthereumAddress
}


export interface IPAIRS {
    [pair: string]: {
      symbol: string,
      pauseGuardian: string,
      collateralAsset: string,
      borrowVars: {
        borrowAsset: string,
        initialExchangeRateMantissa: string,
        reserveFactorMantissa: string,
        collateralFactor: string,
        liquidationFee: string,
        interestRateModel: string,
      },
    },
}
export interface IDelegateBorrowMessageData {
    from: EthereumAddress,
    to: EthereumAddress,
    amount: number,
    nonce: number
}

export enum LendingPairActions {
    Deposit = 0,
    Borrow = 1,
}

export type EthereumAddress = string;
