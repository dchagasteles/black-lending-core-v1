import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { expect } from "chai";
import {
  runTestSuite,
  setupAndInitLendingPair,
  TestVars,
  defaultLendingPairInitVars,
  setupLiquidationHelper,
} from "./lib";

const amountToDeposit = 1000;
const latestBlockTimestamp = async () => (await ethers.provider.getBlock("latest")).timestamp;

runTestSuite("liquidationHelper", (vars: TestVars) => {
  let lendingPairHelper: any;

  beforeEach(async () => {
    const {
      accounts: [admin, james, frank],
    } = vars;

    lendingPairHelper = await setupAndInitLendingPair(vars, {
      ...defaultLendingPairInitVars,
      account: admin,
      accountsToApproveInVault: [frank, admin, james],
    });
  });

  it("liquidate - correctly", async () => {
    const {
      LendingPair,
      BorrowAssetMockPriceOracle,
      CollateralAsset,
      BorrowAsset,
      accounts: [admin, james, frank],
    } = vars;

    // deposit collateral && borrow
    await lendingPairHelper.depositCollateralAsset(james, amountToDeposit);
    await lendingPairHelper.depositBorrowAsset(admin, amountToDeposit);

    // do borrow
    await LendingPair.connect(james.signer).borrow(500, james.address);

    // change price (set oracle price to half)
    await (await BorrowAssetMockPriceOracle.setPrice(BigNumber.from(3000).pow(8))).wait();

    // liquidation logic
    const { LiquidationHelper } = await setupLiquidationHelper(vars);
    const prevCollaterBalance = (await CollateralAsset.balanceOf(frank.address)).toNumber();
    const prevBorrowAssetBalance = (await BorrowAsset.balanceOf(frank.address)).toNumber();

    await LiquidationHelper.connect(frank.signer).flashLoanToLiquidate(
      LendingPair.address,
      [james.address],
      amountToDeposit * 3
    );

    const afterCollaterBalance = (await CollateralAsset.balanceOf(frank.address)).toNumber();
    const afterBorrowAssetBalance = (await BorrowAsset.balanceOf(frank.address)).toNumber();

    expect(afterCollaterBalance).to.be.gt(prevCollaterBalance);
    expect(afterBorrowAssetBalance).to.be.gte(prevBorrowAssetBalance);
  });

  // it("withdraw", async () => {
  //   const {
  //     BorrowAsset,
  //     accounts: [admin, james],
  //   } = vars;
  //   const { LiquidationHelper } = await setupLiquidationHelper(vars);

  //   // reverted when trying to withraw from non-owner
  //   await expect(
  //     LiquidationHelper.connect(james.signer).withdraw(BorrowAsset.address)
  //   ).to.be.revertedWith("Ownable: caller is not the owner");

  //   // transfe ERC20 tokens to liquidationHelper
  //   await BorrowAsset.mint(LiquidationHelper.address, 100);

  //   await expect(LiquidationHelper.withdraw(BorrowAsset.address))
  //     .to.emit(LiquidationHelper, "LogWithdraw")
  //     .withArgs(admin.address, BorrowAsset.address, 100, await latestBlockTimestamp());

  //   // send 0.1 ether to liquidationHelper
  //   const [, , stephon] = await ethers.getSigners();
  //   await stephon.sendTransaction({
  //     to: LiquidationHelper.address,
  //     value: ethers.utils.parseEther("1.0"), // Sends exactly 1.0 ether
  //   });

  //   expect(await await ethers.provider.getBalance(LiquidationHelper.address)).to.be.eq(
  //     ethers.utils.parseEther("1.0")
  //   );

  //   // do ether withdraw
  //   await expect(LiquidationHelper.withdraw(ethers.constants.AddressZero))
  //     .to.emit(LiquidationHelper, "LogWithdraw")
  //     .withArgs(
  //       admin.address,
  //       ethers.constants.AddressZero,
  //       ethers.utils.parseEther("1.0"),
  //       await latestBlockTimestamp()
  //     );
  // });
});
