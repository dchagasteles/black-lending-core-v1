import { ethers, waffle } from "hardhat";
import { BigNumber, Signer } from "ethers";
import { expect, assert } from "chai";
import { runTestSuite, setupAndInitLendingPair, TestVars, defaultLendingPairInitVars, advanceNBlocks, increaseTime, currentTimestamp, setNextBlockTimestamp } from "../lib";
import {
    deployMockDistributorManager,
    deployUUPSProxy
} from "../../helpers/contracts";
import { ContractId } from "../../helpers/types";

const ONE_DAY_IN_SECONDS = 86400
const MIN_SECS = 1000
const MAX_SECS = 5000
const DISTRIBUTION_PER_SECOND = 100

async function setupAndInitRewardDistributor(vars: TestVars): Promise<{
    timeToStartDistribution: number, timeToEndDistribution: number
}> {
    const {
        LendingPair,
        RewardDistributor,
        RewardDistributorManager,
        BorrowAsset,
        accounts: [admin, bob, kyle]
      } = vars
          
    // credit the reward distributor address with tokens
    await BorrowAsset.setBalanceTo(RewardDistributor.address, 1_000_000_000);

    const timeToStartDistribution = await currentTimestamp() + MIN_SECS
    const timeToEndDistribution = await currentTimestamp() + MAX_SECS

    await RewardDistributor.initialize(
        "uniswap",
        BorrowAsset.address,
        DISTRIBUTION_PER_SECOND,
        timeToStartDistribution,
        timeToEndDistribution,
        admin.address
    )

    const allocPoints = {
        collateralTokenAllocPoint: 1,
        debtTokenAllocPoint: 1,
        borrowAssetTokenAllocPoint: 1
    }

    await expect(
        await RewardDistributor.add(
        allocPoints,
        LendingPair.address
        )
    ).to.emit(RewardDistributor, 'AddDistribution')

    await expect(
        RewardDistributor.activatePendingRewards()
    ).to.be.revertedWith("ONLY_APPROVED_DISTRIBUTOR")

    return { timeToStartDistribution, timeToEndDistribution }
}

runTestSuite("RewardDistributor", (vars: TestVars) => {
  it('initialize', async () => {
      const {
        RewardDistributor,
        BorrowAsset,
        accounts: [admin, bob, kyle]
      } = vars
    
    const name = "uniswap"
    await expect(
      await RewardDistributor.initialize(
        name,
        BorrowAsset.address,
        100,
        await currentTimestamp() + 2,
        await currentTimestamp() + 120, 
        bob.address
      )
    ).to.emit(RewardDistributor, 'Initialized')

    expect(
        await RewardDistributor.name()
    ).to.eq(name)
  })

  it('add & set', async () => {
    const {
        LendingPair,
        RewardDistributor,
        BorrowAsset,
        accounts: [admin, bob, kyle]
    } = vars

    const helper = await setupAndInitLendingPair(
        vars,
        {...defaultLendingPairInitVars, account: admin }
    )

    await RewardDistributor.initialize(
        "uniswap",
        BorrowAsset.address,
        100,
        await currentTimestamp() + 100,
        await currentTimestamp() + 180,
        admin.address
    )

    const allocPoints = {
        collateralTokenAllocPoint: 1,
        debtTokenAllocPoint: 1,
        borrowAssetTokenAllocPoint: 1
    }

    await expect(
        await RewardDistributor.add(
        allocPoints,
        LendingPair.address
        )
    ).to.emit(RewardDistributor, 'AddDistribution')

    await expect(
        RewardDistributor.add(
            allocPoints,
            LendingPair.address
        )
    ).to.revertedWith('token_exists')

    await expect(
        await (await RewardDistributor.poolInfo(0)).allocPoint.toNumber()
    ).to.eq(1)

    await expect(
        await (await RewardDistributor.poolInfo(1)).allocPoint.toNumber()
    ).to.eq(1)
    
    await expect(
        await (await RewardDistributor.poolInfo(2)).allocPoint.toNumber()
    ).to.eq(1)

    expect(await RewardDistributor.getTokenPoolID(await LendingPair.wrappedCollateralAsset())).to.eq(0)
    expect(await RewardDistributor.getTokenPoolID(await LendingPair.debtToken())).to.eq(1)
    expect(await RewardDistributor.getTokenPoolID(await LendingPair.wrapperBorrowedAsset())).to.eq(2)
    
    const totalAllocPoints = () => Object.values(allocPoints).reduce((a, b) => a + b, 0)
    expect((await RewardDistributor.totalAllocPoint()).toNumber()).to.eq(totalAllocPoints())
    
    // set
    allocPoints.collateralTokenAllocPoint = 10

    await expect(
        await RewardDistributor.set(0, 10, false)
    ).to.emit(RewardDistributor, 'UpdateDistribution')

    await expect(
        await (await RewardDistributor.poolInfo(0)).allocPoint.toNumber()
    ).to.eq(allocPoints.collateralTokenAllocPoint)

    expect(await (await RewardDistributor["totalAllocPoint()"]()).toNumber()).to.eq(totalAllocPoints())

  })

  it('should not accumulate reward if current time < startTimestamp', async () => {
    const {
        LendingPair,
        RewardDistributor,
        RewardDistributorManager,
        BorrowAsset,
        accounts: [admin, bob, kyle]
    } = vars

    const helper = await setupAndInitLendingPair(
        vars,
        {...defaultLendingPairInitVars, account: admin, accountsToApproveInVault: [admin, kyle] }
    )
    
    await RewardDistributorManager.initialize(admin.address);
    const endSeconds = 500

    // credit the reward distributor address with tokens
    await BorrowAsset.setBalanceTo(RewardDistributor.address, 1_000_000_000);

    await RewardDistributor.initialize(
        "uniswap",
        BorrowAsset.address,
        100,
        await currentTimestamp() + 100,
        await currentTimestamp() + endSeconds + 10,
        admin.address
    )

    const allocPoints = {
        collateralTokenAllocPoint: 1,
        debtTokenAllocPoint: 1,
        borrowAssetTokenAllocPoint: 1
    }

    await RewardDistributor.add(
        allocPoints,
        LendingPair.address    )

    // approve distributor on manager
    await RewardDistributorManager["setDistributorStatus(address,bool)"](
        RewardDistributor.address, 
        true
    )

    const amountToDeposit = 1000
    await helper.depositCollateralAsset(kyle, amountToDeposit)

    // activate rewards
    await RewardDistributor.activatePendingRewards();
    expect(await RewardDistributor.activated()).to.eq(true)

    await advanceNBlocks(2)

    // call accumulate rewards
    await RewardDistributor["accumulateReward(address,address)"](
        await LendingPair.wrappedCollateralAsset(),
        kyle.address
    )
    
    const kylePendingReward = await (await RewardDistributor.pendingRewardToken(0, kyle.address)).toNumber()
    expect(kylePendingReward).to.eq(0)
  })

  it('reward calculation', async () => {
    const {
        LendingPair,
        RewardDistributor,
        RewardDistributorManager,
        BorrowAsset,
        accounts: [admin, bob, kyle]
    } = vars

    const helper = await setupAndInitLendingPair(
        vars,
        {...defaultLendingPairInitVars, account: admin, accountsToApproveInVault: [admin, kyle] }
    )
    
    await RewardDistributorManager.initialize(admin.address);

    const { timeToStartDistribution, timeToEndDistribution } = await setupAndInitRewardDistributor(vars);
    
    // should reject a
    await expect(
        RewardDistributor.activatePendingRewards()
    ).to.be.revertedWith("ONLY_APPROVED_DISTRIBUTOR")

    // approve distributor on manager
    await RewardDistributorManager["setDistributorStatus(address,bool)"](RewardDistributor.address, true)

    // activate rewards
    await RewardDistributor.activatePendingRewards();
    
    // confirm that the rewards have been activated
    expect(await RewardDistributorManager.tokenRewardToDistributors(
        await LendingPair.wrapperBorrowedAsset(),
        0
    )).to.eq(RewardDistributor.address)

    expect(await RewardDistributorManager.tokenRewardToDistributors(
        await LendingPair["wrappedCollateralAsset()"](),
        0
    )).to.eq(RewardDistributor.address)
    
    expect(await RewardDistributorManager.tokenRewardToDistributors(
        await LendingPair.debtToken(),
        0
    )).to.eq(RewardDistributor.address)

    // kyle deposits borrow asset
    // helper.depositBorrowAsset(kyle, 1000)
    await increaseTime(timeToStartDistribution - await currentTimestamp())

    const amountToDeposit = 1000
    await helper.depositCollateralAsset(kyle, amountToDeposit)


    await increaseTime(10)

    // call accumulate rewards
    await RewardDistributor["accumulateReward(address,address)"](
        await LendingPair.wrappedCollateralAsset(),
        kyle.address
    )
    
    const pending = await (await RewardDistributor.pendingRewardToken(0, kyle.address)).toNumber()
    const time = await currentTimestamp() - timeToStartDistribution

    // split advance and check pending
    const wrappedCollateralAsset = await ethers.getContractAt(
        ContractId.MockToken,
        await LendingPair.wrappedCollateralAsset()
    )

    await wrappedCollateralAsset.connect(kyle.signer).transfer(bob.address, amountToDeposit / 2)
    
    await increaseTime(10)

    const bobPending = await (await RewardDistributor.pendingRewardToken(0, bob.address)).toNumber()
    const kylePendingT = await (await RewardDistributor.pendingRewardToken(0, kyle.address)).toNumber()

    const kylePending = await (await RewardDistributor.userInfo(0, kyle.address))
   
    // kyle withdraws
    await expect(
        await RewardDistributor.connect(kyle.signer).withdraw(0, kyle.address)
    ).to.emit(RewardDistributor, 'Withdraw')

    // check balance of kyle
    // console.log((await BorrowAsset["balanceOf(address)"](kyle.address)).toNumber())

    expect(
        (await RewardDistributor.pendingRewardToken(0, kyle.address)).toNumber()
    ).to.eq(0)

    // stop accumulating after end timestamp
    await increaseTime(timeToEndDistribution - await currentTimestamp())

    // call accumulate rewards
    await RewardDistributor.accumulateReward(await LendingPair.wrappedCollateralAsset(), kyle.address)
    const expectedRewards = (await RewardDistributor.pendingRewardToken(0, kyle.address)).toNumber()
    // call again shouldn't change expected rewards
    await RewardDistributor.accumulateReward(await LendingPair.wrappedCollateralAsset(), kyle.address)
    const newExpectedRewards = ((await RewardDistributor.pendingRewardToken(0, kyle.address)).toNumber())
    // the expected rewards shouldn't change after endTimestamp
    expect(expectedRewards).to.eq(newExpectedRewards)

  })
  
  it('withdrawUnclaimedRewards & reward calculation - should allocate previous pending rewards', async () => {
    const {
        LendingPair,
        RewardDistributor,
        RewardDistributorManager,
        BorrowAsset,
        accounts: [admin, bob, kyle, peter, ruth]
    } = vars

    const helper = await setupAndInitLendingPair(
        vars,
        {...defaultLendingPairInitVars, account: admin, accountsToApproveInVault: [admin, kyle, peter, ruth] }
    )
    
    await RewardDistributorManager.initialize(admin.address);
    const endSeconds = 500

    // credit the reward distributor address with tokens
    await BorrowAsset.setBalanceTo(RewardDistributor.address, 1_000_000_000);

    await RewardDistributor.initialize(
        "uniswap",
        BorrowAsset.address,
        100,
        await currentTimestamp() + 100,
        await currentTimestamp() + endSeconds,
        admin.address
    )

    const allocPoints = {
        collateralTokenAllocPoint: 1,
        debtTokenAllocPoint: 1,
        borrowAssetTokenAllocPoint: 1
    }

    await RewardDistributor.add(
        allocPoints,
        LendingPair.address,
    )

    // approve distributor on manager
    await RewardDistributorManager["setDistributorStatus(address,bool)"](
        RewardDistributor.address, 
        true
    )
    
    // increase time to start distributing rewards
    await increaseTime(100)

    const amountToDeposit = 1000
    await helper.depositCollateralAsset(kyle, amountToDeposit)
    await helper.depositCollateralAsset(peter, amountToDeposit)
    await helper.depositCollateralAsset(ruth, amountToDeposit)

    // activate rewards
    await RewardDistributor.activatePendingRewards();

    await advanceNBlocks(10)

    // call accumulate rewards
    await RewardDistributor["accumulateReward(address,address)"](
        await LendingPair.wrappedCollateralAsset(),
        kyle.address
    )
    
    const expectedPendingReward = 566
    const kylePendingReward = await (await RewardDistributor.pendingRewardToken(0, kyle.address)).toNumber()

    // should allow withdrawal of rewards for 30 days after endtimestamp
    await advanceNBlocks(500)
    
    // kyle called accumulate rewards before CLAIM_GRACE_PERIOD
    const kylePendingReward2 = await (await RewardDistributor.pendingRewardToken(0, kyle.address)).toNumber()
    // peter calls accumulate rewards during CLAIM_GRACE_PERIOD
    const peterPendingReward = await (await RewardDistributor.pendingRewardToken(0, peter.address)).toNumber()
    expect(kylePendingReward2).to.eq(peterPendingReward)
    await increaseTime(40 * ONE_DAY_IN_SECONDS)

    // ruth calls accumulate rewards after CLAIM_GRACE_PERIOD
    // should not be able to claim reward
    const ruthPendingReward = await (await RewardDistributor.pendingRewardToken(0, ruth.address)).toNumber()
    expect(ruthPendingReward).to.eq(0)

    // should prevent withdrawal of rewards if user doesn't claim reward
    await expect(
        await RewardDistributor.connect(ruth.signer).withdraw(
            0,
            ruth.address
        )
    ).to.not.emit(RewardDistributor, 'Withdraw')

    await expect(
        RewardDistributor.withdrawUnclaimedRewards(admin.address)
    ).to.be.revertedWith("REWARD_PERIOD_ACTIVE")

    await increaseTime(60 * ONE_DAY_IN_SECONDS)

    // withdraw grace period expired
    await expect(
        await RewardDistributor.withdrawUnclaimedRewards(admin.address)
    ).to.emit(RewardDistributor, 'WithdrawUnclaimedReward')

  })

  it('withdraw calculates the reward and disburses it', async () => {
    const {
        LendingPair,
        RewardDistributor,
        RewardDistributorManager,
        BorrowAsset,
        accounts: [admin, bob, kyle]
    } = vars

    const helper = await setupAndInitLendingPair(
        vars,
        {...defaultLendingPairInitVars, account: admin, accountsToApproveInVault: [admin, kyle] }
    )
    
    await RewardDistributorManager.initialize(admin.address);
    const endSeconds = 500

    const blockCurrentTimestamp =  await currentTimestamp()
    await RewardDistributor.initialize(
        "uniswap",
        BorrowAsset.address,
        100,
        blockCurrentTimestamp + 100,
        blockCurrentTimestamp + endSeconds,
        admin.address
    )

    // credit the reward distributor address with tokens
    await BorrowAsset.setBalanceTo(RewardDistributor.address, 1_000_000_000);

    const allocPoints = {
        collateralTokenAllocPoint: 1,
        debtTokenAllocPoint: 1,
        borrowAssetTokenAllocPoint: 1
    }

    await RewardDistributor.add(
        allocPoints,
        LendingPair.address
    )

    // approve distributor on manager
    await RewardDistributorManager["setDistributorStatus(address,bool)"](
        RewardDistributor.address, 
        true
    )

    // increase time to start distributing rewards
    await increaseTime(100)

    const amountToDeposit = 1000
    await helper.depositCollateralAsset(kyle, amountToDeposit)


    // activate rewards
    await RewardDistributor.activatePendingRewards();

    await advanceNBlocks(10)

    // call withdraw rewards
    await RewardDistributor.connect(kyle.signer).withdraw(
        0,
        kyle.address
    )
    const balance = await (await BorrowAsset.balanceOf(kyle.address)).toNumber();
    const paidOut = (await RewardDistributor.pendingRewardToken(0, kyle.address)).toNumber()
    expect(paidOut).to.eq(0)

    // check debt reward calculation
  })

})