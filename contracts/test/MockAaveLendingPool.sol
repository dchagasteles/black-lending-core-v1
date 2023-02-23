// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/aaveV2/IFlashLoanReceiverV2.sol";
import "./MockToken.sol";

contract MockAaveLendingPool {
    using SafeERC20 for IERC20;
    uint256 public premium;

    constructor(uint256 _premium) {
        premium = _premium;
    }

    function flashLoan(
        address receiverAddress,
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata modes,
        address onBehalfOf,
        bytes calldata params,
        uint16 referralCode
    ) external {
        // transfer assets
        MockToken(assets[0]).mint(receiverAddress, amounts[0]);

        uint256[] memory premiums = new uint256[](1);
        premiums[0] = premium;

        require(
            IFlashLoanReceiverV2(receiverAddress).executeOperation(
                assets,
                amounts,
                premiums,
                msg.sender,
                params
            ),
            "flashloan failed"
        );

        // IERC20(assets[0]).safeTransferFrom(
        //     receiverAddress,
        //     address(this),
        //     amounts[0] + premiums[0]
        // );
    }
}
