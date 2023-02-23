import { IPAIRS } from '../types';
import { BigNumber, Event, Signer } from "ethers";

const liquidationFee = BigNumber.from(5).mul(BigNumber.from(10).pow(16))
const collateralFactor = BigNumber.from(15).mul(BigNumber.from(10).pow(17))
export const _PAIRS: IPAIRS = {
  'ETH-USDC-PAIR': {
    symbol: 'ETHUSDC',
    pauseGuardian: '0x0000000000000000000000000000000000000000',
    collateralAsset: '0x0000000000000000000000000000000000000000',
    borrowVars: {
      borrowAsset: '0x0000000000000000000000000000000000000000',
      initialExchangeRateMantissa: '0',
      reserveFactorMantissa: '0',
      collateralFactor: '0',
      liquidationFee: '0',
      interestRateModel: '0x0000000000000000000000000000000000000000',
    },
  },
  'TEST-PAIR': {
    symbol: 'ETHUSDC',
    pauseGuardian: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    collateralAsset: '0x1484a6020A0F08400F6f56715016d2C80e26cDC1',
    borrowVars: {
      borrowAsset: '0x1484a6020A0F08400F6f56715016d2C80e26cDC1',
      initialExchangeRateMantissa: '1000000000000000000',
      reserveFactorMantissa: '500000000000000000',
      collateralFactor: collateralFactor.toString(),
      liquidationFee: liquidationFee.toString(),
      interestRateModel: '0x8a8e3698779b556e65ec1fe9fc1e2892f7a19e2b',
    },
  },
}