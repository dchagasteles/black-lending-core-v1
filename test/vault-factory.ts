import { ethers, waffle } from "hardhat";
import { BigNumber, Signer } from "ethers";
import { expect, assert } from "chai";
import { runTestSuite, TestVars } from "./lib";

const flashLoanRate = ethers.utils.parseUnits("0.05", 18);

runTestSuite("Vault Factory", (vars: TestVars) => {
    it('updateVaultLogic', async () => {
        const {
            VaultFactory,
            blackSmithTeam,
            accounts: [admin, bob]
        } = vars
        
        await expect(
            VaultFactory.updateVaultLogic(bob.address)
        ).to.be.revertedWith("ONLY_OWNER")

        await expect(
            await VaultFactory.connect(blackSmithTeam.signer).updateVaultLogic(bob.address)
        ).to.emit(VaultFactory, 'VaultUpdated')

        expect(await VaultFactory.vaultLogic()).to.eq(bob.address)
    })

    it("createUpgradableVault", async () => {
        const {
            VaultFactory,
            Vault,
            blackSmithTeam,
            accounts: [admin, bob]
        } = vars

        await expect(
            VaultFactory.createUpgradableVault(flashLoanRate, bob.address)
        ).to.be.revertedWith("ONLY_OWNER")
        
        const createTx = await (await VaultFactory.connect(blackSmithTeam.signer).createUpgradableVault(flashLoanRate, bob.address)).wait()
        const newVaultEv = createTx!.events!.find((x: any) => x.event === "NewVault")
        const addr = newVaultEv!.args!.vault;

        expect(
            await Vault.attach(addr).owner()
        ).to.be.eq(bob.address)

        expect(
            await (await Vault.attach(addr)["flashLoanRate()"]()).toString()
        ).to.be.eq(flashLoanRate.toString())

        expect((await Vault.name()).toString()).to.eq("WarpVault v1");
        expect((await Vault.version()).toString()).to.eq("1");

    })
})