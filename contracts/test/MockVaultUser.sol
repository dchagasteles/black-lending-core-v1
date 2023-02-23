// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;
import "../interfaces/IBSVault.sol";

contract MockVaultUser {
    function execute(IBSVault _vault, address _approve) external {
        _vault.approveContract(address(this), _approve, true, 0, 0, 0);
    }

    function attack(IBSVault _vault) external {
        _vault.approveContract(address(this), address(this), true, 0, 0, 0);
    }
}
