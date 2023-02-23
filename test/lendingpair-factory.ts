import { ethers, waffle } from "hardhat";
import { BigNumber, Event, Signer } from "ethers";
import { expect, assert } from "chai";
import { runTestSuite, TestVars } from "./lib";

const irParams = {
  baseRatePerYear: "30000000000000000",
  multiplierPerYear: "52222222222200000",
  jumpMultiplierPerYear: "70",
  optimal: "1000000000000000000",
  blocksPerYear: "2102400",
  borrowRateMaxMantissa: BigNumber.from(5).mul(BigNumber.from(10).pow(13)),
};

const getIRAddressFromTx = (ev: Array<Event>) => {
  const v = ev?.find((x) => x.event === "NewInterestRateModel");
  return v!.args!.ir;
};

const createIRAndReturnAddress = async (vars: TestVars): Promise<string> => {
  const modelTx = await (
    await vars.LendingPairFactory.connect(vars.blackSmithTeam.signer).createIR(
      irParams,
      vars.blackSmithTeam.address
    )
  ).wait();

  const modelEv = modelTx.events?.find((x) => x.event === "NewInterestRateModel");

  return modelEv!.args!.ir;
};

runTestSuite("LendingPairFactory", (vars: TestVars) => {
  it("transferOwnership", async () => {
    const {
      LendingPairFactory,
      accounts: [bob],
    } = vars;

    await expect(LendingPairFactory.transferOwnership(bob.address)).to.revertedWith("ONLY_OWNER");

    await expect(
      LendingPairFactory.connect(vars.blackSmithTeam.signer).transferOwnership(
        ethers.constants.AddressZero
      )
    ).to.revertedWith("INVALID_NEW_OWNER");

    await expect(
      LendingPairFactory.connect(vars.blackSmithTeam.signer).transferOwnership(bob.address)
    ).to.not.reverted;
  });

  it("acceptOwnership", async () => {
    const {
      LendingPairFactory,
      accounts: [bob],
    } = vars;

    LendingPairFactory.connect(vars.blackSmithTeam.signer).transferOwnership(bob.address);

    await expect(
      LendingPairFactory.connect(vars.blackSmithTeam.signer).acceptOwnership()
    ).to.revertedWith("invalid owner");

    LendingPairFactory.connect(bob.signer).acceptOwnership();

    expect(await LendingPairFactory["owner()"]()).to.be.eq(bob.address);
  });

  it("updatePairImpl", async () => {
    const {
      LendingPairFactory,
      accounts: [admin, bob],
    } = vars;

    await expect(LendingPairFactory.updatePairImpl(bob.address)).to.revertedWith("ONLY_OWNER");

    await expect(
      LendingPairFactory.connect(vars.blackSmithTeam.signer).updatePairImpl(
        ethers.constants.AddressZero
      )
    ).to.revertedWith("INV_C");

    await expect(LendingPairFactory.connect(vars.blackSmithTeam.signer).updatePairImpl(bob.address))
      .to.not.reverted;

    expect(await LendingPairFactory["lendingPairImplementation()"]()).to.be.eq(bob.address);
  });

  it("updateCollateralWrapperImpl", async () => {
    const {
      LendingPairFactory,
      accounts: [admin, bob],
    } = vars;

    await expect(LendingPairFactory.updateCollateralWrapperImpl(bob.address)).to.revertedWith(
      "ONLY_OWNER"
    );

    await expect(
      LendingPairFactory.connect(vars.blackSmithTeam.signer).updateCollateralWrapperImpl(
        ethers.constants.AddressZero
      )
    ).to.revertedWith("INV_C");

    await expect(
      LendingPairFactory.connect(vars.blackSmithTeam.signer).updateCollateralWrapperImpl(
        bob.address
      )
    ).to.not.reverted;

    expect(await LendingPairFactory["collateralWrapperImplementation()"]()).to.be.eq(bob.address);
  });

  it("updateDebtTokenImpl", async () => {
    const {
      LendingPairFactory,
      accounts: [admin, bob],
    } = vars;

    await expect(LendingPairFactory.updateDebtTokenImpl(bob.address)).to.revertedWith("ONLY_OWNER");

    await expect(
      LendingPairFactory.connect(vars.blackSmithTeam.signer).updateDebtTokenImpl(
        ethers.constants.AddressZero
      )
    ).to.revertedWith("INV_C");

    await expect(
      LendingPairFactory.connect(vars.blackSmithTeam.signer).updateDebtTokenImpl(bob.address)
    ).to.not.reverted;

    expect(await LendingPairFactory["debtTokenImplementation()"]()).to.be.eq(bob.address);
  });

  it("updateBorrowAssetWrapperImpl", async () => {
    const {
      LendingPairFactory,
      accounts: [admin, bob],
    } = vars;

    await expect(LendingPairFactory.updateBorrowAssetWrapperImpl(bob.address)).to.revertedWith(
      "ONLY_OWNER"
    );

    await expect(
      LendingPairFactory.connect(vars.blackSmithTeam.signer).updateBorrowAssetWrapperImpl(
        ethers.constants.AddressZero
      )
    ).to.revertedWith("INV_C");

    await expect(
      LendingPairFactory.connect(vars.blackSmithTeam.signer).updateBorrowAssetWrapperImpl(
        bob.address
      )
    ).to.not.reverted;

    expect(await LendingPairFactory["borrowAssetWrapperImplementation()"]()).to.be.eq(bob.address);
  });

  it("pause", async () => {
    const {
      LendingPairFactory,
      accounts: [admin, bob],
    } = vars;

    await expect(LendingPairFactory.pause()).to.revertedWith("ONLY_OWNER");

    await expect(LendingPairFactory.connect(vars.blackSmithTeam.signer).pause()).to.not.be.reverted;

    expect(await LendingPairFactory["paused()"]()).to.be.true;
  });

  it("unpause", async () => {
    const {
      LendingPairFactory,
      accounts: [admin, bob],
    } = vars;

    await expect(LendingPairFactory.unpause()).to.revertedWith("ONLY_OWNER");

    await LendingPairFactory.connect(vars.blackSmithTeam.signer).pause();

    await expect(LendingPairFactory.connect(vars.blackSmithTeam.signer).unpause()).to.not.be
      .reverted;

    expect(await LendingPairFactory["paused()"]()).to.be.false;
  });

  it("disableIR", async () => {
    const {
      LendingPairFactory,
      accounts: [admin, bob],
    } = vars;
    await LendingPairFactory.connect(vars.blackSmithTeam.signer).createIR(irParams, admin.address);
    // const connectedLendingPair =
    const addr = await createIRAndReturnAddress(vars);

    await expect(LendingPairFactory.disableIR(addr)).to.revertedWith("ONLY_OWNER");

    await expect(
      LendingPairFactory.connect(vars.blackSmithTeam.signer).disableIR(bob.address)
    ).to.revertedWith("IR_NOT_EXIST");

    // disableIR
    await LendingPairFactory.connect(vars.blackSmithTeam.signer).disableIR(addr);

    expect(await LendingPairFactory.validInterestRateModels(addr)).to.be.false;
  });

  it("createIR", async () => {
    const {
      LendingPairFactory,
      accounts: [admin],
    } = vars;

    await expect(LendingPairFactory.createIR(irParams, admin.address)).to.revertedWith(
      "ONLY_OWNER"
    );

    const tx = await (
      await LendingPairFactory.connect(vars.blackSmithTeam.signer).createIR(irParams, admin.address)
    ).wait();

    const ev = tx.events?.find((x) => x.event === "NewInterestRateModel");
    expect(ev).to.be.ok;

    // tslint:disable-next-line
    expect(await LendingPairFactory.validInterestRateModels(ev!.args!.ir)).to.be.true;
  });

  it("createLendingPairWithProxy", async () => {
    const {
      LendingPairFactory,
      LendingPair,
      Vault,
      CollateralAsset,
      BorrowAsset,
      accounts: [admin],
    } = vars;

    const modelTx = await (
      await LendingPairFactory.connect(vars.blackSmithTeam.signer).createIR(irParams, admin.address)
    ).wait();

    const modelEv = modelTx.events?.find((x) => x.event === "NewInterestRateModel");
    const liquidationFee = BigNumber.from(5).mul(BigNumber.from(10).pow(16));
    const collateralFactor = BigNumber.from(15).mul(BigNumber.from(10).pow(17));

    await expect(
      LendingPairFactory.createLendingPairWithProxy(
        "demo",
        "dst",
        admin.address,
        CollateralAsset.address,
        {
          borrowAsset: BorrowAsset.address,
          initialExchangeRateMantissa: "1000000000000000000",
          reserveFactorMantissa: "500000000000000000",
          collateralFactor,
          liquidationFee,
          interestRateModel: modelEv!.args!.ir,
        }
      )
    ).to.revertedWith("ONLY_OWNER");

    await expect(
      LendingPairFactory.connect(vars.blackSmithTeam.signer).createLendingPairWithProxy(
        "demo",
        "dst",
        admin.address,
        CollateralAsset.address,
        {
          borrowAsset: BorrowAsset.address,
          initialExchangeRateMantissa: "1000000000000000000",
          reserveFactorMantissa: "500000000000000000",
          collateralFactor,
          liquidationFee,
          interestRateModel: modelEv!.args!.ir,
        }
      )
    ).to.not.be.reverted;

    const pairAddress = await LendingPairFactory.allPairs(0);

    const lendingPair = LendingPair.attach(pairAddress);

    // confirm data provided is correct
    await expect(await lendingPair.name()).eq("demo");
    await expect(await lendingPair.symbol()).eq("dst");
    await expect(await lendingPair.interestRate()).eq(modelEv!.args!.ir);
    await expect(await lendingPair.pauseGuardian()).eq(admin.address);
    await expect(await lendingPair.collateralAsset()).eq(CollateralAsset.address);
    await expect(await lendingPair.asset()).eq(BorrowAsset.address);
    await expect(await lendingPair.vault()).eq(Vault.address);
    await expect(await lendingPair.interestRate()).eq(modelEv!.args!.ir);
    await expect(await (await lendingPair.liquidationFee()).toString()).eq(
      liquidationFee.toString()
    );
    await expect(await (await lendingPair.collateralFactor()).toString()).eq(
      collateralFactor.toString()
    );
    await expect(await (await lendingPair["feeWithdrawalAddr()"]()).toString()).eq(
      vars.FeeWithdrawal.address
    );
  });
});
