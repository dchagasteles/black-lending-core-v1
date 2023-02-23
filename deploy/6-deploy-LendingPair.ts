import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { ContractId } from "../helpers/types"
import { BigNumber } from '@ethersproject/bignumber';
import { Contract } from 'ethers';

const deployLendingPair: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments: { deploy, get }, getNamedAccounts } = hre;
  const { deployer, blackSmithTeam } = await getNamedAccounts();

  const useProxy = !!process.env.WITH_PROXY

  const vault = useProxy ? await get(ContractId.VaultProxy): await get(ContractId.Vault)
  const oracle = await get(ContractId.PriceOracleAggregator)
  const feeWithdrawalAddr = useProxy ? await get(ContractId.FeeWithdrawalProxy): await get(ContractId.FeeWithdrawal)
  /// fee share of liquidation fees that goes to the protocol
  /// 0.005%
  const liquidationFeeShare = BigNumber.from(5).mul(BigNumber.from(10).pow(16))

  await deploy(ContractId.LendingPair, {
    from: deployer,
    args: [
      vault.address,
      oracle.address,
      feeWithdrawalAddr.address,
      liquidationFeeShare,
    ],
    log: true,
    deterministicDeployment: true
  });

};

export default deployLendingPair
deployLendingPair.tags = [ContractId.LendingPair]
deployLendingPair.dependencies = [
  ContractId.FeeWithdrawal,
  ContractId.Vault,
  ContractId.PriceOracleAggregator
]
