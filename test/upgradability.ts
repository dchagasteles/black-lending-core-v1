import { ethers, waffle, deployments } from "hardhat";
import { Signer } from "ethers";
import { expect, assert } from "chai";
import { MockLendingPair as BMockLendingPair, UUPSProxy as BUUPSProxy } from "../types";
import { deployMockLendingPair, deployUUPSProxy } from "../helpers/contracts";
import { ContractId } from "../helpers/types"

let UUPSProxy: BUUPSProxy
let MockLendingPair: BMockLendingPair

describe("UUPSProxy", function() {

    before(async function() {
        const deployment = await deployments.fixture(ContractId.UUPSProxy)
        MockLendingPair = await deployMockLendingPair()
        if (!(await deployments.getOrNull(ContractId.UUPSProxy))) {
            // deploy mock
            UUPSProxy = await deployUUPSProxy();
        } else {
            UUPSProxy = await ethers.getContractAt(ContractId.UUPSProxy, deployment[ContractId.UUPSProxy].address) as BUUPSProxy
        }
    })

    describe("initializeProxy", function() {
        it("initializeProxy - fails when address is 0", async function() {
            await expect(
                UUPSProxy.initializeProxy(ethers.constants.AddressZero)
            ).to.be.revertedWith("UUPSProxy: zero address")
        })

        it("initializeProxy - fails when already initialized", async function() {
            await UUPSProxy.initializeProxy(MockLendingPair.address)

            await expect(
                UUPSProxy.initializeProxy(MockLendingPair.address)
            ).to.be.revertedWith("UUPSProxy: already initialized")
        })
    })
})
