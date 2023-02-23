import { ethers, waffle } from "hardhat";
import { BigNumber, Signer } from "ethers";
import { expect, assert } from "chai";

import { 
    deployMockChainlinkUSDAdapter,
    deployMockToken,
    deployPriceOracleAggregator
} from "../helpers/contracts";
import {
    MockToken, PriceOracleAggregator as BPriceOracleAggregator, 
    MockChainlinkUSDAdapter as BMockChainlinkUSDAdapter,
    UUPSProxiable} from "../types";
import { deployUUPSProxy } from "../helpers/contracts";
import { ContractId } from "../helpers/types";

// list of accounts
let accounts: Signer[];

let PriceOracleAggregator: BPriceOracleAggregator
let MockChainlinkUSDAdapter: BMockChainlinkUSDAdapter
let admin: string; // account used in deploying
let bob: string;
let frank: string;
let asset: MockToken

describe('PriceOracleAggregator', function() {

    before(async function() {
        accounts = await ethers.getSigners();
        ([
            admin,
            bob,
            frank,
          ] = await Promise.all(accounts.slice(0, 5).map(x => x.getAddress())))
      
        PriceOracleAggregator = await deployPriceOracleAggregator(admin)
        asset = await deployMockToken()
        MockChainlinkUSDAdapter = await deployMockChainlinkUSDAdapter()
    })

    it("correct team address", async function() {
        expect(await PriceOracleAggregator.owner()).to.eq(admin)
    })

    it("updateOracleForAsset - fails for non admin", async function(){
        await expect(
            PriceOracleAggregator.connect(await ethers.getSigner(frank)).setOracleForAsset(
                [asset.address],
                [bob]
            )
        ).to.revertedWith('ONLY_OWNER')
    })


    it("updateOracleForAsset - fails for invalid oracle adddress", async function(){
        await expect(
            PriceOracleAggregator.setOracleForAsset(
                [asset.address],
                [ethers.constants.AddressZero]
            )
        ).to.revertedWith('INVALID_ORACLE')
    })

    it('getPriceInUSD - fails for non existent oracle', async function() {
        await expect(
            PriceOracleAggregator.getPriceInUSD(frank)
        ).revertedWith('INVALID_PRICE')
    })

    it("setOracleForAsset", async function() {
        await expect(
            PriceOracleAggregator.setOracleForAsset(
                [asset.address],
                [MockChainlinkUSDAdapter.address]
            )
        ).to.emit(PriceOracleAggregator, 'UpdateOracle')
        .withArgs(asset.address, MockChainlinkUSDAdapter.address)

        // view price
        expect(
            await (await PriceOracleAggregator.getPriceInUSD(asset.address)).toString()
        ).to.eq('100000000')
    })

    // it('price oracle proxy', async function() {
    //     const uups = await deployUUPSProxy();
    //     await uups.initializeProxy(PriceOracleAggregator.address);
    //     expect(
    //         await PriceOracleAggregator.attach(uups.address)["admin()"]()
    //     ).to.eq(admin)
    // })

})