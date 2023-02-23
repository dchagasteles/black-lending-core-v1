// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockUniswapV2Router02 {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256, /*amountOutMin*/
        address[] calldata path,
        address to,
        uint256 /*deadline*/
    ) external virtual returns (uint256[] memory amounts) {
        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
        IERC20(path[2]).transfer(to, amountIn);
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        amounts[1] = amountIn;
        amounts[2] = amountIn;
    }
}
