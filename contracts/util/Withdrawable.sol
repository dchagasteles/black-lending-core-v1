// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

////////////////////////////////////////////////////////////////////////////////////////////
///
/// @title Withdrawable
/// @author @conlot-crypto
/// @notice withdraw ERC20 tokens and Ether from the contract
///
////////////////////////////////////////////////////////////////////////////////////////////

contract Withdrawable is Ownable {
    using SafeERC20 for IERC20;

    address constant ETHER = address(0);

    event LogWithdraw(address indexed to, address indexed asset, uint256 amount, uint256 timestamp);

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}

    /// @dev Withdraw asset.
    /// @param asset Asset to be withdrawn.
    function withdraw(address asset) public onlyOwner {
        uint256 assetBalance;
        if (asset == ETHER) {
            address self = address(this); // workaround for a possible solidity bug
            assetBalance = self.balance;
            payable(msg.sender).transfer(assetBalance);
        } else {
            assetBalance = IERC20(asset).balanceOf(address(this));
            IERC20(asset).safeTransfer(msg.sender, assetBalance);
        }
        emit LogWithdraw(msg.sender, asset, assetBalance, block.timestamp);
    }
}
