// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;
import "../Vault.sol";
import "hardhat/console.sol";

contract VaultStorageLayoutTester is Vault {
    constructor() Vault() {}

    function validateStorageLayout() external pure {
        uint256 slot;
        uint256 offset;

        assembly {
            slot := flashLoanRate.slot
            offset := flashLoanRate.offset
        }
        require(slot == 2 && offset == 0, "flashloan rate has changed location");

        assembly {
            slot := owner.slot
            offset := owner.offset
        }
        require(slot == 3 && offset == 0, "owner has changed location");

        assembly {
            slot := newOwner.slot
            offset := newOwner.offset
        }
        require(slot == 4 && offset == 0, "owner has changed location");

        assembly {
            slot := _CACHED_DOMAIN_SEPARATOR.slot
            offset := _CACHED_DOMAIN_SEPARATOR.offset
        }
        require(slot == 5 && offset == 0, "_CACHED_DOMAIN_SEPARATOR rate has changed location");

        assembly {
            slot := balanceOf.slot
            offset := balanceOf.offset
        }
        require(slot == 6 && offset == 0, "balanceOf rate has changed location");

        assembly {
            slot := userApprovedContracts.slot
            offset := userApprovedContracts.offset
        }
        require(slot == 7 && offset == 0, "userApprovedContracts rate has changed location");

        assembly {
            slot := userApprovalNonce.slot
            offset := userApprovalNonce.offset
        }

        require(slot == 8 && offset == 0, "userApprovedContracts rate has changed location");

        assembly {
            slot := allowedContracts.slot
            offset := allowedContracts.offset
        }
        require(slot == 9 && offset == 0, "allowedContracts has changed location");

        assembly {
            slot := totals.slot
            offset := totals.offset
        }
        require(slot == 10 && offset == 0, "totals has changed location");
    }
}
