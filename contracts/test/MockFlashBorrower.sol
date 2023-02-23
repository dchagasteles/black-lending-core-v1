// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IERC3156FlashBorrower.sol";
import "../interfaces/IERC3156FlashLender.sol";

/// Dummy contract to test FlashLoan

contract MockFlashBorrower is IERC3156FlashBorrower {
    function onFlashLoan(
        address _initiator,
        address _token,
        uint256 _amount,
        uint256 _fees,
        bytes calldata data
    ) external override returns (bytes32) {
        require(_initiator != address(0), "sender is 0");
        require(data.length >= 0, "data < 0");
        bool shouldAddFees = abi.decode(data, (bool));

        if (shouldAddFees) {
            IERC20(_token).approve(msg.sender, _amount + _fees);
        } else {
            IERC20(_token).approve(msg.sender, _amount);
        }
        // IERC20(_token).transfer(msg.sender, _amount + _fees);
        return keccak256("ERC3156FlashBorrower.onFlashLoan");
    }

    function borrow(
        address _lender,
        address _token,
        uint256 _amount
    ) external {
        IERC3156FlashLender(_lender).flashLoan(
            IERC3156FlashBorrower(address(this)),
            _token,
            _amount,
            "0x"
        );
    }
}
