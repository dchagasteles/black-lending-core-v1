import { ethers, waffle } from "hardhat";
import { BigNumber, Signer } from "ethers";
import { expect, assert } from "chai";
import {
  runTestSuite,
  setupAndInitLendingPair,
  TestVars,
  defaultLendingPairInitVars,
  setupLiquidationHelper,
} from "./lib";

const amountToDeposit = 1000;

runTestSuite("liquidationHelper", (vars: TestVars) => {
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

    // deposit collateral && borrow
    await helper.depositCollateralAsset(james, amountToDeposit);
    await helper.depositBorrowAsset(admin, amountToDeposit);

    // do borrow
    await LendingPair.connect(james.signer).borrow(500, james.address);

    // change price (set oracle price to half)
    await (await BorrowAssetMockPriceOracle.setPrice(BigNumber.from(3000).pow(8))).wait();

    // liquidation logic
    const { MockLiquidationHelper } = await setupLiquidationHelper(vars);
    const prevCollaterBalance = (await CollateralAsset.balanceOf(frank.address)).toNumber();

    await MockLiquidationHelper.connect(frank.signer).flashLoanToLiquidate(
      LendingPair.address,
      [james.address],
      amountToDeposit * 3
    );

    const afterCollaterBalance = (await CollateralAsset.balanceOf(frank.address)).toNumber();
    expect(afterCollaterBalance).to.be.gt(prevCollaterBalance);
  });
});
