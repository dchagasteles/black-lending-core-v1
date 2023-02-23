import { ethers, waffle } from "hardhat";
import { Signer } from "ethers";
import { expect, assert } from "chai";
import { runTestSuite, TestVars } from "./lib";
import { deployMockVault, deployProxiedVault, deployVaultStorageLayoutTester } from "../helpers/contracts";

runTestSuite("Vault - Upgradable Layout", (vars: TestVars) => {
    it("updateCode", async function() {
        const { Vault, accounts: [admin,  bob]} = vars
        const flashLoanRate = ethers.utils.parseUnits("0.05", 18);

        const newVault = await deployMockVault()
        const proxiedVault = await deployProxiedVault(Vault.address)

        // initialize proxiedVault
        await proxiedVault.initialize(flashLoanRate, admin.address);
        console.log(proxiedVault.address)

        expect(await proxiedVault.flashLoanRate()).to.eq(flashLoanRate)
        expect(await proxiedVault.owner()).to.eq(admin.address)

        const currentImplAddress = await proxiedVault.getCodeAddress();
        expect(currentImplAddress).to.eq(Vault.address)

        const uuid = (await Vault.proxiableUUID()).toString()

        const receipt =  await (await proxiedVault.updateCode(newVault.address)).wait()

        assert.ok(receipt.events?.find(x => x.event === 'CodeUpdated'), 'should emit CodeUpdated event')

        // @TODO introduce grace period
        const newImplAddress = await proxiedVault.getCodeAddress()
        expect(newImplAddress).to.eq(newVault.address)        
    })

    it("test storage layout", async function() {
        const storageLayoutTester = await deployVaultStorageLayoutTester()
        await expect(storageLayoutTester.validateStorageLayout()).to.not.be.reverted;
    })
})