import { ethers, waffle } from "hardhat";
import { BigNumber, Signer } from "ethers";
import { expect, assert } from "chai";
import { defaultLendingPairInitVars, runTestSuite, setupAndInitLendingPair } from "./lib";

runTestSuite("BorrowToken/CollateralToken", (vars) => {
    it('underlying', async () => {
        const { BorrowWrapperToken, CollateralWrapperToken, BorrowAsset, CollateralAsset, accounts: [admin, bob] } = vars
        const helper = await setupAndInitLendingPair(
            vars,
            {...defaultLendingPairInitVars, account: admin }
        )

        expect(await BorrowWrapperToken["underlying()"]()).to.eq(BorrowAsset.address)
        expect(await CollateralWrapperToken["underlying()"]()).to.eq(CollateralAsset.address)
    })

    it("only owner can mint", async () => {
        const { BorrowWrapperToken, CollateralWrapperToken, accounts: [admin, bob] } = vars

        await setupAndInitLendingPair(
            vars,
            {...defaultLendingPairInitVars, account: admin }
        )

        await expect(
            BorrowWrapperToken.mint(bob.address, 10)
        ).to.revertedWith("ONLY_LENDING_PAIR")

        await expect(
            CollateralWrapperToken.mint(bob.address, 10)
        ).revertedWith("ONLY_LENDING_PAIR")

    })

    it("only owner can burn", async() => {
        const { BorrowWrapperToken, CollateralWrapperToken, accounts: [admin, bob] } = vars

        const helper = await setupAndInitLendingPair(
            vars,
            {...defaultLendingPairInitVars, account: admin }
        )

        await expect(
            BorrowWrapperToken.burn(bob.address, 10)
        ).to.revertedWith("ONLY_LENDING_PAIR")

        await expect(
            CollateralWrapperToken.burn(bob.address, 10)
        ).revertedWith("ONLY_LENDING_PAIR")

    })

    it("permit", async() => {
        const { BorrowWrapperToken, CollateralWrapperToken, accounts: [admin, bob] } = vars

        const helper = await setupAndInitLendingPair(
            vars,
            {...defaultLendingPairInitVars, account: admin }
        )
        
        const amountToPermit = 100
        await expect(helper.permit(BorrowWrapperToken, admin, bob, amountToPermit)).to.not.reverted

        expect((await BorrowWrapperToken.allowance(admin.address, bob.address)).toNumber()).to.eq(amountToPermit)
    })

    it('transfer/transferFrom', async() => {
        const { BorrowWrapperToken, CollateralWrapperToken, accounts: [admin, bob] } = vars

        const helper = await setupAndInitLendingPair(
            vars,
            {...defaultLendingPairInitVars, account: admin, accountsToApproveInVault: [admin, bob] },
        )

        await helper.depositBorrowAsset(admin, 100)
        await helper.depositCollateralAsset(admin, 100)
        
        const amountToTransfer = 1
        await expect(BorrowWrapperToken.connect(admin.signer).transfer(bob.address, amountToTransfer)).to.not.be.reverted
        await expect(CollateralWrapperToken.transfer(bob.address, amountToTransfer)).to.not.reverted

        expect(await (await BorrowWrapperToken.balanceOf(bob.address)).toNumber()).to.eq(amountToTransfer)
        expect((await CollateralWrapperToken.balanceOf(bob.address)).toNumber()).to.eq(amountToTransfer)

        // approve and transferFrom
        const amountToApprove = 10
        await expect(BorrowWrapperToken.approve(bob.address, amountToApprove)).to.not.reverted
        await expect(CollateralWrapperToken.approve(bob.address, amountToApprove)).to.not.reverted

        // reverts because amount exceeds allowed
        await expect(BorrowWrapperToken.transferFrom(admin.address, bob.address, 11)).to.reverted

        await expect(BorrowWrapperToken.connect(bob.signer).transferFrom(admin.address, bob.address, amountToApprove / 2)).to.not.reverted
        await expect(CollateralWrapperToken.connect(bob.signer).transferFrom(admin.address, bob.address, amountToApprove / 2)).to.not.reverted

        await expect((await BorrowWrapperToken.allowance(admin.address, bob.address)).toNumber()).to.eq(amountToApprove / 2)
        await expect((await CollateralWrapperToken.allowance(admin.address, bob.address)).toNumber()).to.eq(amountToApprove / 2)
    })

    it("increaseAllowance/decreaseAllowance", async() => {
        const { BorrowWrapperToken, CollateralWrapperToken, accounts: [admin, bob] } = vars

        const allowance = 10

        await expect(
            BorrowWrapperToken.increaseAllowance(bob.address, allowance)
        ).to.not.be.reverted
        
        expect(await (await BorrowWrapperToken.allowance(admin.address, bob.address)).toNumber()).to.eq(allowance)
        
        const decreaseAllowance = 1
        await expect(
            BorrowWrapperToken.decreaseAllowance(bob.address, decreaseAllowance)
        ).to.not.reverted

        expect(await (await BorrowWrapperToken.allowance(admin.address, bob.address)).toNumber()).to.eq(allowance - decreaseAllowance)

        await expect(
            BorrowWrapperToken.connect(bob.signer).decreaseAllowance(admin.address, decreaseAllowance)
        ).to.revertedWith('')
    })
    
})
