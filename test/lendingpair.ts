import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { expect } from "chai";
import { LendingPairActions } from "../helpers/types";
import {
  runTestSuite,
  setupAndInitLendingPair,
  TestVars,
  defaultLendingPairInitVars,
  setupLendingPair,
  lastBlockNumber,
} from "./lib";

const amountToDeposit = 1000;

runTestSuite("LendingPair", (vars: TestVars) => {
  it("initialize", async () => {
    const {
      BorrowWrapperToken,
      CollateralAsset,
      BorrowAsset,
      CollateralWrapperToken,
      LendingPair,
      DebtToken,
      InterestRateModel,
      RewardDistributorManager,
      accounts: [admin],
    } = vars;

    await setupLendingPair(
      LendingPair,
      CollateralAsset,
      BorrowAsset,
      BorrowWrapperToken,
      CollateralWrapperToken,
      DebtToken,
      RewardDistributorManager
    );

    await LendingPair.initialize(
      {
        name: "Test",
        symbol: "TST",
        asset: BorrowAsset.address,
        collateralAsset: CollateralAsset.address,
        guardian: admin.address,
      },
      {
        ...defaultLendingPairInitVars,
        wrappedBorrowAsset: BorrowWrapperToken.address,
        debtToken: DebtToken.address,
      },
      CollateralWrapperToken.address,
      InterestRateModel.address,
      {
        depositCollateralLimit: 0,
        depositBorrowLimit: 0,
        totalPairDebtLimit: 0,
      }
    );
  });

  it("depositBorrowAsset - fails without enough vault balance", async () => {
    const {
      LendingPair,
      accounts: [admin, bob],
    } = vars;

    const lendingPairHelpers = await setupAndInitLendingPair(vars, {
      ...defaultLendingPairInitVars,
      account: admin,
    });

    // const lendingPairHelpers = LendingPairHelpers(Vault, LendingPair, BorrowAsset, BorrowAsset, PriceOracleAggregator, admin)

    await lendingPairHelpers.approveLendingPairInVault(bob, true);
    await expect(
      LendingPair.connect(bob.signer).depositBorrowAsset(bob.address, amountToDeposit)
    ).to.be.revertedWith("");
  });

  it("depositBorrowAsset", async () => {
    const {
      Vault,
      BorrowWrapperToken,
      BorrowAsset,
      LendingPair,
      accounts: [admin, bob],
    } = vars;

    const helper = await setupAndInitLendingPair(vars, {
      ...defaultLendingPairInitVars,
      account: admin,
    });

    await expect(
      LendingPair.depositBorrowAsset(ethers.constants.AddressZero, amountToDeposit)
    ).to.be.revertedWith("IDB");

    await Promise.all(
      [admin, bob].map(async (address) => {
        // approve in vault
        await helper.approveLendingPairInVault(address, true);
        // deposit asset
        await expect(await helper.depositBorrowAsset(address, amountToDeposit)).to.emit(
          LendingPair,
          "Deposit"
        );
        // check balances of depositor
        // wrapper token balance minted on deposit of borrow asset
        expect(await BorrowWrapperToken.balanceOf(address.address)).to.eq(amountToDeposit);
      })
    );

    // check that the lending pair account was properly credited with shares
    expect(
      await (await Vault.balanceOf(BorrowAsset.address, LendingPair.address)).toNumber()
    ).to.eq(amountToDeposit * 2);

    // check ERC20 balance of vault that it is properly credited
    expect(await (await BorrowAsset.balanceOf(Vault.address)).toNumber()).to.eq(
      amountToDeposit * 2
    );
  });

  it("depositCollateral", async () => {
    const {
      Vault,
      CollateralAsset,
      LendingPair,
      accounts: [admin, bob, frank],
    } = vars;

    const helper = await setupAndInitLendingPair(vars, {
      ...defaultLendingPairInitVars,
      account: admin,
    });

    await helper.approveLendingPairInVault(bob, true);

    // fails without enough vault balance
    await expect(
      LendingPair.connect(bob.signer).depositCollateral(bob.address, amountToDeposit)
    ).to.be.revertedWith("");

    await Promise.all(
      [admin, frank].map(async (address) => {
        // deposit collateral asset
        await helper.approveLendingPairInVault(address, true);
        await expect(await helper.depositCollateralAsset(address, amountToDeposit))
          .to.emit(LendingPair, "Deposit")
          .withArgs(
            LendingPair.address,
            CollateralAsset.address,
            address.address,
            address.address,
            amountToDeposit,
            amountToDeposit,
            amountToDeposit
          );
        // check balances of depositors
        expect(await (await LendingPair.collateralOfAccount(address.address)).toNumber()).to.eq(
          amountToDeposit
        );
      })
    );
    // check that the lending pair account was properly credited with shares
    expect(
      await (await Vault.balanceOf(CollateralAsset.address, LendingPair.address)).toNumber()
    ).to.eq(amountToDeposit * 2);

    // check ERC20 balance of vault that it is properly credited
    expect(await (await CollateralAsset.balanceOf(Vault.address)).toNumber()).to.eq(
      amountToDeposit * 2
    );
  });

  it("borrow - fails when you try to borrow more than allowed", async () => {
    const {
      LendingPair,
      accounts: [admin, frank],
    } = vars;

    const helper = await setupAndInitLendingPair(vars, {
      ...defaultLendingPairInitVars,
      account: admin,
      accountsToApproveInVault: [frank, admin],
    });

    await helper.depositCollateralAsset(frank, 100);

    await expect(LendingPair.connect(frank.signer).borrow(1000000, frank.address)).to.revertedWith(
      "BORROWING_MORE_THAN_ALLOWED"
    );
  });

  it("borrow - fails when you try to borrow more than cash available in vault", async () => {
    const {
      LendingPair,
      accounts: [admin, frank, alice],
    } = vars;

    const helper = await setupAndInitLendingPair(vars, {
      ...defaultLendingPairInitVars,
      account: admin,
      accountsToApproveInVault: [frank, alice],
    });

    // deposit 1,000,000
    await helper.depositCollateralAsset(alice, 1000000);

    await expect(LendingPair.connect(alice.signer).borrow(5000, alice.address)).to.revertedWith("");
  });

  it("borrow", async () => {
    const {
      Vault,
      BorrowAsset,
      LendingPair,
      accounts: [admin, bob, frank],
      LendingPairHelper,
      DebtToken,
    } = vars;

    const helper = await setupAndInitLendingPair(vars, {
      ...defaultLendingPairInitVars,
      account: admin,
    });

    await helper.approveLendingPairInVault(frank, true);
    await helper.approveLendingPairInVault(bob, true);

    // frank deposit collateral
    await helper.depositCollateralAsset(frank, 1000);
    // bob deposits borrow asset
    await helper.depositBorrowAsset(bob, 1000);

    // frank will like to borrow 100 of borrow asset after depositing 1000 collateral
    const amountToBorrow = 100;
    const currentFrankBorrowAssetBalance = await (
      await Vault.balanceOf(BorrowAsset.address, frank.address)
    ).toNumber();
    const currentLendingPairBorrowAssetBalance = await (
      await Vault.balanceOf(BorrowAsset.address, LendingPair.address)
    ).toNumber();

    const borrowLimit: any = await LendingPairHelper.viewBorrowLimit(
      [LendingPair.address],
      frank.address
    );
    // 150% of collateral is required to open borrow position
    // 1000 * 0.666
    expect(borrowLimit[0].toNumber()).to.eq(666);

    await expect(await LendingPair.connect(frank.signer).borrow(amountToBorrow, frank.address))
      .to.emit(LendingPair, "Borrow")
      .withArgs(frank.address, amountToBorrow);
    // const tx =  await (await LendingPair.connect(frank.signer).borrow(amountToBorrow)).wait()
    //   console.log(`gasUsed `, tx.gasUsed.toNumber());
    const newBorrowLimit: any = await LendingPairHelper.viewBorrowedValue(
      [LendingPair.address],
      frank.address
    );
    // (opened borrow position)
    expect(newBorrowLimit[0].toNumber()).to.eq(100);

    // check debtToken balance
    expect((await DebtToken.balanceOf(frank.address)).toNumber()).to.eq(amountToBorrow);

    const newFrankBorrowAssetBalance = await (
      await Vault.balanceOf(BorrowAsset.address, frank.address)
    ).toNumber();
    const newLendingPairBorrowAssetBalance = await (
      await Vault.balanceOf(BorrowAsset.address, LendingPair.address)
    ).toNumber();

    expect(newFrankBorrowAssetBalance).eq(currentFrankBorrowAssetBalance + amountToBorrow);
    expect(newLendingPairBorrowAssetBalance).eq(
      currentLendingPairBorrowAssetBalance - amountToBorrow
    );

    const accountBorrows = await DebtToken.balanceOf(frank.address);
    // check frank account borrows
    expect(accountBorrows.toNumber()).to.eq(amountToBorrow);

    // check total borrows for the borrow asset
    await expect(await (await DebtToken.totalSupply()).toNumber()).to.eq(amountToBorrow);

    // check supply rate
    expect(await LendingPair.supplyRatePerBlock()).to.be.not.eq(ethers.constants.Zero);
    /// check borrow rate
    expect(await LendingPair.borrowRatePerBlock()).to.be.not.eq(ethers.constants.Zero);

    await LendingPair.exchangeRateCurrent();

    // const exchnageRateCached = await LendingPair.exchangeRateCached()
    // console.log(exchnageRateCached.toString())
  });

  it("collateral transfer - can not transfer more than allowed that puts loan at risk", async () => {
    const {
      LendingPair,
      CollateralWrapperToken,
      accounts: [admin, frank, bob],
    } = vars;
    const helper = await setupAndInitLendingPair(vars, {
      ...defaultLendingPairInitVars,
      account: admin,
      accountsToApproveInVault: [frank, admin, bob],
    });

    await helper.approveLendingPairInVault(bob, true);
    await helper.approveLendingPairInVault(frank, true);

    // deposit collateral
    await helper.depositCollateralAsset(frank, amountToDeposit);
    // deposit borrow asset
    await helper.depositBorrowAsset(bob, 1000);
    // borrow
    await LendingPair.connect(frank.signer).borrow(200, frank.address);

    // try to withdraw transfer entire collateral
    const balance = await (await CollateralWrapperToken.balanceOf(frank.address)).toNumber();
    await expect(
      CollateralWrapperToken.connect(frank.signer).transfer(bob.address, balance)
    ).to.revertedWith("EXCEEDS_ALLOWED");

    // collateral transfer - can transfer part of collateral
    await expect(
      await CollateralWrapperToken.connect(frank.signer).transfer(bob.address, 50)
    ).to.emit(CollateralWrapperToken, "Transfer");
  });

  it("collateral transferFrom - can not transferFrom more than allowed that puts loan at risk", async () => {
    const {
      LendingPair,
      CollateralWrapperToken,
      accounts: [admin, frank, bob],
    } = vars;
    const helper = await setupAndInitLendingPair(vars, {
      ...defaultLendingPairInitVars,
      account: admin,
      accountsToApproveInVault: [frank, admin, bob],
    });

    await helper.approveLendingPairInVault(bob, true);
    await helper.approveLendingPairInVault(frank, true);

    // deposit collateral
    await helper.depositCollateralAsset(frank, amountToDeposit);
    // deposit borrow asset
    await helper.depositBorrowAsset(bob, 1000);
    // borrow
    await LendingPair.connect(frank.signer).borrow(200, frank.address);

    // try to withdraw transfer entire collateral
    const balance = await (await CollateralWrapperToken.balanceOf(frank.address)).toNumber();

    await CollateralWrapperToken.connect(frank.signer).approve(bob.address, balance);

    await expect(
      CollateralWrapperToken.connect(bob.signer).transferFrom(frank.address, bob.address, balance)
    ).to.revertedWith("EXCEEDS_ALLOWED");

    // collateral transfer - can transfer part of collateral
    await expect(
      await CollateralWrapperToken.connect(frank.signer).transfer(bob.address, 50)
    ).to.emit(CollateralWrapperToken, "Transfer");
  });

  it("withdrawCollateral", async () => {
    const {
      Vault,
      LendingPair,
      CollateralWrapperToken,
      CollateralAsset,
      BorrowAsset,
      accounts: [admin, bob, james],
    } = vars;
    const helper = await setupAndInitLendingPair(vars, {
      ...defaultLendingPairInitVars,
      account: admin,
      accountsToApproveInVault: [james, admin, bob],
    });

    // const jamesSigner = await ethers.getSigner(james)
    const connectedLendingPair = LendingPair.connect(james.signer);
    // deposit collateral
    await helper.depositCollateralAsset(james, amountToDeposit);
    // deposit borrow asset
    await helper.depositBorrowAsset(admin, 1000);

    // borrow
    await connectedLendingPair.borrow(10, james.address);

    // james tries to withdraw his entire collateral
    await expect(connectedLendingPair.withdrawCollateral(amountToDeposit)).to.be.revertedWith(
      "EXCEEDS_ALLOWED"
    );

    // can withdraw up to half of collateral
    const jamesVaultBalance = (
      await Vault.balanceOf(CollateralAsset.address, james.address)
    ).toNumber();
    const lendingPairVaultBalance = (
      await Vault.balanceOf(CollateralAsset.address, LendingPair.address)
    ).toNumber();
    const amountToWithdraw = amountToDeposit / 2;

    await expect(await connectedLendingPair.withdrawCollateral(amountToWithdraw))
      .to.emit(LendingPair, "WithdrawCollateral")
      .withArgs(james.address, amountToWithdraw);

    // check balances of user
    const updatedJamesVaultBalance = (
      await Vault.balanceOf(CollateralAsset.address, james.address)
    ).toNumber();
    expect(updatedJamesVaultBalance).to.eq(jamesVaultBalance + amountToWithdraw);

    const updatedLendingPairVaultBalance = (
      await Vault.balanceOf(CollateralAsset.address, LendingPair.address)
    ).toNumber();
    expect(updatedLendingPairVaultBalance).to.eq(lendingPairVaultBalance - amountToWithdraw);

    // repay
    await helper.depositInVault(james.signer, BorrowAsset, 100);
    await connectedLendingPair.repay(0, james.address);

    // tries withdrawing collateral more than deposited
    await expect(connectedLendingPair.withdrawCollateral(amountToDeposit)).to.be.reverted;

    // withdrawCollateral entire collateral
    await expect(connectedLendingPair.withdrawCollateral(0)).to.not.be.reverted;

    expect((await LendingPair.collateralOfAccount(james.address)).toNumber()).to.eq(0);
    expect((await CollateralWrapperToken.balanceOf(james.address)).toNumber()).to.eq(0);
    expect((await Vault.balanceOf(CollateralAsset.address, james.address)).toNumber()).to.eq(
      amountToDeposit
    );
  });

  it("repay - fails if you are trying to pay more than owed", async () => {
    const {
      LendingPair,
      accounts: [admin, frank],
    } = vars;
    const helper = await setupAndInitLendingPair(vars, {
      ...defaultLendingPairInitVars,
      account: admin,
      accountsToApproveInVault: [frank, admin],
    });

    // frank has no borrows
    await expect(LendingPair.connect(frank.signer).repay(100, frank.address)).to.revertedWith(
      "MORE_THAN_OWED"
    );
  });

  it("repay", async function () {
    const {
      Vault,
      LendingPair,
      DebtToken,
      BorrowAsset,
      accounts: [admin, bob, frank],
    } = vars;
    const helper = await setupAndInitLendingPair(vars, {
      ...defaultLendingPairInitVars,
      account: admin,
      accountsToApproveInVault: [frank, admin, bob],
    });

    // deposit collateral
    await helper.depositCollateralAsset(frank, amountToDeposit);
    // deposit borrow asset
    await helper.depositBorrowAsset(bob, 1000);
    // borrow
    await LendingPair.connect(frank.signer).borrow(200, frank.address);

    // deposit borrow asset into vault for repay purpose
    await helper.depositInVault(frank.signer, BorrowAsset, 10000);

    const frankVaultBalance = await (
      await Vault.balanceOf(BorrowAsset.address, frank.address)
    ).toNumber();
    const LendingPairBalance = await (
      await Vault.balanceOf(BorrowAsset.address, LendingPair.address)
    ).toNumber();
    // pay part of it
    const currentRepayAmount = await (await DebtToken.balanceOf(frank.address)).toNumber();
    const partRepayAmount = currentRepayAmount / 2;

    // repay part
    await expect(await LendingPair.connect(frank.signer).repay(partRepayAmount, frank.address))
      .to.emit(LendingPair, "Repay")
      .withArgs(
        LendingPair.address,
        BorrowAsset.address,
        frank.address,
        frank.address,
        partRepayAmount
      );
    // burns half of debt tokens
    expect((await DebtToken.balanceOf(frank.address)).toNumber()).to.eq(partRepayAmount);

    // check current borrow balance
    const newBorrowBalance = await (await DebtToken.balanceOf(frank.address)).toNumber();
    expect(newBorrowBalance).to.be.eq(partRepayAmount);

    // repay everything
    await expect(await LendingPair.connect(frank.signer).repay(0, frank.address)).to.emit(
      LendingPair,
      "Repay"
    );

    const updatedBorrowBalance = await (await DebtToken.balanceOf(frank.address)).toNumber();
    expect(updatedBorrowBalance).to.be.eq(0);

    const updatedFrankVaultBalance = await (
      await Vault.balanceOf(BorrowAsset.address, frank.address)
    ).toNumber();
    const updatedLendingPairBalance = await (
      await Vault.balanceOf(BorrowAsset.address, LendingPair.address)
    ).toNumber();
    // confirm that the user account has been debited for the amount
    expect(frankVaultBalance - updatedFrankVaultBalance >= currentRepayAmount).true;
    // confirm the lending pair account increases
    expect(updatedLendingPairBalance - LendingPairBalance >= currentRepayAmount).true;
    // burns debt token
    expect((await DebtToken.balanceOf(frank.address)).toNumber()).to.eq(0);
  });

  it("redeem - fails if you are trying to redeem more than your account", async () => {
    const {
      LendingPair,
      BorrowWrapperToken,
      accounts: [admin, bob, frank],
    } = vars;
    const helper = await setupAndInitLendingPair(vars, {
      ...defaultLendingPairInitVars,
      account: admin,
      accountsToApproveInVault: [frank, admin, bob],
    });

    await helper.depositBorrowAsset(admin, 500);

    const currentWrapperTokenBalance = await (
      await BorrowWrapperToken.balanceOf(admin.address)
    ).toNumber();

    await expect(LendingPair.redeem(admin.address, currentWrapperTokenBalance * 2)).to.revertedWith(
      ""
    );
  });

  it("redeem", async function () {
    const {
      Vault,
      LendingPair,
      DebtToken,
      BorrowWrapperToken,
      BorrowAsset,
      accounts: [admin, bob, frank],
    } = vars;
    const helper = await setupAndInitLendingPair(vars, {
      ...defaultLendingPairInitVars,
      account: admin,
      accountsToApproveInVault: [frank, admin, bob],
    });

    await helper.depositBorrowAsset(admin, amountToDeposit);

    const lendingPairVaultBalance = (
      await Vault.balanceOf(BorrowAsset.address, LendingPair.address)
    ).toNumber();
    const userVaultBalance = (await Vault.balanceOf(BorrowAsset.address, admin.address)).toNumber();
    // admin wants to redeem deposit wrapper token for underlying share
    const currentWrapperTokenBalance = await (
      await BorrowWrapperToken.balanceOf(admin.address)
    ).toNumber();
    const partRedeem = currentWrapperTokenBalance / 2;

    // part redeem
    await expect(await LendingPair.redeem(admin.address, partRedeem))
      .to.emit(LendingPair, "Redeem")
      .withArgs(
        LendingPair.address,
        BorrowAsset.address,
        admin.address,
        admin.address,
        partRedeem,
        partRedeem
      );

    const newWrapperTokenBalance = await (
      await BorrowWrapperToken.balanceOf(admin.address)
    ).toNumber();
    // console.log({ newWrapperTokenBalance })
    // console.log({ currentWrapperTokenBalance })
    expect(currentWrapperTokenBalance - newWrapperTokenBalance).to.be.eq(partRedeem);

    // full redeem
    await expect(await LendingPair.redeem(admin.address, 0)).to.emit(LendingPair, "Redeem");

    const updatedWrapperTokenBalance = await (
      await BorrowWrapperToken.balanceOf(admin.address)
    ).toNumber();
    expect(updatedWrapperTokenBalance).to.be.eq(0);

    // LendingPair principal balance should be 0
    // expect(await (await LendingPair.principalBalance(admin)).toNumber()).to.be.eq(0)
    // borrow wrapper asset should be zero
    expect(await (await BorrowWrapperToken.balanceOf(admin.address)).toNumber()).to.be.eq(0);

    // LendingPair vault balance should decrease after redeem
    const updatedLendingPairVaultBalance = (
      await Vault.balanceOf(BorrowAsset.address, LendingPair.address)
    ).toNumber();
    expect(lendingPairVaultBalance > updatedLendingPairVaultBalance).true;
    // user vault balance should increase after withdrawal
    const updatedUserVaultBalance = (
      await Vault.balanceOf(BorrowAsset.address, admin.address)
    ).toNumber();
    expect(updatedUserVaultBalance - userVaultBalance >= currentWrapperTokenBalance).true;
  });

  it("liquidate - cannot liquidate self", async () => {
    const {
      LendingPair,
      accounts: [admin, bob, frank],
    } = vars;
    const helper = await setupAndInitLendingPair(vars, {
      ...defaultLendingPairInitVars,
      account: admin,
      accountsToApproveInVault: [frank, admin, bob],
    });

    await expect(LendingPair.liquidate(admin.address)).to.revertedWith("NOT_LIQUIDATE_SELF");
  });

  it("liquidate & withdrawFees - correctly", async () => {
    const {
      Vault,
      LendingPair,
      DebtToken,
      BorrowAssetMockPriceOracle,
      CollateralWrapperToken,
      BorrowAsset,
      CollateralAsset,
      accounts: [admin, james, frank],
    } = vars;
    const helper = await setupAndInitLendingPair(vars, {
      ...defaultLendingPairInitVars,
      account: admin,
      accountsToApproveInVault: [frank, admin, james],
    });

    // deposit collateral
    await helper.depositCollateralAsset(james, amountToDeposit);
    await helper.depositBorrowAsset(frank, 1000);

    const jamesCollateralInVault = (
      await CollateralWrapperToken.balanceOf(james.address)
    ).toNumber();

    // borrow
    await LendingPair.connect(james.signer).borrow(500, james.address);

    // change price
    // set oracle price to half
    await (await BorrowAssetMockPriceOracle.setPrice(BigNumber.from(3000).pow(8))).wait();

    // liquidator deposits in vault
    await helper.depositInVault(admin.signer, BorrowAsset, 800);

    const lendingPairBalanceInVault = (
      await Vault.balanceOf(BorrowAsset.address, LendingPair.address)
    ).toNumber();
    const adminBalanceInVault = (
      await Vault.balanceOf(BorrowAsset.address, admin.address)
    ).toNumber();
    const adminCollateralBalanceInVault = (
      await Vault.balanceOf(CollateralAsset.address, admin.address)
    ).toNumber();

    await (await LendingPair.liquidate(james.address)).wait();
    // james now has zero debt balance
    expect((await DebtToken.balanceOf(james.address)).toNumber()).to.eq(0);

    const updateAdminBalanceInVault = (
      await Vault.balanceOf(BorrowAsset.address, admin.address)
    ).toNumber();

    // expect the liquidator balance to be reduced minimum by
    //  500 + (0.05% * 500) * 0.05% = 501 (0.05% is liquidation fee)
    expect(adminBalanceInVault - updateAdminBalanceInVault >= 501).true;

    // expect that lending pair balance increased by liquidated amount
    expect((await Vault.balanceOf(BorrowAsset.address, LendingPair.address)).toNumber()).to.eq(
      lendingPairBalanceInVault + 501
    );

    // expect james collateral to be seized
    expect((await CollateralWrapperToken.balanceOf(james.address)).toNumber()).to.eq(0);

    // expect admin collateral balance to be increased
    expect((await Vault.balanceOf(CollateralAsset.address, admin.address)).toNumber()).to.eq(
      adminCollateralBalanceInVault + jamesCollateralInVault
    );

    /// WithdrawFees Test case
    const teamVaultBalance = await (
      await Vault.balanceOf(BorrowAsset.address, vars.FeeWithdrawal.address)
    ).toNumber();
    const feesToWithdraw = await (await LendingPair.totalReserves()).toNumber();
    await LendingPair.withdrawFees(feesToWithdraw);

    const newTeamVaultBalance = await (
      await Vault.balanceOf(BorrowAsset.address, vars.FeeWithdrawal.address)
    ).toNumber();
    expect(newTeamVaultBalance).to.eq(teamVaultBalance + feesToWithdraw);
  });

  it("withdrawFees - fails without enough balance", async () => {
    const {
      Vault,
      LendingPair,
      accounts: [admin, james, frank],
    } = vars;
    const helper = await setupAndInitLendingPair(vars, {
      ...defaultLendingPairInitVars,
      account: admin,
      accountsToApproveInVault: [frank, admin, james],
    });

    await expect(LendingPair.withdrawFees(10000000)).to.be.revertedWith("NOT_ENOUGH_BALANCE");
  });

  it("pause", async () => {
    const {
      LendingPair,
      accounts: [admin, james, frank],
    } = vars;
    const helper = await setupAndInitLendingPair(vars, {
      ...defaultLendingPairInitVars,
      account: admin,
      accountsToApproveInVault: [frank, admin, james],
    });

    await expect(LendingPair.connect(james.signer).pause(LendingPairActions.Deposit)).to.be
      .reverted;

    await expect(LendingPair.pause(LendingPairActions.Deposit)).to.not.be.reverted;

    await expect(helper.depositBorrowAsset(admin, 1000)).to.be.revertedWith("PAUSED");

    await expect(helper.depositCollateralAsset(admin, 1000)).to.be.revertedWith("PAUSED");

    await expect(LendingPair.pause(LendingPairActions.Borrow)).to.not.be.reverted;

    await expect(LendingPair.borrow(10, admin.address)).to.be.revertedWith("PAUSED");
  });

  it("unpause", async () => {
    const {
      LendingPair,
      accounts: [admin, james, frank],
    } = vars;
    const helper = await setupAndInitLendingPair(vars, {
      ...defaultLendingPairInitVars,
      account: admin,
      accountsToApproveInVault: [frank, admin, james],
    });

    // pause
    await LendingPair.pause(LendingPairActions.Deposit);

    // unpause
    await LendingPair.unpause(LendingPairActions.Deposit);

    await expect(helper.depositBorrowAsset(admin, 1000)).to.not.be.reverted;

    await expect(helper.depositCollateralAsset(james, 1000)).to.not.be.reverted;

    // borrow
    await LendingPair.pause(LendingPairActions.Borrow);
    // unpause borrow
    await LendingPair.unpause(LendingPairActions.Borrow);

    await expect(LendingPair.connect(james.signer).borrow(10, james.address)).to.not.be.reverted;
  });

  // describe("lending pair - dependent actions", async function() {
  //   describe("liquidate", async function() {
  //   })
  //   describe("accrueInterest", function() {
  //     it("borrow position - accrues interest", async function(){
  //       // zubi deposits collateral and opens a borrow position
  //       const toDeposit = 2000000000000
  //       const zubiSigner = await ethers.getSigner(zubi)
  //       await depositCollateralAsset(LendingPair, zubi, toDeposit)
  //       await depositBorrowAsset(LendingPair, admin, toDeposit)

  //       // set price proper
  //       await (await MockPriceOracle.setPrice(BorrowAsset.address, BigNumber.from(10).pow(8))).wait()

  //       // borrow
  //       const amountToBorrow = 1500000000000

  //       await LendingPair.connect(zubiSigner).borrow(amountToBorrow);

  //       // mine
  //       // await advanceNBlocks(1000)

  //       // // call accrueInterest
  //       await (await LendingPair.accrueInterest()).wait()

  //       // // check debt balance
  //       const borrowBalance = await (await DebtWrapperToken.balanceOf(zubi)).toNumber()
  //       console.log({ borrowBalance })

  //       // mine
  //       // await advanceNBlocks(1000)

  //       // repay everything
  //     })
  //   })

  // })

  describe("riskConfiguration", async () => {
    it("riskConfig", async () => {
      const { LendingPair } = vars;
      const {
        depositCollateralLimit,
        depositBorrowLimit,
        totalPairDebtLimit,
      } = await LendingPair.riskConfig();

      expect(depositCollateralLimit).to.equal(0);
      expect(depositBorrowLimit).to.equal(0);
      expect(totalPairDebtLimit).to.equal(0);
    });

    it("updateRiskConfig", async () => {
      const {
        LendingPair,
        accounts: [guardian, stephon],
      } = vars;

      const helper = await setupAndInitLendingPair(vars, {
        ...defaultLendingPairInitVars,
        account: guardian,
      });
      const prevConfig = await LendingPair.riskConfig();

      // reverted when not-guardian tries to update
      await expect(
        LendingPair.connect(stephon.signer).updateRiskConfig(prevConfig)
      ).to.be.revertedWith("O_G");

      // reverted when tries to update with previous data
      await expect(
        LendingPair.connect(guardian.signer).updateRiskConfig(prevConfig)
      ).to.be.revertedWith("Invalid collaterLimit");

      await helper.approveLendingPairInVault(stephon, true);
      await helper.depositBorrowAsset(stephon, 100);

      // reverted when tries to update with invalid data
      await expect(
        LendingPair.connect(guardian.signer).updateRiskConfig({
          depositCollateralLimit: 1,
          depositBorrowLimit: 2,
          totalPairDebtLimit: 3,
        })
      ).to.be.revertedWith("Invalid borrowLimit");

      // success case
      await expect(
        LendingPair.connect(guardian.signer).updateRiskConfig({
          depositCollateralLimit: 1,
          depositBorrowLimit: 100,
          totalPairDebtLimit: 3,
        })
      )
        .to.emit(LendingPair, "UpdateRiskConfiguration")
        .withArgs(1, 100, 3, await lastBlockNumber());
    });

    it("check limit when deposit & borrow", async () => {
      const {
        LendingPair,
        accounts: [guardian, stephon],
      } = vars;

      const helper = await setupAndInitLendingPair(vars, {
        ...defaultLendingPairInitVars,
        account: guardian,
      });
      await helper.approveLendingPairInVault(stephon, true);

      const prevConfig = await LendingPair.riskConfig();

      // success when deposit & borrow when limit is set to 0
      await expect(helper.depositBorrowAsset(stephon, 15)).to.not.reverted;
      await expect(helper.depositCollateralAsset(stephon, 15)).to.not.reverted;
      await expect(LendingPair.connect(stephon.signer).borrow(10, stephon.address)).to.not.reverted;

      const newConfig = {
        depositCollateralLimit: 150,
        depositBorrowLimit: 150,
        totalPairDebtLimit: 100,
      };

      await LendingPair.connect(guardian.signer).updateRiskConfig(newConfig);

      // success when deposit borrow assets that are less than limit
      await expect(helper.depositBorrowAsset(stephon, 135)).to.not.reverted;

      // revert when deposit borrow assets that exceeds limit
      await expect(helper.depositBorrowAsset(stephon, 1)).to.be.revertedWith(
        "Exceeds Deposit Borrow Limit"
      );

      // success when deposit borrow assets that are less than limit
      await expect(helper.depositCollateralAsset(stephon, 135)).to.not.reverted;

      // revert when deposit borrow assets that exceeds limit
      await expect(helper.depositCollateralAsset(stephon, 1)).to.be.revertedWith(
        "Exceeds Deposit Collateral Limit"
      );

      // success when borrow amount that is less than limit
      await expect(LendingPair.connect(stephon.signer).borrow(90, stephon.address)).to.not.reverted;

      // revert when borrow amount that exceeds limit
      await expect(
        LendingPair.connect(stephon.signer).borrow(1, stephon.address)
      ).to.be.revertedWith("Exceeds Total Pair Debt Limit");
    });
  });
});
