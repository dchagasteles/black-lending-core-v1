import { ethers, waffle } from "hardhat";
import { BigNumber, Signer } from "ethers";
import { expect, assert } from "chai";
import { DebtToken as BDebtToken, MockToken } from "../types";
import { deployDebtToken, deployMockDistributorManager, deployMockToken } from "../helpers/contracts";

let accounts: Signer[];

let admin: string; // account used in deploying
let bob: string;
let frank: string;
let token: MockToken
let DebtToken: BDebtToken

describe("DebtToken", async function () {
    before(async function() {
        accounts = await ethers.getSigners();
        ([
            admin,
            bob,
            frank,
          ] = await Promise.all(accounts.slice(0, 5).map(x => x.getAddress())))
        token = await deployMockToken()
        DebtToken = await deployDebtToken()
        const mockManager = await deployMockDistributorManager();
        // admin owner
        await DebtToken.initialize(admin, token.address, 'Test', 'TST', mockManager.address)
    })

    // it("mint", async function() {
    //     await DebtToken["mint(address,address,uint256)"](admin, admin, 1000)
    // })

    it("underlying", async function() {
        expect(await DebtToken.underlying()).to.eq(token.address)
    })

    it("mint - fails if not owner", async function() {
        await expect(
            DebtToken.connect(await ethers.getSigner(bob))["mint(address,address,uint256)"](admin, admin, 1000)
        ).to.be.reverted
    })

    it("burn - fails if not owner", async function() {
        await expect(
            DebtToken.connect(await ethers.getSigner(bob)).burn(admin, 1000)
        ).to.be.reverted
    })

    it("transfer", async function() {
        await expect(
            DebtToken.transfer(bob, 1)
        ).revertedWith('TRANSFER_NOT_SUPPORTED')
    })

    it("approve", async function() {
        await expect(
            DebtToken.approve(bob, 1)
        ).revertedWith('APPROVAL_NOT_SUPPORTED')
    })

    it("allowance", async function() {
        await expect(
            DebtToken.allowance(bob, bob)
        ).revertedWith('ALLOWANCE_NOT_SUPPORTED')
    })

    it("transferFrom", async function() {
        await expect(
            DebtToken.transferFrom(bob, bob, 1)
        ).revertedWith('TRANSFER_NOT_SUPPORTED')
    })

    it("increaseAllowance", async function() {
        await expect(
            DebtToken.increaseAllowance(bob, 1)
        ).revertedWith('ALLOWANCE_NOT_SUPPORTED')
    })

    it("decreaseAllowance", async function() {
        await expect(
            DebtToken.increaseAllowance(bob, 1)
        ).revertedWith('ALLOWANCE_NOT_SUPPORTED')
    })

    it("increaseTotalDebt - fails if not owner", async function() {
        await expect(
            DebtToken.connect(await ethers.getSigner(bob)).increaseTotalDebt(1000)
        ).to.be.revertedWith("ONLY_LENDING_PAIR")
    })

    it("increaseTotalDebt", async function() {
        const totalDebt = (await DebtToken.totalSupply()).toNumber()
        const debToIncrease = 1000

        await DebtToken.increaseTotalDebt(debToIncrease)

        expect((await DebtToken.totalSupply()).toNumber()).eq(totalDebt + debToIncrease)
    })
})

