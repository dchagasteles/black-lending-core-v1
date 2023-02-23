import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { ContractId } from "../helpers/types"
import { deployAndInitUUPSProxy } from '../helpers/contracts';

const deployFeeWithdrawal: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments: { deploy, get }, getNamedAccounts } = hre;
    const { deployer, blackSmithTeam } = await getNamedAccounts();

    // uses mainnet addresses as defaults
    const warpToken = process.env.warpToken || '0xed40834a13129509a89be39a9be9c0e96a0ddd71'
    const weth = process.env.WETH || '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
    const router = process.env.ROUTER || '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
    // @TODO change to the correct address
    const stakingContract = process.env.STAKING_CONTRACT || '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
    const vault = await get(ContractId.Vault)

    const feeTx = await deploy(ContractId.FeeWithdrawal, {
        from: deployer,
        args: [
            // blackSmithTeam,
            vault.address,
            stakingContract,
            warpToken,
            weth,
            // router
        ],
        log: true,
        deterministicDeployment: true
    });

     // initialize vault proxy
  if (process.env.WITH_PROXY) await deployAndInitUUPSProxy(
        ContractId.FeeWithdrawalProxy,
        feeTx.address
    )

}

export default deployFeeWithdrawal
deployFeeWithdrawal.tags = [ContractId.FeeWithdrawal]
