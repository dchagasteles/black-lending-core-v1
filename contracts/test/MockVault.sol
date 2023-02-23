// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "../Vault.sol";
import "./MockToken.sol";

contract MockVault is Vault {
    constructor() Vault() {}

    function addProfit(MockToken _token, uint256 _amount) external {
        // increase the underlying amount
        _token.mint(address(this), _amount);
    }
}
