// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "../interfaces/IBalancerVaultV2.sol";
import "./MockToken.sol";

contract MockBalancerVault {
    constructor() {}

    function swap(
        IBalancerVaultV2.SingleSwap memory singleSwap,
        IBalancerVaultV2.FundManagement memory funds,
        uint256 limit,
        uint256 deadline
    ) external returns (uint256) {
        MockToken tokenIn = MockToken(singleSwap.assetIn);
        MockToken tokenOut = MockToken(singleSwap.assetOut);

        tokenIn.transferFrom(funds.sender, address(this), limit);

        tokenOut.mint(address(this), limit);

        tokenOut.transfer(funds.recipient, limit);

        return limit;
    }
}
